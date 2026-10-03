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

export const updateUserPassword = async (userId: string, newPasswordHash: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password_hash: newPasswordHash },
  });
};

export const findRefreshTokenById = async (tokenId: string) => {
  return prisma.refreshToken.findUnique({
    where: { id: tokenId },
  });
};

export const revokeRefreshTokenById = async (tokenId: string) => {
  return prisma.refreshToken.update({
    where: { id: tokenId },
    data: { is_revoked: true },
  });
};

export const revokeAllUserSessions = async (userId: string) => {
  return prisma.refreshToken.updateMany({
    where: { 
      user_id: userId,
      is_revoked: false  
    },
    data: { is_revoked: true },
  });
};

export const getUserSessions = async (userId: string) => {
  return prisma.refreshToken.findMany({
    where: {
      user_id: userId,
      is_revoked: false,
      expires_at: { gt: new Date() }, 
    },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      user_agent: true,
      ip_address: true,
      created_at: true,
      expires_at: true,
      last_used_at: true,
    },
  });
};

export const createPasswordResetToken = async (userId: string, token: string, expiresAt: Date) => {
  return prisma.passwordResetToken.create({
    data: {
      token,
      user_id: userId,
      expires_at: expiresAt,
    },
  });
};

export const findValidResetToken = async (token: string) => {
  return prisma.passwordResetToken.findFirst({
    where: {
      token: token,
      used: false,
      expires_at: { gt: new Date() },
    },
  });
};

export const markResetTokenAsUsed = async (tokenId: string) => {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { used: true },
  });
};