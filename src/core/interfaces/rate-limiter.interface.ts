export interface RateLimitResult {
  /**
   * Indica se a requisição é permitida.
   */
  allowed: boolean;

  /**
   * O número máximo de tokens (requisições permitidas na janela).
   */
  limit: number;

  /**
   * O número de tokens restantes no balde para este cliente.
   */
  remaining: number;

  /**
   * Data/Hora em que o balde será totalmente recarregado.
   */
  resetTime: Date;
}

export interface RateLimiter {
  /**
   * Consome tokens do balde associado à chave identificadora (IP ou ID do usuário).
   * @param key Chave identificadora (ex: endereço IP do cliente).
   * @param tokens Quantidade de tokens a serem consumidos (padrão é 1).
   */
  consume(key: string, tokens?: number): Promise<RateLimitResult>;
}
