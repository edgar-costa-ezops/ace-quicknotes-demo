const path = require('path');
const fs = require('fs');
const os = require('os');
const request = require('supertest');

const { createDb } = require('../src/db');
const { createApp } = require('../src/app');

let dbPath;
let db;
let app;

beforeEach(() => {
  dbPath = path.join(
    os.tmpdir(),
    `quicknotes-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
  );
  db = createDb(dbPath);
  app = createApp(db);
});

afterEach(() => {
  db.close();
  try {
    fs.unlinkSync(dbPath);
  } catch (_) {
    // best-effort cleanup
  }
});

describe('QuickNotes CRUD API', () => {
  // Acceptance criterion #1
  test('POST /notes returns 201 with {id, title, body, created_at}', async () => {
    const res = await request(app)
      .post('/notes')
      .send({ title: 'first', body: 'hello world' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: 'first',
        body: 'hello world',
        created_at: expect.any(String),
      })
    );
    expect(typeof res.body.id).toBe('number');
  });

  // Acceptance criterion #2
  describe('POST /notes validation', () => {
    test('returns 400 when title is missing', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ body: 'no title' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when body is missing', async () => {
      const res = await request(app)
        .post('/notes')
        .send({ title: 'no body' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when title is longer than 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await request(app)
        .post('/notes')
        .send({ title: longTitle, body: 'ok' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // Acceptance criterion #3
  test('GET /notes returns an array containing every previously POSTed note', async () => {
    const a = await request(app).post('/notes').send({ title: 'A', body: 'aaa' });
    const b = await request(app).post('/notes').send({ title: 'B', body: 'bbb' });
    const c = await request(app).post('/notes').send({ title: 'C', body: 'ccc' });

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(c.status).toBe(201);

    const res = await request(app).get('/notes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(3);
    const titles = res.body.map((n) => n.title);
    expect(titles).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    for (const note of res.body) {
      expect(note).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          body: expect.any(String),
          created_at: expect.any(String),
        })
      );
    }
  });

  // Acceptance criterion #4
  test('GET /notes/:id returns the matching note for each id', async () => {
    const a = await request(app).post('/notes').send({ title: 'one', body: 'first body' });
    const b = await request(app).post('/notes').send({ title: 'two', body: 'second body' });
    const idA = a.body.id;
    const idB = b.body.id;

    const resA = await request(app).get(`/notes/${idA}`);
    expect(resA.status).toBe(200);
    expect(resA.body).toEqual(
      expect.objectContaining({
        id: idA,
        title: 'one',
        body: 'first body',
        created_at: expect.any(String),
      })
    );

    const resB = await request(app).get(`/notes/${idB}`);
    expect(resB.status).toBe(200);
    expect(resB.body).toEqual(
      expect.objectContaining({
        id: idB,
        title: 'two',
        body: 'second body',
        created_at: expect.any(String),
      })
    );
  });

  // Acceptance criterion #5
  test('GET /notes/:id with a non-existent id returns 404 with an error body', async () => {
    const res = await request(app).get('/notes/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // Acceptance criterion #6
  test('DELETE /notes/:id returns 204 for an existing note, and follow-up GET returns 404', async () => {
    const created = await request(app)
      .post('/notes')
      .send({ title: 'to delete', body: 'gone soon' });
    expect(created.status).toBe(201);
    const id = created.body.id;

    const del = await request(app).delete(`/notes/${id}`);
    expect(del.status).toBe(204);

    const followUp = await request(app).get(`/notes/${id}`);
    expect(followUp.status).toBe(404);
    expect(followUp.body).toHaveProperty('error');
  });

  // Acceptance criterion #7
  test('DELETE /notes/:id with a non-existent id returns 404', async () => {
    const res = await request(app).delete('/notes/999999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
