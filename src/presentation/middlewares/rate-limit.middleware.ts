import { Request, Response, NextFunction, RequestHandler } from 'express';
import { RateLimiter } from '../../core/interfaces/rate-limiter.interface';
import { TooManyRequestsError } from '../../core/errors/http-errors';

/**
 * Factory para criação do middleware de Rate Limiting.
 * 
 * Segue o princípio de Inversão de Dependência (DIP), dependendo apenas da interface RateLimiter.
 * 
 * @param rateLimiter Implementação do Rate Limiter.
 * @param tokensToConsume Número de tokens a serem consumidos por requisição (padrão 1).
 */
export function createRateLimitMiddleware(
  rateLimiter: RateLimiter,
  tokensToConsume: number = 1
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determina a identidade do cliente usando o IP obtido do Express (considera cabeçalhos proxy se 'trust proxy' estiver ativo)
      const clientId = req.ip || req.socket.remoteAddress || 'unknown';

      // Executa o consumo do token
      const result = await rateLimiter.consume(clientId, tokensToConsume);

      // Define os cabeçalhos HTTP padrão de Rate Limit para fins de transparência do cliente
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000).toString());

      // Guard Clause: Se o limite foi excedido, interrompe o fluxo imediatamente (Fail Fast)
      if (!result.allowed) {
        // Define o header 'Retry-After' em segundos indicando quando o cliente pode tentar novamente
        const retryAfterSeconds = Math.max(0, Math.ceil((result.resetTime.getTime() - Date.now()) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds.toString());

        throw new TooManyRequestsError();
      }

      // Se passou pelo limite, prossegue para o próximo handler/controlador
      next();
    } catch (error) {
      // Propaga o erro para ser capturado pelo middleware centralizado de erros
      next(error);
    }
  };
}
