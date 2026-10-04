import { op, page, path, type Paths } from './common';

export const matchPaths: Paths = {
  '/api/v1/matches/history': { get: op('Matches', 'Get my match history', 200, { parameters: page }) },
  '/api/v1/matches/active': { get: op('Matches', 'Get my active match') },
  '/api/v1/matches/{matchId}': {
    get: op('Matches', 'Get match details', 200, { parameters: [path('matchId')] }),
    delete: op('Matches', 'Delete match', 200, { parameters: [path('matchId')], description: 'Administrator only.' }),
  },
};
