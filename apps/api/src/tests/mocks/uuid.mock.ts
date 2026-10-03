import crypto from 'crypto';

export const v4 = () => crypto.randomUUID();
