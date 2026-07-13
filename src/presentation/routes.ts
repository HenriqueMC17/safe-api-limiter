import { Router } from 'express';
import { StatusController } from './controllers/status.controller';
import { TokenBucketRateLimiter } from '../infrastructure/security/token-bucket.limiter';
import { createRateLimitMiddleware } from './middlewares/rate-limit.middleware';

const router = Router();

// Instanciação concreta do limitador de taxa (5 requisições por minuto)
const apiRateLimiter = new TokenBucketRateLimiter(5, 60000);

// Criação do middleware injetando o limitador
const rateLimitMiddleware = createRateLimitMiddleware(apiRateLimiter);

// Instanciação do controlador de status
const statusController = new StatusController();

// Mapeamento do endpoint /api/status com o middleware de Rate Limiter rigoroso aplicado
router.get('/status', rateLimitMiddleware, (req, res, next) => {
  statusController.getStatus(req, res, next);
});

export { router as apiRouter };
