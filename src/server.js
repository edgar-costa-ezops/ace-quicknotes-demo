const { createDb } = require('./db');
const { createApp } = require('./app');

const db = createDb();
const app = createApp(db);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`QuickNotes API listening on http://127.0.0.1:${PORT}`);
});
