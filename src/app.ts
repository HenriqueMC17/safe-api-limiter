import express, { Application, Request, Response, NextFunction } from 'express';
import { apiRouter } from './presentation/routes';
import { errorHandler } from './presentation/middlewares/error.middleware';
import { BadRequestError } from './core/errors/http-errors';

const app: Application = express();

// Habilita o parse de JSON nas requisições
app.use(express.json());

// Middleware de Security Headers (Alinhamento com agente-core/api-design-rules.md)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

/**
 * IMPORTANTE PARA PRODUÇÃO:
 * Configura o Express para confiar nos proxies à frente dele (como Nginx, ALB, Cloudflare).
 * Garante que req.ip obtenha o IP original do cliente, e não o IP interno do proxy.
 */
app.set('trust proxy', true);

// Registra as rotas da API
app.use('/api', apiRouter);

// Tratamento de rotas inexistentes (Fallback 404)
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new BadRequestError(`Rota não encontrada: ${req.method} ${req.path}`));
});

// Middleware centralizado de tratamento de erros (deve ser o último a ser registrado)
app.use(errorHandler);

export default app;
