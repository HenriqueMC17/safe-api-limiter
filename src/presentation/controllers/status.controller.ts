import { Request, Response, NextFunction } from 'express';

export class StatusController {
  /**
   * Retorna o status de saúde básico da API (GET /api/status).
   */
  public getStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        message: 'API funcionando normalmente.',
      });
    } catch (error) {
      next(error);
    }
  }
}
