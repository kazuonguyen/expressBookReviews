const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const books = require('./booksdb.js');
const { jwtSecret } = require('../config.js');
const deriveKey = promisify(scrypt);
const regd_users = express.Router();
const users = new Map();
const validUsername = username => typeof username === 'string' &&
  /^[A-Za-z0-9][A-Za-z0-9_-]{2,31}$/.test(username);
const validPassword = password => typeof password === 'string' &&
  password.length >= 8 && password.length <= 128;
const isValid = username => users.has(username);

async function registerUser(username, password) {
  if (!validUsername(username) || !validPassword(password)) {
    return { status: 400, message: 'Use a 3-32 character username (letters, digits, _ or -) and an 8-128 character password.' };
  }
  if (isValid(username)) return { status: 409, message: 'Username already exists.' };
  const salt = randomBytes(16).toString('hex');
  const hash = await deriveKey(password, salt, 64);
  // The second check and insertion have no await between them: concurrent
  // registrations cannot both claim the same username in this Node process.
  if (isValid(username)) return { status: 409, message: 'Username already exists.' };
  users.set(username, { salt, hash });
  return { status: 201, message: 'User successfully registered. You may now log in.' };
}

async function authenticatedUser(username, password) {
  if (!validUsername(username) || !validPassword(password)) return false;
  const user = users.get(username);
  if (!user) return false;
  const hash = await deriveKey(password, user.salt, 64);
  return timingSafeEqual(hash, user.hash);
}

function authenticate(req, res, next) {
  const header = req.get('authorization');
  // If explicitly supplied, a bearer credential takes precedence over a cookie.
  const token = header ? /^Bearer ([^\s]+)$/i.exec(header)?.[1] : req.session?.authorization?.accessToken;
  if (!token) return res.status(401).json({ message: 'Please log in to manage your reviews.' });
  try {
    const claims = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    if (typeof claims.sub !== 'string' || !users.has(claims.sub)) throw new Error('Unknown user');
    req.username = claims.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token. Please log in again.' });
  }
}

regd_users.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!await authenticatedUser(username, password)) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }
    req.session.regenerate(error => {
      if (error) return next(error);
      const accessToken = jwt.sign({}, jwtSecret, { algorithm: 'HS256', subject: username, expiresIn: '1h' });
      req.session.authorization = { accessToken };
      req.session.save(error => {
        if (error) return next(error);
        res.json({ message: 'User successfully logged in.', username, accessToken, expiresIn: '1h' });
      });
    });
  } catch (error) { next(error); }
});

regd_users.use('/auth', authenticate);
regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) return res.status(404).json({ message: 'Book not found.' });
  const review = req.query.review ?? req.body?.review;
  if (typeof review !== 'string' || !review.trim() || review.length > 5000) {
    return res.status(400).json({ message: 'Provide a nonempty review of up to 5000 characters.' });
  }
  // Use only the verified identity; never accept a review owner from the client.
  const modified = Object.hasOwn(books[isbn].reviews, req.username);
  Object.defineProperty(books[isbn].reviews, req.username, {
    value: review.trim(), enumerable: true, writable: true, configurable: true
  });
  res.json({ message: modified ? 'Review successfully modified.' : 'Review successfully added.', isbn, reviews: books[isbn].reviews });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  if (!Object.hasOwn(books, isbn)) return res.status(404).json({ message: 'Book not found.' });
  if (!Object.hasOwn(books[isbn].reviews, req.username)) {
    return res.status(404).json({ message: 'You have no review for this book.' });
  }
  delete books[isbn].reviews[req.username];
  res.json({ message: 'Review successfully deleted.', isbn, reviews: books[isbn].reviews });
});

module.exports = { authenticated: regd_users, isValid, users, registerUser, authenticatedUser, authenticate };
