import app from './src/app';
import { AddressInfo } from 'net';

async function runTests() {
  console.log('=== INICIANDO TESTE INTEGRADO DO RATE LIMITER ===\n');

  // Inicializa o servidor Express em uma porta efêmera sorteada pelo SO (evita conflitos)
  const server = app.listen(0, async () => {
    const address = server.address() as AddressInfo;
    const port = address.port;
    const baseUrl = `http://localhost:${port}`;
    console.log(`[TESTE] Servidor de teste temporário iniciado na porta ${port}\n`);

    try {
      let succeeded = true;

      // Executa 6 requisições rápidas seguidas
      for (let i = 1; i <= 6; i++) {
        console.log(`[TESTE] Efetuando requisição #${i}...`);
        
        const response = await fetch(`${baseUrl}/api/status`, {
          headers: { Connection: 'close' }
        });
        const status = response.status;
        const body = await response.json();
        
        // Extrai os headers de rate limit
        const limit = response.headers.get('x-ratelimit-limit');
        const remaining = response.headers.get('x-ratelimit-remaining');
        const reset = response.headers.get('x-ratelimit-reset');
        const retryAfter = response.headers.get('retry-after');

        console.log(`  -> Status Code: ${status}`);
        console.log(`  -> X-RateLimit-Limit: ${limit}`);
        console.log(`  -> X-RateLimit-Remaining: ${remaining}`);
        console.log(`  -> X-RateLimit-Reset: ${reset}`);
        if (retryAfter) {
          console.log(`  -> Retry-After: ${retryAfter} segundos`);
        }
        console.log(`  -> Corpo:`, JSON.stringify(body));

        // Asserções
        if (i <= 5) {
          if (status !== 200) {
            console.error(`\x1b[31m[FALHA] A requisição #${i} deveria retornar 200, mas retornou ${status}\x1b[0m`);
            succeeded = false;
          }
        } else {
          // A 6ª requisição deve retornar 429
          if (status !== 429) {
            console.error(`\x1b[31m[FALHA] A requisição #${i} (excesso do limite) deveria retornar 429, mas retornou ${status}\x1b[0m`);
            succeeded = false;
          } else {
            console.log(`\n\x1b[32m[SUCESSO] Bloqueio de Rate Limit (HTTP 429) validado com sucesso na 6ª requisição!\x1b[0m\n`);
          }
        }
        console.log('--------------------------------------------------');
      }

      if (succeeded) {
        console.log('\x1b[32m[SUCESSO] Todos os testes passaram! O Rate Limiter está funcionando perfeitamente.\x1b[0m');
        process.exitCode = 0;
      } else {
        console.log('\x1b[31m[ERRO] Alguns testes falharam.\x1b[0m');
        process.exitCode = 1;
      }

    } catch (err: any) {
      console.error('[ERRO DURANTE O TESTE]:', err.message);
      process.exitCode = 1;
    } finally {
      console.log('\n[TESTE] Encerrando servidor de teste temporário...');
      server.close(() => {
        console.log('[TESTE] Servidor encerrado.');
        // Executa no próximo ciclo de eventos para evitar colisões com o encerramento do libuv no Windows
        setImmediate(() => {
          process.exit(process.exitCode || 0);
        });
      });
    }
  });
}

runTests();
