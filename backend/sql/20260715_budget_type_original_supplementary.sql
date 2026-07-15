ALTER TABLE budget_transactions MODIFY budget_type VARCHAR(30) NOT NULL;

UPDATE budget_transactions
SET budget_type = CASE
  WHEN budget_type = 'receive' THEN 'original'
  WHEN budget_type = 'spend' THEN 'supplementary'
  ELSE budget_type
END;

ALTER TABLE budget_transactions MODIFY budget_type ENUM('original','supplementary') NOT NULL;
