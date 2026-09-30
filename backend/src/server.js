import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSockets } from './sockets/orderSocket.js';

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const start = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSockets(server);

    server.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    if (err.code === 'ECONNREFUSED' || err.name === 'MongooseServerSelectionError') {
      console.error(
        'MongoDB is not running. Start MongoDB on 127.0.0.1:27017, or run `npm run dev:memory`.'
      );
    }
    process.exit(1);
  }
};

start();
