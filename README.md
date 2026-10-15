# ace-quicknotes-demo
Minimal notes API used to test the ACE platform end-o-end (new project, own repo, ACE-driven implementaton).

## Quick start

Requires Node.js >= 18.

```bash
npm install      # installs express, better-sqlite3 (runtime) and jest, supertest (dev)
npm start        # boots the server on http://127.0.0.1:3000
npm test         # runs the Jest + supertest integration suite (jest --runInBand)
```

### Endpoints

| Method | Route        | Behavior                                       | Status      |
|--------|--------------|------------------------------------------------|-------------|
| POST   | /notes       | Create a note (`{title, body}` JSON)            | 201 / 400   |
| GET    | /notes       | List all notes                                  | 200         |
| GET    | /notes/:id   | Fetch a single note                             | 200 / 404   |
| DELETE | /notes/:id   | Hard-delete a note                              | 204 / 404   |

Validation: `title` is required, must be a non-empty string (trimmed) and at most 200 characters; `body` is required and must be a non-empty string. Validation errors return `400` with `{ "error": "<message>" }`. Missing or non-existent ids return `404` with `{ "error": "Note not found" }`.

Data is persisted to a local SQLite file at `./data/quicknotes.db` (created on first run). The `data/` directory is gitkept; the `*.db` files are ignored.
