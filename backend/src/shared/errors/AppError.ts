export interface AppErrorDetail {
  field: string;
  message: string;
}

export interface AppErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: AppErrorDetail[];
}

/**
 * Represents an expected application error with a client-safe HTTP response.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: AppErrorDetail[];

  constructor({ statusCode, code, message, details }: AppErrorOptions) {
    super(message);

    if (statusCode < 400 || statusCode > 599) {
      throw new RangeError('AppError statusCode must be between 400 and 599.');
    }

    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
