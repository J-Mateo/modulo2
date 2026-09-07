import {
  getPasswordValidationMessage,
  validatePassword,
} from '../../src/utils/passwordPolicy.js';

describe(
  'passwordPolicy',
  () => {
    test(
      'accepts a password that satisfies all requirements',
      () => {
        const result =
          validatePassword(
            'SecurePassword123!'
          );

        expect(
          result.isValid
        ).toBe(true);

        expect(
          result.errors
        ).toEqual([]);
      }
    );

    test(
      'rejects password shorter than 8 characters',
      () => {
        const result =
          validatePassword(
            'Aa1!'
          );

        expect(
          result.isValid
        ).toBe(false);

        expect(
          result.errors
        ).toContain(
          'at least 8 characters'
        );
      }
    );

    test(
      'requires a lowercase letter',
      () => {
        const result =
          validatePassword(
            'PASSWORD123!'
          );

        expect(
          result.errors
        ).toContain(
          'one lowercase letter'
        );
      }
    );

    test(
      'requires an uppercase letter',
      () => {
        const result =
          validatePassword(
            'password123!'
          );

        expect(
          result.errors
        ).toContain(
          'one uppercase letter'
        );
      }
    );

    test(
      'requires a number',
      () => {
        const result =
          validatePassword(
            'Password!'
          );

        expect(
          result.errors
        ).toContain(
          'one number'
        );
      }
    );

    test(
      'requires a special character',
      () => {
        const result =
          validatePassword(
            'Password123'
          );

        expect(
          result.errors
        ).toContain(
          'one special character'
        );
      }
    );

    test(
      'returns all missing requirements instead of only the first one',
      () => {
        const result =
          validatePassword(
            'password'
          );

        expect(
          result.isValid
        ).toBe(false);

        expect(
          result.errors
        ).toEqual(
          expect.arrayContaining([
            'one uppercase letter',
            'one number',
            'one special character',
          ])
        );
      }
    );

    test(
      'builds a readable validation message',
      () => {
        const message =
          getPasswordValidationMessage([
            'one uppercase letter',
            'one number',
          ]);

        expect(
          message
        ).toBe(
          'Password must contain one uppercase letter, one number'
        );
      }
    );
  }
);