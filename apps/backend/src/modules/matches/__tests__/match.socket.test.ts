import { SOCKET_EVENTS, SOCKET_ROOMS } from '@ocj/contracts';
import { registerMatchSocketHandlers } from '../match.socket';
import { matchService } from '../match.service';

jest.mock('../match.service', () => ({ matchService: { canJoinMatch: jest.fn(), handleForfeit: jest.fn() } }));
jest.mock('../matchmaking.service', () => ({ matchmakingService: { joinQueue: jest.fn(), leaveQueue: jest.fn() } }));

describe('authenticated match socket authorization', () => {
  const handlers = new Map<string, (...args: any[]) => Promise<void> | void>();
  const socket = {
    data: { user: { userId: 'member' } }, id: 'socket-1',
    on: jest.fn((event: string, callback: (...args: any[]) => Promise<void> | void) => { handlers.set(event, callback); }),
    join: jest.fn(), leave: jest.fn(), emit: jest.fn(),
  } as any;

  beforeEach(() => {
    handlers.clear(); jest.clearAllMocks();
    registerMatchSocketHandlers({} as any, socket);
  });

  it('rejects an outsider before joining match room', async () => {
    (matchService.canJoinMatch as jest.Mock).mockResolvedValue(false);
    await handlers.get(SOCKET_EVENTS.JOIN_MATCH)!({ matchId: 'private-match' });
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.ERROR, expect.objectContaining({ message: 'Not a match participant' }));
  });

  it('rejects a socket without authenticated user context', async () => {
    const anonymous = { ...socket, data: {}, join: jest.fn(), emit: jest.fn(), on: socket.on } as any;
    registerMatchSocketHandlers({} as any, anonymous);
    await handlers.get(SOCKET_EVENTS.JOIN_MATCH)!({ matchId: 'private-match' });
    expect(anonymous.join).not.toHaveBeenCalled();
    expect(anonymous.emit).toHaveBeenCalledWith(SOCKET_EVENTS.ERROR, expect.anything());
  });

  it('joins only after membership is verified', async () => {
    (matchService.canJoinMatch as jest.Mock).mockResolvedValue(true);
    await handlers.get(SOCKET_EVENTS.JOIN_MATCH)!({ matchId: 'member-match' });
    expect(matchService.canJoinMatch).toHaveBeenCalledWith('member-match', 'member');
    expect(socket.join).toHaveBeenCalledWith(SOCKET_ROOMS.match('member-match'));
  });

  it('rejects an unauthorized forfeit', async () => {
    (matchService.handleForfeit as jest.Mock).mockResolvedValue(false);
    await handlers.get(SOCKET_EVENTS.FORFEIT_MATCH)!({ matchId: 'private-match' });
    expect(matchService.handleForfeit).toHaveBeenCalledWith(expect.anything(), 'private-match', 'member');
    expect(socket.emit).toHaveBeenCalledWith(SOCKET_EVENTS.ERROR, expect.objectContaining({ message: 'Not a match participant' }));
  });
});
