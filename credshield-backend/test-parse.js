const { parse } = require('csv-parse/sync');

const sampleCsv = `buyerName,invoiceNumber,amount,dueDate,status
Global Dynamics,#INV-99001,50000,2026-08-01,Pending
Apex Kinetix,#INV-99002,25000,2026-08-05,Pending`;

const records = parse(sampleCsv, {
  columns: true,
  skip_empty_lines: true,
});

console.log(records);
