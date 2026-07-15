CREATE TABLE IF NOT EXISTS budget_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_no INT UNIQUE NOT NULL,
  transaction_date DATE NOT NULL,
  budget_type ENUM('original','supplementary') NOT NULL,
  details VARCHAR(200),
  total_amount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  status ENUM('draft','finalized','cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE budget_transactions MODIFY budget_type VARCHAR(30) NOT NULL;

UPDATE budget_transactions
SET budget_type = CASE
  WHEN budget_type = 'receive' THEN 'original'
  WHEN budget_type = 'spend' THEN 'supplementary'
  ELSE budget_type
END;

ALTER TABLE budget_transactions MODIFY budget_type ENUM('original','supplementary') NOT NULL;

CREATE TABLE IF NOT EXISTS budget_transaction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  budget_transaction_id INT NOT NULL,
  sr_no INT NOT NULL,
  account_code VARCHAR(20) NOT NULL,
  description VARCHAR(150),
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_budget_items_transaction
    FOREIGN KEY (budget_transaction_id) REFERENCES budget_transactions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_budget_items_chart_account
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code)
    ON UPDATE CASCADE
);
