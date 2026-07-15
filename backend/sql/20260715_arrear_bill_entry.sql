CREATE TABLE IF NOT EXISTS arrear_bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_no INT UNIQUE NOT NULL,
  bill_date DATE NOT NULL,
  place_of_posting VARCHAR(100) DEFAULT 'Hospital',
  employee_code VARCHAR(50) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('draft','finalized','cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_arrear_bills_employee
    FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS arrear_bill_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  arrear_bill_id INT NOT NULL,
  sr_no INT NOT NULL,
  period_no INT NOT NULL,
  period_label VARCHAR(20) NOT NULL,
  account_code VARCHAR(4) NOT NULL,
  description VARCHAR(150),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_arrear_bill_items_bill
    FOREIGN KEY (arrear_bill_id) REFERENCES arrear_bills(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_arrear_bill_items_wage_code
    FOREIGN KEY (account_code) REFERENCES wage_codes(code)
    ON UPDATE CASCADE
);
