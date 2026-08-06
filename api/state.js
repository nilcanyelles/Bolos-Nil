const { requireAuth } = require("../lib/auth");
const { sql } = require("../lib/db");

module.exports = async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    try {
      const rows = await sql()`SELECT data FROM app_state WHERE id = 1`;
      res.status(200).json(rows[0] ? rows[0].data : { grups: [], events: [] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "No s'ha pogut llegir la base de dades" });
    }
    return;
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = null;
      }
    }
    if (!body || !Array.isArray(body.grups) || !Array.isArray(body.events)) {
      res.status(400).json({ error: "Format invàlid" });
      return;
    }
    try {
      await sql()`
        INSERT INTO app_state (id, data, updated_at)
        VALUES (1, ${JSON.stringify(body)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `;
      res.status(200).json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "No s'ha pogut desar a la base de dades" });
    }
    return;
  }

  res.status(405).json({ error: "Mètode no permès" });
};
