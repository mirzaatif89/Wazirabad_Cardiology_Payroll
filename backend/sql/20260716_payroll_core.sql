CREATE TABLE IF NOT EXISTS payroll_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_month INT NOT NULL,
  payment_year INT NOT NULL,
  dept_code VARCHAR(50) NOT NULL DEFAULT '999',
  status ENUM('draft','processed','locked') DEFAULT 'draft',
  processed_at TIMESTAMP NULL,
  processed_by VARCHAR(100),
  UNIQUE KEY uniq_run (payment_month, payment_year, dept_code)
);

CREATE TABLE IF NOT EXISTS payroll_run_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payroll_run_id INT NOT NULL,
  employee_code VARCHAR(50) NOT NULL,
  gross_pay DECIMAL(12, 2) NOT NULL,
  total_deductions DECIMAL(12, 2) NOT NULL,
  net_pay DECIMAL(12, 2) NOT NULL,
  bank_code VARCHAR(50) NULL,
  bank_branch_code VARCHAR(50) NULL,
  account_no VARCHAR(30) NULL,
  is_bank_salary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payroll_items_run
    FOREIGN KEY (payroll_run_id) REFERENCES payroll_runs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payroll_items_employee
    FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS payroll_run_item_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payroll_run_item_id INT NOT NULL,
  wage_code VARCHAR(4) NOT NULL,
  description VARCHAR(150),
  amount DECIMAL(10, 2) NOT NULL,
  CONSTRAINT fk_payroll_details_item
    FOREIGN KEY (payroll_run_item_id) REFERENCES payroll_run_items(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payroll_details_wage
    FOREIGN KEY (wage_code) REFERENCES wage_codes(code)
    ON UPDATE CASCADE
);
