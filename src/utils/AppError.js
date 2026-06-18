export class AppError extends Error {
  constructor(type) {
    super();
    this.type = type;
  }
}