-- Add read/archive/favorite tracking to communications
ALTER TABLE communications
  ADD COLUMN IF NOT EXISTS is_read     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
