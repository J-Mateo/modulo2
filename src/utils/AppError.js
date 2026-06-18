import { errors, ErrorSelector } from './errors.js';

export class AppError extends Error {
  constructor(type = ErrorSelector.INTERNAL_ERROR, customMessage = null) {
    const error = errors[type] || errors[ErrorSelector.INTERNAL_ERROR];

    super(customMessage || error.message);

    this.name = 'AppError';
    this.type = type;
    this.statusCode = error.statusCode;
    this.isOperational = true;
  }
}