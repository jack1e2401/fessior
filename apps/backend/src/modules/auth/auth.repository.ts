import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { randomUUID } from 'node:crypto';

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserByUsername = async (username: string) => {
  return prisma.user.findUnique({ where: { username } });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUserProfile = async (id: string, data: { username: string; full_name: string | null; bio: string | null }) => {
  return prisma.user.update({
    where: { id },
    data,
  });
};

export const createPasswordResetToken = async (userId: string, tokenHash: string, expiresAt: Date) => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM password_reset_tokens WHERE expires_at <= CURRENT_TIMESTAMP(3)`;
    await tx.$executeRaw`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
    await tx.$executeRaw`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (${randomUUID()}, ${userId}, ${tokenHash}, ${expiresAt})`;
  });
};

export const findPasswordResetToken = async (tokenHash: string) => {
  const rows = await prisma.$queryRaw<Array<{ id: string; user_id: string; expires_at: Date; is_banned: boolean }>>`
    SELECT p.id, p.user_id, p.expires_at, u.is_banned
    FROM password_reset_tokens p
    INNER JOIN users u ON u.id = p.user_id
    WHERE p.token_hash = ${tokenHash}
    LIMIT 1
  `;
  return rows[0] ?? null;
};

export const completePasswordReset = async (userId: string, tokenId: string, passwordHash: string) => {
  return prisma.$transaction(async (tx) => {
    const consumed = await tx.$executeRaw`DELETE FROM password_reset_tokens WHERE id = ${tokenId} AND user_id = ${userId} AND expires_at > CURRENT_TIMESTAMP(3)`;
    if (consumed !== 1) return false;
    await tx.$executeRaw`UPDATE users SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ${userId}`;
    await tx.$executeRaw`DELETE FROM refresh_tokens WHERE user_id = ${userId}`;
    await tx.$executeRaw`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
    return true;
  });
};

export const deletePasswordResetToken = async (id: string) => {
  await prisma.$executeRaw`DELETE FROM password_reset_tokens WHERE id = ${id}`;
};

export const deletePasswordResetTokenByHash = async (tokenHash: string) => {
  await prisma.$executeRaw`DELETE FROM password_reset_tokens WHERE token_hash = ${tokenHash}`;
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
