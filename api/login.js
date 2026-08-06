const { createSessionCookie, checkPassword } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Mètode no permès" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  if (!checkPassword(body && body.password)) {
    res.status(401).json({ error: "Contrasenya incorrecta" });
    return;
  }

  let cookie;
  try {
    cookie = createSessionCookie();
  } catch (e) {
    res.status(500).json({ error: "Configuració del servidor incompleta" });
    return;
  }

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true });
};
