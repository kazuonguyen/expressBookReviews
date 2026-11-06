# Online Bookstore — Final Project

Completed Express bookstore API, forked from [IBM Developer Skills Network / expressBookReviews](https://github.com/ibm-developer-skills-network/expressBookReviews).

The assignment text spells the repository as `expressBookReview`; the available IBM starter is `expressBookReviews` (with a final `s`). This repository is an actual GitHub fork of that starter. Its original `final_project/router/booksdb.js` data is unchanged.

## Run and verify

Requires Node.js 18+; evidence generation also requires Python 3 and cURL.

```sh
cd final_project
npm ci
npm test
npm start
```

In another terminal:

```sh
cd final_project
npm run client
```

The default URL is `http://127.0.0.1:5000`. Set `HOST`, `PORT` and/or the Axios client's `BOOK_API_URL` as needed. To expose the API in a cloud lab, use `HOST=0.0.0.0 npm start`. If port 5000 is occupied, use `PORT=5001 npm start` and `BOOK_API_URL=http://127.0.0.1:5001 npm run client`.

## Routes

| Method | URL | Purpose |
| --- | --- | --- |
| GET | `/` | All books |
| GET | `/isbn/:isbn` | Book by starter ISBN key (`1` through `10`) |
| GET | `/author/:author` | All matching books; case-insensitive partial search |
| GET | `/title/:title` | All matching books; case-insensitive partial search |
| GET | `/review/:isbn` | Reviews for a book |
| POST | `/register` | Register with JSON `username`, `password` |
| POST | `/customer/login` | Log in; returns JWT and sets a session cookie |
| PUT | `/customer/auth/review/:isbn` | Add or replace your own review |
| DELETE | `/customer/auth/review/:isbn` | Delete only your own review |

PUT accepts JSON `{"review":"Your review"}` or a `review` query parameter. Authenticated requests accept the login cookie or `Authorization: Bearer <accessToken>`. Usernames use 3–32 letters/digits/underscores/hyphens, beginning with a letter or digit. Passwords use 8–128 characters.

## Asynchronous Axios tasks

[`final_project/router/general.js`](final_project/router/general.js) contains the four client implementations requested in the final criterion:

- `getAllBooks(callback)`: asynchronous callback over an Axios Promise.
- `getBooksByISBN(isbn)`: Axios with Promise callbacks.
- `getBooksByAuthor(author)`: Axios with async/await.
- `getBooksByTitle(title)`: Axios with async/await.

`createBookClient(baseURL)` exports these functions for the runnable client and integration tests. The client launches four independent HTTP requests with `Promise.all`. Public routes serve the supplied data directly, so there is no recursive self-request loop.

## Evidence and submission

All cURL commands and actual responses are in [`submission/`](submission/). See [`submission/HUONG_DAN_NOP_BAI.md`](submission/HUONG_DAN_NOP_BAI.md) for the answer mapping. To regenerate evidence against a fresh isolated server:

```sh
cd final_project
npm run evidence
```

The script chooses an available local port, calls the live API using cURL, verifies responses, runs the Axios client, then stops the server. Its cookie jar is temporary and excluded from the repository. The login output contains only a short-lived demonstration token; the signing key disappears when this evidence server stops.

## Validation and scope

`npm test` covers the original catalogue, all four Axios functions, failure propagation, registration, duplicate-registration races, password validation, cookie/JWT login, review create/update/delete, two-user ownership and concurrent review writes. `submission/validation.txt` records the verification run.

Users, sessions and reviews intentionally live in memory to match the starter assignment. Restarting the server resets them. Passwords are stored as salted scrypt hashes. JWT/session secrets are random per process unless supplied through `JWT_SECRET` and `SESSION_SECRET`. A database and shared session store would be needed for persistence or multiple server processes.
