export const ErrorSelector = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export const errors = {
  [ErrorSelector.BAD_REQUEST]: {
    statusCode: 400,
    message: 'Invalid request data',
  },
  [ErrorSelector.UNAUTHORIZED]: {
    statusCode: 401,
    message: 'Unauthorized',
  },
  [ErrorSelector.FORBIDDEN]: {
    statusCode: 403,
    message: 'Forbidden',
  },
  [ErrorSelector.NOT_FOUND]: {
    statusCode: 404,
    message: 'Resource not found',
  },
  [ErrorSelector.CONFLICT]: {
    statusCode: 409,
    message: 'Resource already exists',
  },
  [ErrorSelector.INTERNAL_ERROR]: {
    statusCode: 500,
    message: 'Internal server error',
  },
};