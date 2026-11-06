const express = require('express');
const session = require('express-session');
const { sessionSecret } = require('./config.js');
const { authenticated } = require('./router/auth_users.js');
const { general } = require('./router/general.js');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use('/customer', session({
  name: 'bookshop.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 1000 }
}));
app.use('/customer', authenticated);
app.use('/', general);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON request body.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body too large.' });
  console.error(error);
  return res.status(500).json({ message: 'Internal server error.' });
});
if (require.main === module) {
  const port = Number(process.env.PORT || 5000);
  const host = process.env.HOST || '127.0.0.1';
  app.listen(port, host, () => console.log(`Bookstore API running at http://${host}:${port}`));
}
module.exports = app;
