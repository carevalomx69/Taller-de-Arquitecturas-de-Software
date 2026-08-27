// ========== domain/userDomain.js ==========
// EL HEXÁGONO. Esta es la lógica de negocio pura: no importa 'express',
// no importa 'mysql2', no sabe qué es un puerto HTTP ni una tabla SQL.
//
// En vez de eso, recibe un "repo" (un PUERTO) como parámetro — un objeto
// que promete cumplir ciertos métodos, sin que a este archivo le importe
// quién los implementa ni cómo. Podría ser MySQL, podría ser un arreglo en
// memoria (ver test_domain.js), podría ser MongoDB el día de mañana. El
// dominio no cambiaría ni una línea.
//
// Puerto esperado (contrato, no impuesto por el lenguaje, solo documentado):
//   repo.createUser(username, password)          -> { id, username }
//   repo.findUserByCredentials(username, password) -> user | null

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
