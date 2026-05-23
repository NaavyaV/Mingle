require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDb } = require('./db');
const usersRouter = require('./routes/users');
const friendsRouter = require('./routes/friends');
const messagesRouter = require('./routes/messages');
const eventsRouter = require('./routes/events');

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'mingle-server' });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/users', usersRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/events', eventsRouter);

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal server error' });
});

connectDb(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  });
