CREATE TABLE IF NOT EXISTS tax_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiscal_year_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  basis ENUM('annual','monthly') NOT NULL DEFAULT 'annual',
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tax_policies_fiscal_year
    FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
    ON DELETE CASCADE,
  UNIQUE KEY uniq_tax_policy (fiscal_year_id, name)
);

CREATE TABLE IF NOT EXISTS tax_slab_brackets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tax_policy_id INT NOT NULL,
  sr_no INT NOT NULL,
  from_income DECIMAL(14, 2) NOT NULL DEFAULT 0,
  to_income DECIMAL(14, 2) NULL,
  rate DECIMAL(6, 2) NOT NULL DEFAULT 0,
  fixed_tax DECIMAL(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tax_slabs_policy
    FOREIGN KEY (tax_policy_id) REFERENCES tax_policies(id)
    ON DELETE CASCADE,
  UNIQUE KEY uniq_tax_slab (tax_policy_id, sr_no)
);
