const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index.js');
const books = require('../router/booksdb.js');
const { createBookClient } = require('../router/general.js');
let server;
let base;
before(async () => {
  server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
async function request(path, { method = 'GET', body, token, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function account(username) {
  assert.equal((await request('/register', { method: 'POST', body: { username, password: 'Bookstore123!' } })).status, 201);
  const login = await request('/customer/login', { method: 'POST', body: { username, password: 'Bookstore123!' } });
  assert.equal(login.status, 200);
  return { token: login.body.accessToken, cookie: login.cookie };
}

test('catalogue uses all 10 original books; ISBN, author, title and initial reviews work', async () => {
  const all = await request('/');
  assert.equal(all.status, 200);
  assert.deepEqual(all.body, books);
  assert.equal(Object.keys(all.body).length, 10);
  assert.equal((await request('/isbn/1')).body.title, 'Things Fall Apart');
  assert.deepEqual(Object.keys((await request('/author/unknown')).body), ['4', '5', '6', '7']);
  assert.equal((await request('/title/Pride%20and%20Prejudice')).body['8'].author, 'Jane Austen');
  assert.deepEqual((await request('/title/nonexistent')).body, {});
  assert.deepEqual((await request('/review/1')).body, {});
  for (const path of ['/isbn/999', '/isbn/__proto__', '/review/constructor']) {
    assert.equal((await request(path)).status, 404);
  }
});

test('all four Axios retrieval implementations execute real HTTP requests', async () => {
  const client = createBookClient(base);
  const all = await new Promise((resolve, reject) => client.getAllBooks((error, data) => error ? reject(error) : resolve(data)));
  assert.equal(Object.keys(all).length, 10);
  const [isbn, author, title] = await Promise.all([
    client.getBooksByISBN('1'), client.getBooksByAuthor('Unknown'), client.getBooksByTitle('Things Fall Apart')
  ]);
  assert.equal(isbn.author, 'Chinua Achebe');
  assert.equal(Object.keys(author).length, 4);
  assert.equal(title['1'].title, 'Things Fall Apart');
  await assert.rejects(client.getBooksByISBN('missing'), error => error.response.status === 404);
  const dead = createBookClient('http://127.0.0.1:1');
  await new Promise((resolve, reject) => dead.getAllBooks(error => {
    try { assert.ok(error); resolve(); } catch (failure) { reject(failure); }
  }));
});

test('registration validation, wrong password, duplicate race and invalid JWT are handled', async () => {
  assert.equal((await request('/register', { method: 'POST', body: { username: 'x', password: 'short' } })).status, 400);
  const registration = { method: 'POST', body: { username: 'race_user', password: 'Bookstore123!' } };
  const results = await Promise.all([request('/register', registration), request('/register', registration)]);
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  assert.equal((await request('/customer/login', { method: 'POST', body: { username: 'race_user', password: 'incorrect' } })).status, 401);
  assert.equal((await request('/customer/auth/review/1', { method: 'PUT', body: { review: 'Denied' } })).status, 401);
  assert.equal((await request('/customer/auth/review/1', { method: 'DELETE', token: 'invalid.jwt.signature' })).status, 401);
});

test('cookie and JWT authentication, add/update/delete, ownership and concurrent reviews', async () => {
  const alice = await account('alice_test');
  const bob = await account('bob_test');
  let result = await request('/customer/auth/review/1', { method: 'PUT', cookie: alice.cookie, body: { review: 'First review' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.reviews.alice_test, 'First review');
  result = await request('/customer/auth/review/1?review=Updated%20review', { method: 'PUT', token: alice.token });
  assert.equal(result.body.message, 'Review successfully modified.');
  assert.equal(result.body.reviews.alice_test, 'Updated review');
  assert.equal((await request('/customer/auth/review/1', { method: 'DELETE', token: bob.token, body: { username: 'alice_test' } })).status, 404);
  assert.equal((await request('/review/1')).body.alice_test, 'Updated review');
  assert.equal((await request('/customer/auth/review/1', { method: 'PUT', token: bob.token, body: { review: '  ' } })).status, 400);
  assert.equal((await request('/customer/auth/review/999', { method: 'PUT', token: bob.token, body: { review: 'Missing' } })).status, 404);
  const writes = await Promise.all([
    request('/customer/auth/review/1', { method: 'PUT', token: alice.token, body: { review: 'Alice concurrent' } }),
    request('/customer/auth/review/1', { method: 'PUT', token: bob.token, body: { review: 'Bob concurrent', username: 'alice_test' } })
  ]);
  assert.ok(writes.every(result => result.status === 200));
  assert.deepEqual((await request('/review/1')).body, { alice_test: 'Alice concurrent', bob_test: 'Bob concurrent' });
  result = await request('/customer/auth/review/1', { method: 'DELETE', token: alice.token });
  assert.equal(result.body.message, 'Review successfully deleted.');
  assert.deepEqual(result.body.reviews, { bob_test: 'Bob concurrent' });
  await request('/customer/auth/review/1', { method: 'DELETE', token: bob.token });
});
