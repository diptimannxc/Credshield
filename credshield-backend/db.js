const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'DIPTIMAN',
  database: process.env.DB_NAME || 'credshield',
  port: process.env.DB_PORT || 3306,
  decimalNumbers: true,
});

module.exports = pool.promise();
//db.js
