const express = require('express');

function build(db) {
  const router = express.Router();

  // POST /notes
  router.post('/', (req, res) => {
    const { title, body } = req.body || {};
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'title must be at most 200 characters' });
    }
    if (typeof body !== 'string' || body.length === 0) {
      return res.status(400).json({ error: 'body is required and must be a non-empty string' });
    }

    const createdAt = new Date().toISOString();
    const insertStmt = db.prepare(
      'INSERT INTO notes (title, body, created_at) VALUES (?, ?, ?)'
    );
    const info = insertStmt.run(title.trim(), body, createdAt);
    const selectStmt = db.prepare(
      'SELECT id, title, body, created_at FROM notes WHERE id = ?'
    );
    const row = selectStmt.get(info.lastInsertRowid);
    return res.status(201).json(row);
  });

  // GET /notes
  router.get('/', (req, res) => {
    const rows = db
      .prepare('SELECT id, title, body, created_at FROM notes')
      .all();
    return res.status(200).json(rows);
  });

  // GET /notes/:id
  router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const row = db
      .prepare('SELECT id, title, body, created_at FROM notes WHERE id = ?')
      .get(id);
    if (!row) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.status(200).json(row);
  });

  // DELETE /notes/:id
  router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const info = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    return res.status(204).send();
  });

  // PUT /notes/:id
  router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const { title, body } = req.body || {};
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'title must be at most 200 characters' });
    }
    if (typeof body !== 'string' || body.length === 0) {
      return res.status(400).json({ error: 'body is required and must be a non-empty string' });
    }
    const info = db
      .prepare('UPDATE notes SET title = ?, body = ? WHERE id = ?')
      .run(title.trim(), body, id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const row = db
      .prepare('SELECT id, title, body, created_at FROM notes WHERE id = ?')
      .get(id);
    return res.status(200).json(row);
  });

  return router;
}

module.exports = { build };
