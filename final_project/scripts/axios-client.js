const { createBookClient } = require('../router/general.js');
const client = createBookClient();
async function main() {
  // The four requests can execute concurrently without blocking one another.
  const allBooks = new Promise((resolve, reject) => {
    client.getAllBooks((error, data) => error ? reject(error) : resolve(data));
  });
  const [all, isbn, author, title] = await Promise.all([
    allBooks,
    client.getBooksByISBN('1'),
    client.getBooksByAuthor('Unknown'),
    client.getBooksByTitle('Things Fall Apart')
  ]);
  console.log(JSON.stringify({ allBooks: all, byISBN: isbn, byAuthor: author, byTitle: title }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
