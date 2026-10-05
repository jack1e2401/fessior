import { createServer } from 'node:http';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { io as createClient } from 'socket.io-client';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env';

jest.setTimeout(15000);

it('delivers a match-room event across Backend HTTP Service instances', async () => {
  const clients = Array.from({ length: 4 }, () => new Redis({ host: env.REDIS_HOST, port: env.REDIS_PORT }));
  const httpA = createServer();
  const httpB = createServer();
  const ioA = new Server(httpA);
  const ioB = new Server(httpB);
  ioA.adapter(createAdapter(clients[0], clients[1]));
  ioB.adapter(createAdapter(clients[2], clients[3]));
  await Promise.all(clients.map((client) => client.ping()));
  const room = `match:adapter-test-${Date.now()}`;
  ioA.on('connection', (socket) => socket.join(room));
  await Promise.all([
    new Promise<void>((resolve) => httpA.listen(0, '127.0.0.1', resolve)),
    new Promise<void>((resolve) => httpB.listen(0, '127.0.0.1', resolve)),
  ]);
  const address = httpA.address();
  if (!address || typeof address === 'string') throw new Error('Missing socket address');
  const browser = createClient(`http://127.0.0.1:${address.port}`, { transports: ['websocket'] });
  try {
    await new Promise<void>((resolve, reject) => {
      browser.once('connect', resolve);
      browser.once('connect_error', reject);
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Cross-instance room event not delivered')), 5000);
      browser.once('match-ended', (payload: { matchId: string }) => {
        clearTimeout(timeout);
        try { expect(payload.matchId).toBe(room); resolve(); } catch (error) { reject(error); }
      });
      setTimeout(() => ioB.to(room).emit('match-ended', { matchId: room }), 100);
    });
  } finally {
    browser.disconnect();
    await Promise.all([new Promise<void>((resolve) => ioA.close(() => resolve())), new Promise<void>((resolve) => ioB.close(() => resolve()))]);
    await Promise.all(clients.map((client) => client.quit()));
  }
});
