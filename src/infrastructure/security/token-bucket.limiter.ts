import { RateLimiter, RateLimitResult } from '../../core/interfaces/rate-limiter.interface';

interface Bucket {
  tokens: number;      // Número atual de tokens (pode ser fracionário)
  lastRefill: number;  // Timestamp Unix do último cálculo de recarga
}

export class TokenBucketRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly windowMs: number;
  private cleanupInterval?: NodeJS.Timeout;

  /**
   * Inicializa o Token Bucket Limiter.
   * @param capacity Capacidade máxima do balde (ex: 5 tokens).
   * @param windowMs Janela de tempo em milissegundos para recarga completa (ex: 60000ms = 1 minuto).
   */
  constructor(capacity: number = 5, windowMs: number = 60000) {
    this.capacity = capacity;
    this.windowMs = windowMs;

    // Inicializa a limpeza periódica para evitar vazamento de memória por IPs inativos.
    this.startCleanupJob();
  }

  public async consume(key: string, tokensToConsume: number = 1): Promise<RateLimitResult> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      // Primeira requisição deste identificador: cria o balde cheio
      bucket = {
        tokens: this.capacity,
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
    } else {
      // Calcula a quantidade de tokens a serem recarregados desde a última requisição
      const elapsedMs = now - bucket.lastRefill;
      
      // Taxa de recarga: (Capacidade / Janela de tempo) por milissegundo
      const refillRatePerMs = this.capacity / this.windowMs;
      const tokensToAdd = elapsedMs * refillRatePerMs;

      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }
    }

    // Guard Clause: Verifica se há tokens suficientes no balde
    if (bucket.tokens < tokensToConsume) {
      // Calcula quanto tempo levará para ter pelo menos 1 token disponível
      const tokensNeeded = tokensToConsume - bucket.tokens;
      const timeNeededMs = tokensNeeded * (this.windowMs / this.capacity);
      const resetTime = new Date(now + timeNeededMs);

      return {
        allowed: false,
        limit: this.capacity,
        remaining: Math.floor(bucket.tokens), // Retorna o valor inteiro para o cliente
        resetTime,
      };
    }

    // Consome os tokens
    bucket.tokens -= tokensToConsume;

    // Calcula o tempo até o balde estar 100% cheio novamente
    const missingTokens = this.capacity - bucket.tokens;
    const timeToFullMs = missingTokens * (this.windowMs / this.capacity);
    const resetTime = new Date(now + timeToFullMs);

    return {
      allowed: true,
      limit: this.capacity,
      remaining: Math.floor(bucket.tokens),
      resetTime,
    };
  }

  /**
   * Limpa baldes inativos que já estão totalmente recarregados.
   * Executa a cada 5 minutos por padrão para evitar vazamento de memória.
   */
  private startCleanupJob(): void {
    const checkIntervalMs = 5 * 60 * 1000; // 5 minutos

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.buckets.entries()) {
        const elapsedMs = now - bucket.lastRefill;
        const refillRatePerMs = this.capacity / this.windowMs;
        const currentTokens = Math.min(this.capacity, bucket.tokens + elapsedMs * refillRatePerMs);

        // Se o balde já está cheio e não foi atualizado no tempo de uma janela completa, remove-o
        if (currentTokens >= this.capacity && elapsedMs > this.windowMs) {
          this.buckets.delete(key);
        }
      }
    }, checkIntervalMs);

    // Impede que o timer mantenha o processo do Node ativo se o servidor for desligado
    this.cleanupInterval.unref();
  }

  /**
   * Destrutor útil para encerramento limpo (graceful shutdown) em testes.
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.buckets.clear();
  }
}
