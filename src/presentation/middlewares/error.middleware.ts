import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../core/errors/http-errors';

/**
 * Middleware centralizado de tratamento de erros.
 * Garante o princípio de "Fail Safe", capturando exceções e ocultando stack traces sensíveis.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Se for um erro operacional mapeado (ex: BadRequestError, TooManyRequestsError)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
    return;
  }

  // Registra internamente o erro desconhecido para fins de auditoria/observabilidade
  console.error('[ERRO NÃO TRATADO EM PRODUÇÃO]:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Retorna uma resposta amigável e segura ao cliente, prevenindo Information Disclosure
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(isProduction ? {} : { details: err.message, stack: err.stack }),
  });
}
