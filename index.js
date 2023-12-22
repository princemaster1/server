const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Client } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const dbUrl = "postgres://collins_user:SpkuLYpAsCW0WdJ0niHg0ZrRKqFtxMs5@dpg-cln48jhr6k8c73aauu1g-a.oregon-postgres.render.com/collins";
const db = new Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});
db.connect();

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// WebSocket Server Setup
io.on('connection', async (socket) => {
  console.log(`User connected (Socket ID: ${socket.id})`);

  try {
    const result = await db.query('SELECT * FROM comments');
    const comments = result.rows.map(comment => ({
      id: comment.id,
      name: comment.name,
      email: comment.email,
      message: comment.message,
      timestamp: comment.timestamp,
      isSender: false,
    }));
    io.to(socket.id).emit('loadComments', comments);
  } catch (error) {
    console.error('Error loading comments:', error);
  }

  socket.on('newComment', async (comment) => {
    console.log(`New comment received from ${socket.id}:`, comment);

    const isAdmin = comment.email === 'princemaster400@gmail.com';
    const isHTML = isAdmin && comment.message.trim().startsWith('<');

    try {
      const result = await db.query('INSERT INTO comments (name, email, message) VALUES ($1, $2, $3) RETURNING id, name, email, message, timestamp', [comment.name, comment.email, isHTML ? comment.message : escapeHtml(comment.message)]);

      const newComment = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        message: result.rows[0].message,
        timestamp: result.rows[0].timestamp,
        isSender: isAdmin,
      };

      io.emit('newComment', newComment);
      io.to(socket.id).emit('showDeleteButton', newComment.id);
    } catch (error) {
      console.error('Error inserting comment:', error);
    }
  });

  socket.on('deleteComment', async (commentId) => {
    try {
      await db.query('DELETE FROM comments WHERE id = $1', [commentId]);
      io.emit('deleteComment', commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected (Socket ID: ${socket.id})`);
  });
});

// Regular HTTP Server Setup
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, match => map[match]);
}
