CREATE TABLE IF NOT EXISTS special_pay_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(50) NOT NULL,
  pay_month INT NOT NULL,
  pay_year INT NOT NULL,
  wage_code VARCHAR(4) NOT NULL,
  description VARCHAR(150),
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_special_pay (employee_code, pay_month, pay_year, wage_code),
  CONSTRAINT fk_special_pay_employee
    FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_special_pay_wage
    FOREIGN KEY (wage_code) REFERENCES wage_codes(code)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS cheque_prints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cheque_date DATE NOT NULL,
  payee_name VARCHAR(150) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  bank_type ENUM('BOP','SDA') NOT NULL,
  cheque_no VARCHAR(30),
  printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  printed_by VARCHAR(100)
);
