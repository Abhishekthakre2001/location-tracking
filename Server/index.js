import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET','POST']
  }
});

// In-memory store: { [trackerId]: [{lat,lng,ts}, ...] }
const tracks = {};

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  // client registers as tracker or admin
  socket.on('register', (payload) => {
    // payload: { role: 'tracker'|'admin', id: 'driver_1' }
    socket.data.role = payload?.role || 'tracker';
    socket.data.clientId = payload?.id || socket.id;
    console.log('Registered', socket.data);
  });

  // tracker sends location
  socket.on('locationUpdate', ({ id, lat, lng, accuracy, heading, speed, ts }) => {
    if (!id || typeof lat !== 'number' || typeof lng !== 'number') return;

    const point = { lat, lng, accuracy, heading, speed, ts: ts || Date.now() };
    if (!tracks[id]) tracks[id] = [];
    tracks[id].push(point);

    // Keep only last N points to avoid memory growth (example: 500)
    if (tracks[id].length > 500) tracks[id].shift();

    // Broadcast updated positions to admin clients
    io.emit('locations', { id, points: tracks[id] }); // simple broadcast
  });

  // optional: admin requests all current tracks
  socket.on('requestAll', () => {
    socket.emit('allTracks', tracks);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

app.get('/health', (req, res) => res.json({ ok: true }));

// optional: get current tracks
app.get('/tracks', (req, res) => {
  res.json(tracks);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
