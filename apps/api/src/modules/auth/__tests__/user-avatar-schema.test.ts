import { updateMeSchema } from '../../users/user.schema';

describe('profile avatar URL', () => {
  it('accepts a URL for the existing avatar_url field', () => {
    expect(updateMeSchema.parse({ avatar_url: 'https://example.com/avatar.png' })).toEqual({
      avatar_url: 'https://example.com/avatar.png',
    });
  });
});
