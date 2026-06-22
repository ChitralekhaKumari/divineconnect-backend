// divineConnect/divineconnect_backend/src/server.js
// REPLACE your entire existing server.js with this file

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const templeRoutes = require('./routes/temples');
const prayerRoutes = require('./routes/prayers');
const calendarRoutes = require('./routes/calendar');   // ← NEW LINE
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://divineconnect-frontend.vercel.app',
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/temples', templeRoutes);
app.use('/api/prayers', prayerRoutes);
app.use('/api/calendar', calendarRoutes);   // ← NEW LINE

// ─── Errors ───────────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 DivineConnect API running on http://localhost:${PORT}`);
  console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health       : http://localhost:${PORT}/health`);
  console.log(`   Temples API  : http://localhost:${PORT}/api/temples`);
  console.log(`   Calendar API : http://localhost:${PORT}/api/calendar/festivals\n`);
});

module.exports = app;
