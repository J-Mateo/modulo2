export const sendSuccess = (res, { statusCode = 200, data = null, message } = {}) => {
  const body = {
    success: true,
    data,
  };

  if (message) {
    body.message = message;
  }

  return res.status(statusCode).json(body);
};

export const sendError = (
  res,
  {
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    message = 'Internal server error',
  } = {}
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};