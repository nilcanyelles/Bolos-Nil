CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO app_state (id, data)
VALUES (1, '{"grups":[],"events":[]}'::jsonb)
ON CONFLICT (id) DO NOTHING;
