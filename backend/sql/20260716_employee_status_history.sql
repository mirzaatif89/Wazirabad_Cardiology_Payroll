CREATE TABLE IF NOT EXISTS employee_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(50) NOT NULL,
  status ENUM('active','inactive') NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_status_history_employee
    FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
