-- Run this once against your credshield database before restarting the backend.
-- Captures WHEN an invoice was actually paid, so avg_delay can be computed
-- from real payment history (paid_date - due_date) instead of guessed.

ALTER TABLE invoices ADD COLUMN paid_date DATE NULL;
