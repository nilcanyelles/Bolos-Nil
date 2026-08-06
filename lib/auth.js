const crypto = require("crypto");

const COOKIE_NAME = "bolos_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dies

function sign(value, secret) {
  const h = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(signed, secret) {
  if (!signed) return null;
  const idx = signed.lastIndexOf(".");
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto.createHmac("sha256", secret).update(value).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return value;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("Falta configurar la variable d'entorn SESSION_SECRET");
  return secret;
}

function createSessionCookie() {
  const secret = requireSecret();
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const token = sign(`ok:${exp}`, secret);
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${COOKIE_NAME}=; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=0`;
}

function isAuthed(req) {
  let secret;
  try {
    secret = requireSecret();
  } catch (e) {
    return false;
  }
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const value = verify(token, secret);
  if (!value) return false;
  const [, expStr] = value.split(":");
  const exp = Number(expStr);
  return Number.isFinite(exp) && Date.now() < exp;
}

function checkPassword(candidate) {
  const expected = process.env.APP_PASSWORD;
  if (!expected || typeof candidate !== "string") return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  res.status(401).json({ error: "No autenticat" });
  return false;
}

module.exports = { createSessionCookie, clearSessionCookie, isAuthed, checkPassword, requireAuth };
