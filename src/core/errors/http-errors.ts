/**
 * Classe base para todos os erros operacionais (erros previstos no sistema).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro disparado quando o cliente excede o limite de requisições (HTTP 429).
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests - Limite de requisições excedido.') {
    super(message, 429);
  }
}

/**
 * Erro disparado quando a requisição é inválida (HTTP 400).
 */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}
