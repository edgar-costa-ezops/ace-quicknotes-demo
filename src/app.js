const path = require('path');
const express = require('express');
const notesRouter = require('./routes/notes');

function createApp(db) {
  const app = express();
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.json());
  app.use('/notes', notesRouter.build(db));
  return app;
}
module.exports = { createApp };
