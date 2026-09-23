/*
# Create nmap_scan_history table

1. New Tables
- `nmap_scan_history`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `target` (text, not null) — the scan target (IP/hostname/CIDR)
  - `command` (text, not null) — the full nmap command executed
  - `exit_code` (integer, not null, default 0) — nmap exit code
  - `duration` (text, not null, default '') — human-readable scan duration
  - `nmap_available` (boolean, not null, default true) — whether nmap was available
  - `raw_output` (text, not null, default '') — raw terminal output
  - `hosts` (jsonb, not null, default '[]') — parsed host/port data
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `nmap_scan_history`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- user_id defaults to auth.uid() so inserts that omit it still succeed.
*/

CREATE TABLE IF NOT EXISTS nmap_scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target text NOT NULL,
  command text NOT NULL,
  exit_code integer NOT NULL DEFAULT 0,
  duration text NOT NULL DEFAULT '',
  nmap_available boolean NOT NULL DEFAULT true,
  raw_output text NOT NULL DEFAULT '',
  hosts jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nmap_scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_nmap_scans" ON nmap_scan_history;
CREATE POLICY "select_own_nmap_scans" ON nmap_scan_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_nmap_scans" ON nmap_scan_history;
CREATE POLICY "insert_own_nmap_scans" ON nmap_scan_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_nmap_scans" ON nmap_scan_history;
CREATE POLICY "update_own_nmap_scans" ON nmap_scan_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_nmap_scans" ON nmap_scan_history;
CREATE POLICY "delete_own_nmap_scans" ON nmap_scan_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nmap_scan_history_user_id ON nmap_scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nmap_scan_history_created_at ON nmap_scan_history(created_at DESC);
