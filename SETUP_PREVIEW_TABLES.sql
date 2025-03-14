-- Create preview versions of tables for testing environment
CREATE TABLE IF NOT EXISTS preview_deaths (LIKE deaths INCLUDING ALL);
CREATE TABLE IF NOT EXISTS preview_killmails (LIKE killmails INCLUDING ALL);
CREATE TABLE IF NOT EXISTS preview_receipts (LIKE receipts INCLUDING ALL);

-- Create the same indexes for preview tables
CREATE INDEX IF NOT EXISTS idx_preview_deaths_victim_alliance ON preview_deaths(victim_alliance_id);
CREATE INDEX IF NOT EXISTS idx_preview_deaths_timestamp ON preview_deaths(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_preview_killmails_killer_alliance ON preview_killmails(killer_alliance_id);
CREATE INDEX IF NOT EXISTS idx_preview_killmails_timestamp ON preview_killmails(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_preview_receipts_event_id ON preview_receipts(event_id);

-- Add storage bucket policies for preview folders
INSERT INTO storage.buckets (id, name, public)
SELECT 'preview_receipts', 'preview_receipts', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'preview_receipts');
