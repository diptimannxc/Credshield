const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// ─── Internal helper: get ML prediction from Flask service ────────────────────

async function getPrediction(score, avgDelay, exposure) {
  try {
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, avg_delay: avgDelay, exposure }),
    });

    if (!response.ok) {
      // MUST drain the body to prevent socket leaks that crash Node
      await response.text().catch(() => {});
      throw new Error(`ML service returned ${response.status}`);
    }

    const data = await response.json();
    return {
      delayProbability: data.delayProbability,
      predictedDelay: data.predictedDays,
    };
  } catch (err) {
    console.warn('ML prediction fallback:', err.message);
    // Fallback — predictedDelay MUST be numeric (not a string like "5-7 Days")
    // or MySQL inserts break
    return { delayProbability: 25, predictedDelay: 6 };
  }
}

// ─── Core: recompute a buyer's risk profile from their invoice history ────────

async function recomputeCustomerRiskProfile(customerId) {
  const [invoices] = await db.query(
    'SELECT * FROM invoices WHERE customer_id = ?',
    [customerId]
  );

  if (invoices.length === 0) {
    await db.query(
      `UPDATE customers 
       SET volume = 0, exposure = 0, avg_delay = NULL, score = NULL, risk_level = NULL 
       WHERE id = ?`,
      [customerId]
    );
    return;
  }

  // Volume = sum of ALL invoice amounts
  const volume = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

  // Exposure = sum of non-Paid invoice amounts
  const exposure = invoices
    .filter((inv) => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  // Only score buyers who have at least one Paid invoice with a real paid_date
  const paidWithDate = invoices.filter(
    (inv) => inv.status === 'Paid' && inv.paid_date
  );

  if (paidWithDate.length === 0) {
    // "Not yet scored" — never guess a number
    await db.query(
      `UPDATE customers 
       SET volume = ?, exposure = ?, avg_delay = NULL, score = NULL, risk_level = NULL 
       WHERE id = ?`,
      [volume, exposure, customerId]
    );
    return;
  }

  // ── Transparent scoring formula ──
  // Higher score = higher risk (opposite of real-world credit score)

  // avgDelay = average of (paid_date - due_date) in days across paid invoices
  const avgDelay =
    paidWithDate.reduce((sum, inv) => {
      const paid = new Date(inv.paid_date);
      const due = new Date(inv.due_date);
      const diffDays = (paid - due) / (1000 * 60 * 60 * 24);
      return sum + diffDays;
    }, 0) / paidWithDate.length;

  const overdueCount = invoices.filter(
    (inv) => inv.status === 'Overdue'
  ).length;
  const overdueRatio = overdueCount / invoices.length;
  const exposureRatio = volume > 0 ? exposure / volume : 0;

  const rawScore =
    300 + avgDelay * 10 + overdueRatio * 150 + exposureRatio * 50;
  const score = Math.max(300, Math.min(1000, Math.round(rawScore)));

  let riskLevel;
  if (score >= 800) riskLevel = 'HIGH';
  else if (score >= 400) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  await db.query(
    `UPDATE customers 
     SET volume = ?, exposure = ?, avg_delay = ?, score = ?, risk_level = ? 
     WHERE id = ?`,
    [volume, exposure, Math.round(avgDelay * 10) / 10, score, riskLevel, customerId]
  );
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/', (req, res) => {
  res.send('CredShield backend is running!');
});

