CREATE DATABASE IF NOT EXISTS credshield;
USE credshield;

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  industry VARCHAR(255),
  score INT NULL,
  risk_level VARCHAR(20) NULL,
  avg_delay DECIMAL(6, 1) NULL,
  exposure DECIMAL(12, 2) DEFAULT 0.00,
  volume DECIMAL(12, 2) DEFAULT 0.00,
  since_year INT,
  logo_text VARCHAR(10),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  invoice_number VARCHAR(100) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  status ENUM('Paid', 'Pending', 'Overdue') NOT NULL DEFAULT 'Pending',
  delay_probability INT DEFAULT 0,
  predicted_delay DECIMAL(6, 1) DEFAULT 0,
  paid_date DATE NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
