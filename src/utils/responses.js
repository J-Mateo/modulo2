import { serializeApiData } from './serializeApiData.js';

export const sendSuccess = (
  res,
  {
    statusCode = 200,
    data = null,
    message,
    meta,
  } = {}
) => {
  const body = {
    success: true,
    data: serializeApiData(data),
  };

  if (message) {
    body.message = message;
  }

  if (meta !== undefined) {
    body.meta = serializeApiData(meta);
  }

  return res
    .status(statusCode)
    .json(body);
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