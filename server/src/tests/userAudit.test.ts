import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from '../controllers/userController.js';

describe('User Management Validation', () => {
  it('validates correct user creation payload', () => {
    const validUser = {
      username: 'pharmacist_john',
      password: 'securePassword123',
      fullName: 'John Doe',
      role: 'pharmacist',
    };

    const parsed = createUserSchema.parse(validUser);
    expect(parsed.username).toBe('pharmacist_john');
    expect(parsed.role).toBe('pharmacist');
  });

  it('rejects invalid usernames and short passwords', () => {
    const invalidUsername = {
      username: 'bad user name!',
      password: '123456',
      fullName: 'Name',
      role: 'pharmacist',
    };
    expect(() => createUserSchema.parse(invalidUsername)).toThrow();

    const shortPassword = {
      username: 'valid_user',
      password: '123',
      fullName: 'Name',
      role: 'owner',
    };
    expect(() => createUserSchema.parse(shortPassword)).toThrow();
  });

  it('validates user update payload', () => {
    const update = {
      fullName: 'Updated Name',
      isActive: false,
    };
    const parsed = updateUserSchema.parse(update);
    expect(parsed.fullName).toBe('Updated Name');
    expect(parsed.isActive).toBe(false);
  });
});
