const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { registerUser } = require('./auth_users.js');
const public_users = express.Router();

public_users.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const result = await registerUser(username, password);
    return res.status(result.status).json({ message: result.message });
  } catch (error) { next(error); }
});

// Public catalogue endpoints use the unmodified starter booksdb.js data source.
public_users.get('/', (req, res) => res.json(books));
public_users.get('/isbn/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  return res.json(books[req.params.isbn]);
});

function searchBooks(field, value) {
  const query = value.trim().toLowerCase();
  return Object.fromEntries(Object.entries(books).filter(([, book]) =>
    query.length > 0 && book[field].toLowerCase().includes(query)));
}
public_users.get('/author/:author', (req, res) => res.json(searchBooks('author', req.params.author)));
public_users.get('/title/:title', (req, res) => res.json(searchBooks('title', req.params.title)));
public_users.get('/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  return res.json(books[req.params.isbn].reviews);
});

// Task 11 (four asynchronous retrieval tasks). These Axios clients send real
// HTTP requests to the catalogue. They are exported and exercised by
// scripts/axios-client.js and test/bookstore.test.js, not called by the routes
// above, which avoids recursive HTTP calls to the same route.
function createBookClient(baseURL = process.env.BOOK_API_URL || 'http://127.0.0.1:5000') {
  const client = axios.create({ baseURL, timeout: 10000 });

  // Retrieve every book using an asynchronous callback over an Axios Promise.
  function getAllBooks(callback) {
    return client.get('/').then(
      response => callback(null, response.data),
      error => callback(error)
    );
  }

  // Search by ISBN using Promise callbacks.
  function getBooksByISBN(isbn) {
    return client.get(`/isbn/${encodeURIComponent(isbn)}`).then(response => response.data);
  }

  // Search by author using async/await with Axios.
  async function getBooksByAuthor(author) {
    const response = await client.get(`/author/${encodeURIComponent(author)}`);
    return response.data;
  }

  // Search by title using async/await with Axios.
  async function getBooksByTitle(title) {
    const response = await client.get(`/title/${encodeURIComponent(title)}`);
    return response.data;
  }

  return { getAllBooks, getBooksByISBN, getBooksByAuthor, getBooksByTitle };
}
module.exports = { general: public_users, createBookClient };
