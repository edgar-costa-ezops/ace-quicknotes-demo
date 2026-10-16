const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.status(200).type('text/plain; charset=utf-8').send('Hello World');
});

app.get('/health', (req, res) => {
  res.status(200).type('text/plain; charset=utf-8').send('status ok');
});

const port = parseInt(process.env.PORT, 10) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`hello listening on 0.0.0.0:${port}`);
});