// ── Live prediction endpoint for Risk Analysis simulator ──
app.post('/api/predict', async (req, res) => {
  try {
    const { score, avgDelay, exposure } = req.body;
    if (score == null || avgDelay == null || exposure == null) {
      return res.status(400).json({ error: 'Missing required fields: score, avgDelay, exposure' });
    }
    const prediction = await getPrediction(score, avgDelay, exposure);
    res.json({
      // Convert delayProbability from 0-100 int to 0.0-1.0 float for the frontend
      delayProbability: prediction.delayProbability / 100,
      predictedDays: prediction.predictedDelay,
    });
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// ── Customers ──

// GET all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, industry, score,
              risk_level   AS riskLevel,
              avg_delay     AS avgDelay,
              CAST(exposure AS DECIMAL(12,2))+0 AS exposure,
              CAST(volume   AS DECIMAL(12,2))+0 AS volume,
              since_year    AS \`since\`,
              logo_text     AS logoText,
              notes
       FROM customers`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// POST create customer
app.post('/api/customers', async (req, res) => {
  try {
    const {
      name,
      industry,
      score = null,
      riskLevel = null,
      avgDelay = null,
      exposure = 0,
      volume = 0,
      since,
      logoText,
      notes = null,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO customers (name, industry, score, risk_level, avg_delay, exposure, volume, since_year, logo_text, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, industry, score, riskLevel, avgDelay, exposure, volume, since, logoText, notes]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      industry,
      score,
      riskLevel,
      avgDelay,
      exposure,
      volume,
      since,
      logoText,
      notes,
    });
  } catch (err) {
    console.error('POST /api/customers error:', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// DELETE customer (cascade deletes invoices)
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    console.error('DELETE /api/customers error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// PATCH update customer notes
app.patch('/api/customers/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    await db.query('UPDATE customers SET notes = ? WHERE id = ?', [
      notes,
      req.params.id,
    ]);
    res.json({ message: 'Notes updated' });
  } catch (err) {
    console.error('PATCH /api/customers/:id/notes error:', err);
    res.status(500).json({ error: 'Failed to update notes' });
  }
});

// ── Invoices ──

// GET all invoices (joined with customer name)
app.get('/api/invoices', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.id, i.customer_id, c.name AS buyerName,
              i.invoice_number AS invoiceNumber,
              i.amount,
              DATE_FORMAT(i.due_date, '%b %e, %Y') AS dueDate,
              i.status,
              i.delay_probability AS delayProbability,
              i.predicted_delay AS predictedDelay,
              i.paid_date AS paidDate
       FROM invoices i
       JOIN customers c ON i.customer_id = c.id`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/invoices error:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// POST create invoice
app.post('/api/invoices', async (req, res) => {
  try {
    const { buyerName, invoiceNumber, amount, dueDate, status = 'Pending' } =
      req.body;

    // Look up customer_id by name
    const [customers] = await db.query(
      'SELECT id, score, avg_delay, exposure FROM customers WHERE name = ?',
      [buyerName]
    );
    if (customers.length === 0) {
      return res.status(404).json({ error: `Buyer "${buyerName}" not found` });
    }
    const customer = customers[0];

    // Get ML prediction
    const prediction = await getPrediction(
      customer.score || 500,
      customer.avg_delay || 0,
      customer.exposure || 0
    );

    const [result] = await db.query(
      `INSERT INTO invoices (customer_id, invoice_number, amount, due_date, status, delay_probability, predicted_delay)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id,
        invoiceNumber,
        amount,
        dueDate,
        status,
        prediction.delayProbability,
        prediction.predictedDelay,
      ]
    );

    // Recompute buyer risk profile
    await recomputeCustomerRiskProfile(customer.id);

    res.status(201).json({
      id: result.insertId,
      customer_id: customer.id,
      buyerName,
      invoiceNumber,
      amount,
      dueDate,
      status,
      delayProbability: prediction.delayProbability,
      predictedDelay: prediction.predictedDelay,
    });
  } catch (err) {
    console.error('POST /api/invoices error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// PATCH update invoice status
app.patch('/api/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const invoiceId = req.params.id;

    // If marking as Paid, set paid_date to today; if reverting, clear it
    let paidDate = null;
    if (status === 'Paid') {
      paidDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }

    await db.query(
      'UPDATE invoices SET status = ?, paid_date = ? WHERE id = ?',
      [status, paidDate, invoiceId]
    );

    // Get customer_id for recompute
    const [rows] = await db.query(
      'SELECT customer_id FROM invoices WHERE id = ?',
      [invoiceId]
    );
    if (rows.length > 0) {
      await recomputeCustomerRiskProfile(rows[0].customer_id);
    }

    res.json({ message: 'Invoice status updated', paidDate });
  } catch (err) {
    console.error('PATCH /api/invoices/:id/status error:', err);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// DELETE invoice
app.delete('/api/invoices/:id', async (req, res) => {
  try {
    // Get customer_id before deleting
    const [rows] = await db.query(
      'SELECT customer_id FROM invoices WHERE id = ?',
      [req.params.id]
    );

    const [result] = await db.query('DELETE FROM invoices WHERE id = ?', [
      req.params.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Recompute buyer risk profile
    if (rows.length > 0) {
      await recomputeCustomerRiskProfile(rows[0].customer_id);
    }

    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    console.error('DELETE /api/invoices error:', err);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// POST CSV upload
app.post('/api/invoices/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvString = req.file.buffer.toString('utf-8');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
    });

    let inserted = 0;
    const skipped = [];
    const touchedCustomerIds = new Set();

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const {
          buyerName,
          invoiceNumber,
          amount,
          dueDate,
          status = 'Pending',
          paidDate,
        } = row;

        if (!buyerName || !invoiceNumber || !amount || !dueDate) {
          skipped.push({
            row: i + 1,
            reason: 'Missing required fields (buyerName, invoiceNumber, amount, dueDate)',
          });
          continue;
        }

        // Look up customer
        const [customers] = await db.query(
          'SELECT id, score, avg_delay, exposure FROM customers WHERE name = ?',
          [buyerName.trim()]
        );
        if (customers.length === 0) {
          skipped.push({ row: i + 1, reason: `Buyer "${buyerName}" not found` });
          continue;
        }
        const customer = customers[0];

        // Get ML prediction
        const prediction = await getPrediction(
          customer.score || 500,
          customer.avg_delay || 0,
          customer.exposure || 0
        );

        await db.query(
          `INSERT INTO invoices (customer_id, invoice_number, amount, due_date, status, delay_probability, predicted_delay, paid_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            customer.id,
            invoiceNumber.trim(),
            parseFloat(amount),
            dueDate.trim(),
            status.trim() || 'Pending',
            prediction.delayProbability,
            prediction.predictedDelay,
            paidDate ? paidDate.trim() : null,
          ]
        );

        touchedCustomerIds.add(customer.id);
        inserted++;
      } catch (rowErr) {
        // Individual row errors are caught and skipped (not batch-aborting)
        skipped.push({ row: i + 1, reason: rowErr.message });
      }
    }

    // Recompute risk for all touched customers
    for (const customerId of touchedCustomerIds) {
      await recomputeCustomerRiskProfile(customerId);
    }

    res.json({ inserted, skipped });
  } catch (err) {
    console.error('POST /api/invoices/upload error:', err);
    res.status(500).json({ error: 'CSV upload failed' });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✓ CredShield backend running on http://localhost:${PORT}`);
});
