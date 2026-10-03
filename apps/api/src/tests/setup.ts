import { prisma } from '../config/prisma';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Tải .env của API
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Load optional local integration settings from the root .env.docker.
const dockerEnvPath = path.resolve(__dirname, '../../../../.env.docker');
if (fs.existsSync(dockerEnvPath)) {
  const dockerEnv = dotenv.parse(fs.readFileSync(dockerEnvPath));
  if (dockerEnv.JUDGE0_URL && !process.env.JUDGE0_URL) {
    process.env.JUDGE0_URL = dockerEnv.JUDGE0_URL;
  }
}

// Nếu URL trỏ đến host.docker.internal (trong môi trường docker), chuyển thành localhost để chạy ở host
if (process.env.JUDGE0_URL === 'http://host.docker.internal:2358') {
  process.env.JUDGE0_URL = 'http://localhost:2358';
}

afterAll(async () => {
  await prisma.$disconnect();
});
