export class PublicError extends Error {
  constructor(message: string, public readonly code: number = 500) {
    super(message);
  }
}
