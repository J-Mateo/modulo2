import bcrypt from 'bcrypt';

describe('auth password hashing', () => {
  test('hashes a password and validates it correctly', async () => {
    const password = 'password123';

    const passwordHash = await bcrypt.hash(password, 10);

    const isValidPassword = await bcrypt.compare(password, passwordHash);

    expect(passwordHash).not.toBe(password);
    expect(isValidPassword).toBe(true);
  });

  test('returns false when password is incorrect', async () => {
    const password = 'password123';
    const wrongPassword = 'wrongpassword';

    const passwordHash = await bcrypt.hash(password, 10);

    const isValidPassword = await bcrypt.compare(wrongPassword, passwordHash);

    expect(isValidPassword).toBe(false);
  });
});