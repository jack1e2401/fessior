import { act, renderHook, waitFor } from '@testing-library/react';
import type { IUser } from '@ocj/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authRepository } from '../app/api/client';
import { useAuthStore } from '../features/auth/auth.store';
import { AuthProvider, useAuth } from './AuthContext';

const socketMocks = vi.hoisted(() => {
  let matchEndedListener: ((data: {
    matchId: string;
    winnerId: string;
    loserId: string;
    eloUpdates: Record<string, { elo: number; change: number }>;
  }) => void) | undefined;

  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onMatchEnded: vi.fn((listener: typeof matchEndedListener) => {
      matchEndedListener = listener;
      return () => { matchEndedListener = undefined; };
    }),
    emitMatchEnded: (data: NonNullable<typeof matchEndedListener> extends (arg: infer T) => void ? T : never) => {
      matchEndedListener?.(data);
    },
  };
});

vi.mock('../app/api/client', () => ({
  authRepository: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    updateMe: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/socket', () => ({
  socketService: {
    connect: socketMocks.connect,
    disconnect: socketMocks.disconnect,
    onMatchEnded: socketMocks.onMatchEnded,
  },
}));

const staleUser = { id: 'user-1', username: 'Jack1e', role: 'ADMIN', elo_rating: 1200 } as IUser;
const currentUser = { ...staleUser, elo_rating: 1185 };

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext ELO synchronization', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().clear();
    vi.clearAllMocks();
  });

  it('refreshes a persisted user from the server when restoring the session', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: staleUser,
    });
    vi.mocked(authRepository.me).mockResolvedValue(currentUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.elo_rating).toBe(1185));
    expect(authRepository.me).toHaveBeenCalledOnce();
  });

  it('updates the shared user ELO when a match result arrives', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: staleUser,
    });
    vi.mocked(authRepository.me).mockResolvedValue(staleUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.elo_rating).toBe(1200));

    act(() => {
      socketMocks.emitMatchEnded({
        matchId: 'match-1',
        winnerId: 'opponent-1',
        loserId: 'user-1',
        eloUpdates: { 'user-1': { elo: 1185, change: -15 } },
      });
    });

    await waitFor(() => expect(result.current.user?.elo_rating).toBe(1185));
  });
});
