/*
# Create scan_history table for real port scan results

1. New Tables
- `scan_history`: stores results of real TCP port scans performed via the edge function
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, references auth.users)
  - `host` (text, not null) — the scanned IP or hostname
  - `total_ports` (int) — total number of ports scanned
  - `open_count` (int) — number of open ports found
  - `closed_count` (int) — number of closed/filtered ports
  - `duration_ms` (int) — scan duration in milliseconds
  - `results` (jsonb) — full port-by-port results array
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on `scan_history`.
- Owner-scoped CRUD: each authenticated user can only access their own scan history.
- user_id defaults to auth.uid() so inserts that omit it still succeed.
*/

CREATE TABLE IF NOT EXISTS scan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  host text NOT NULL,
  total_ports int NOT NULL DEFAULT 0,
  open_count int NOT NULL DEFAULT 0,
  closed_count int NOT NULL DEFAULT 0,
  duration_ms int NOT NULL DEFAULT 0,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scans" ON scan_history;
CREATE POLICY "select_own_scans" ON scan_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scans" ON scan_history;
CREATE POLICY "insert_own_scans" ON scan_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scans" ON scan_history;
CREATE POLICY "delete_own_scans" ON scan_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_created_at ON scan_history(created_at DESC);
