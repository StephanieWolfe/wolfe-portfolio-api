# wolfe-portfolio-api

REST API for my portfolio site's blog. It serves public posts, and lets me log in to create, edit, delete, and draft posts.

The front end is [wolfe-portfolio](https://github.com/StephanieWolfe/wolfe-portfolio) (Vue 3), live at [stephaniewolfe.dev](https://stephaniewolfe.dev).

## Stack

Node.js, Express 5, PostgreSQL (`pg`), JSON Web Tokens (`jsonwebtoken`), `bcrypt` for password hashing, `cors`, `dotenv`. Hosted on Render.

## How it works

- **Public reads.** Anyone can list and read published posts.
- **Drafts are admin-only.** If a request carries a valid token, the same endpoints also return unpublished posts. Without one, drafts are filtered out in the SQL query.
- **Writes require login.** Creating, updating, and deleting posts goes through a `requireAuth` middleware that verifies a Bearer token.
- **Login.** `POST /api/auth/login` checks the password against a bcrypt hash and returns a JWT that expires after 24 hours.
- **Queries are parameterized** (`$1`, `$2`, ...), never built by string concatenation.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | none | Health check |
| POST | `/api/auth/login` | none | Body: `username`, `password`. Returns `{ token }` |
| GET | `/api/blog/posts` | optional | Published posts, newest first. Includes drafts with a valid token |
| GET | `/api/blog/posts/:slug` | optional | One post by slug. Drafts only with a valid token |
| POST | `/api/blog/posts` | required | Create a post. Body: `title`, `slug`, `summary`, `content`, optional `published` (defaults to `true`). Returns `201`, or `409` if the slug exists |
| PUT | `/api/blog/posts/:slug` | required | Update a post. Same fields as create. Returns `404` if not found, `409` on a slug conflict |
| DELETE | `/api/blog/posts/:id` | required | Delete a post by id |

Protected requests send the token as `Authorization: Bearer <token>`. Missing or invalid tokens get `401`.

## Run it locally

You need Node.js and a PostgreSQL database.

```bash
npm install
```

Create a `.env` file (it is git-ignored):

```
DATABASE_URL=postgres://user:password@localhost:5432/portfolio
JWT_SECRET=a-long-random-string
PORT=3000
```

Then:

```bash
npm run dev        # nodemon, restarts on changes
node server.js     # plain start, as used in production
```

### Database tables

The queries expect two tables. A minimal version:

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE posts (
  id         SERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  summary    TEXT NOT NULL,
  content    TEXT NOT NULL,
  published  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Create the admin user

Credentials are read from the environment so they never live in the code:

```bash
ADMIN_USERNAME=yourname ADMIN_PASSWORD='a-long-unique-passphrase' node create-admin.js
```

Running it again for the same username resets that user's password.

## Project layout

```
server.js            app setup and route mounting
db.js                PostgreSQL connection pool
middleware/auth.js   JWT verification (requireAuth)
routes/auth.js       login
routes/blog.js       blog CRUD
create-admin.js      create or reset the admin user
```
