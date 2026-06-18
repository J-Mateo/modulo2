export const ErrorSelector = {
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export const errors = {
  [ErrorSelector.NOT_FOUND]: {
    statusCode: 404,
    message: 'Resource not found',
  },
  [ErrorSelector.BAD_REQUEST]: {
    statusCode: 400,
    message: 'Invalid request data',
  },
  [ErrorSelector.INTERNAL_ERROR]: {
    statusCode: 500,
    message: 'Internal server error',
  },
};