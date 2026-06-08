ALTER TABLE vouchers
  ALTER COLUMN uses_count SET DEFAULT 0;

UPDATE vouchers
SET uses_count = 0
WHERE uses_count IS NULL;

UPDATE vouchers
SET max_uses = 1
WHERE max_uses IS NULL;
