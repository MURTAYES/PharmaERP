import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateTokens } from '../controllers/authController.js';
import { config } from '../config/env.js';

describe('Auth Token & Payload Generator', () => {
  it('generates valid access and refresh JWTs with correct claims', () => {
    const mockUser = {
      id: '654321654321654321654321',
      username: 'testpharmacist',
      role: 'pharmacist' as const,
      fullName: 'Test Pharmacist',
    };

    const tokens = generateTokens(mockUser);

    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();

    const decodedAccess = jwt.verify(tokens.accessToken, config.jwtAccessSecret) as any;
    expect(decodedAccess.userId).toBe(mockUser.id);
    expect(decodedAccess.username).toBe(mockUser.username);
    expect(decodedAccess.role).toBe(mockUser.role);
    expect(decodedAccess.fullName).toBe(mockUser.fullName);

    const decodedRefresh = jwt.verify(tokens.refreshToken, config.jwtRefreshSecret) as any;
    expect(decodedRefresh.userId).toBe(mockUser.id);
    expect(decodedRefresh.role).toBe(mockUser.role);
  });
});
