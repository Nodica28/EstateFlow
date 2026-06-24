-- Contacts no longer carry a pipeline "status"; funnel state lives on leasing_opportunities.stage.
ALTER TABLE contacts DROP COLUMN IF EXISTS status;
