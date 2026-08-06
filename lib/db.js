const { neon } = require("@neondatabase/serverless");

let sqlClient = null;
function sql() {
  if (!sqlClient) {
    if (!process.env.DATABASE_URL) throw new Error("Falta configurar la variable d'entorn DATABASE_URL");
    sqlClient = neon(process.env.DATABASE_URL);
  }
  return sqlClient;
}

module.exports = { sql };
