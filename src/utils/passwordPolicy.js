const MIN_PASSWORD_LENGTH = 8;

const PASSWORD_REQUIREMENTS = [
  {
    test: (password) =>
      password.length >= MIN_PASSWORD_LENGTH,
    message: `at least ${MIN_PASSWORD_LENGTH} characters`,
  },
  {
    test: (password) => /[a-z]/.test(password),
    message: 'one lowercase letter',
  },
  {
    test: (password) => /[A-Z]/.test(password),
    message: 'one uppercase letter',
  },
  {
    test: (password) => /\d/.test(password),
    message: 'one number',
  },
  {
    test: (password) =>
      /[^A-Za-z0-9]/.test(password),
    message: 'one special character',
  },
];

export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['a valid password'],
    };
  }

  const errors = PASSWORD_REQUIREMENTS
    .filter(({ test }) => !test(password))
    .map(({ message }) => message);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPasswordValidationMessage = (
  errors
) => {
  return `Password must contain ${errors.join(', ')}`;
};