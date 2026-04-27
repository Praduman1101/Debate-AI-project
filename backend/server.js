require('dotenv').config();
require('./config/validateEnv')();
const express       = require('express');
const http          = require('http');
const { Server }    = require('socket.io');
const cors          = require('cors');
const helmet        = require('helmet');
const compression   = require('compression');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');
const connectDB     = require('./config/db');
const initDebateSocket = require('./socket/debateSocket');
const initMatchmaking  = require('./socket/matchmakingSocket');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET','POST'], credentials: true },
  pingTimeout: 60000,
  pingInterval: 25000,
});

connectDB();

app.use(require('./middleware/requestId'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Too many requests.' } });
const aiLimiter  = rateLimit({ windowMs: 60*1000,    max: 20,  message: { error: 'AI rate limit reached.' } });
app.use('/api/',       apiLimiter);
app.use('/api/voice/', aiLimiter);

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/debates', require('./routes/debates'));
app.use('/api/topics',  require('./routes/topics'));
app.use('/api/scores',  require('./routes/scores'));
app.use('/api/voice',   require('./routes/voice'));
app.use('/api/admin',   require('./routes/admin'));

app.get('/health', (req, res) => res.json({
  status: 'OK', uptime: `${Math.round(process.uptime())}s`,
  environment: process.env.NODE_ENV, socketClients: io.engine.clientsCount,
}));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

initDebateSocket(io);
initMatchmaking(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n⚡ DebateAI server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   WebSocket   : ready`);
  console.log(`   Matchmaking : ready\n`);
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT',  () => { server.close(() => process.exit(0)); });

module.exports = { app, server, io };

app.get("/", (req, res) => {
  res.send("🚀 Debate AI Backend is Running Successfully!");
});