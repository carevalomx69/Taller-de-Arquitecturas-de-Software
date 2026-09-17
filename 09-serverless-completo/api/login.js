// ========== api/login.js ==========
const { createPostgresAdapter } = require('../adapters/postgresAdapter');
const userDomain = require('../domain/userDomain');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido -- usa POST' });
    return;
  }
  const { username, password } = req.body || {};
  const repo = createPostgresAdapter();
  const result = await userDomain.login(repo, username, password);
  if (result.error) res.status(result.status).json({ error: result.error });
  else res.status(result.status).json(result.data);
};
