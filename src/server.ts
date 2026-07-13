import app from './app';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[SERVIDOR] rodando com qualidade de produção na porta ${PORT}`);
});

// Tratamento de encerramento amigável (Graceful Shutdown)
const shutdown = (signal: string) => {
  console.log(`\n[SERVIDOR] Recebido sinal de término (${signal}). Encerrando conexões graciosamente...`);
  
  server.close(() => {
    console.log('[SERVIDOR] Conexões fechadas. Processo finalizado com sucesso.');
    process.exit(0);
  });

  // Força o término se as conexões demorarem muito para fechar (timeout de 10s)
  setTimeout(() => {
    console.error('[SERVIDOR] Timeout excedido para fechar conexões graciosamente. Forçando encerramento.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
