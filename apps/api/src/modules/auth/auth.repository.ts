import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const createUser = async (data: Prisma.UserCreateInput) => {
  return prisma.user.create({ data });
};

export const saveRefreshToken = async (userId: string, token: string, expiresAt: Date) => {
  return prisma.refreshToken.create({
    data: {
      user_id: userId,
      token,
      expires_at: expiresAt,
    },
  });
};
export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
};

export const deleteRefreshToken = async (token: string) => {
  return prisma.refreshToken.delete({
    where: { token },
  });
};
