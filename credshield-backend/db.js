const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'DIPTIMAN',
  database: 'credshield',
  decimalNumbers: true,
});

module.exports = pool.promise();
//db.js
