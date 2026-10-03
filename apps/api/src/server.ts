import './config/env';

import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { initSocket } from './realtime/socket';

const PORT = process.env.PORT || 6868;

const startServer = async () => {
  const server = http.createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  initSocket(io);

  server.listen(PORT, () => {
    console.log(`Server is running on PORT: ${PORT}`);
  });
};

startServer();
