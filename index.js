const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Client } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const DATABASE_URL = 'postgres://collins_user:SpkuLYpAsCW0WdJ0niHg0ZrRKqFtxMs5@dpg-cln48jhr6k8c73aauu1g-a.oregon-postgres.render.com/collins';
const maintenanceStatus = { active: false, startTime: null, stopTime: null };

const pgClient = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pgClient.connect();

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  console.log('\x1b[32m%s\x1b[0m', 'User connected');

  socket.emit('maintenanceStatus', maintenanceStatus);

  socket.on('updateMaintenanceStatus', (newStatus) => {
    maintenanceStatus.active = newStatus.active;
    maintenanceStatus.startTime = newStatus.startTime;
    maintenanceStatus.stopTime = newStatus.stopTime;

    io.emit('maintenanceStatus', maintenanceStatus);
  });

  socket.on('disconnect', () => {
    console.log('\x1b[33m%s\x1b[0m', 'User disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
