// ========== domain/userDomain.js ==========
// Idéntico, byte a byte, al de las Prácticas 4-8. No importa 'express',
// no importa ningún driver de base de datos, no sabe qué es una función
// serverless ni un contenedor Docker -- recibe un "repo" (un PUERTO) y
// confía en que cumple el contrato, sin que le importe quién lo
// implementa ni cómo.

async function register(repo, username, password) {
  if (!username || !password) {
    return { error: 'Username and password are required', status: 400 };
  }
  try {
    const user = await repo.createUser(username, password);
    return { data: user, status: 201 };
  } catch (err) {
    if (err.code === 'DUPLICATE_USERNAME') {
      return { error: 'Username already exists', status: 409 };
    }
    throw err;
  }
}

async function login(repo, username, password) {
  const user = await repo.findUserByCredentials(username, password);
  if (user) {
    return { data: user, status: 200 };
  }
  return { error: 'Invalid credentials', status: 401 };
}

module.exports = { register, login };
