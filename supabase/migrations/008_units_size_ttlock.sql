-- Square footage and TTLock device id (present in 002_domain_schema; safe if re-applied).
ALTER TABLE units ADD COLUMN IF NOT EXISTS size INTEGER;
ALTER TABLE units ADD COLUMN IF NOT EXISTS ttlock_id INTEGER;
