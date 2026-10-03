import '../config/env';
import { prisma } from '../config/prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
