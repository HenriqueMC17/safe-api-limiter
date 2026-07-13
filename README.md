# 🛡️ Safe API Limiter

Uma API robusta de alto desempenho desenvolvida em **TypeScript** e **Express**, implementando o algoritmo **Token Bucket** nativo para proteção e limitação de taxa (Rate Limiting) sob princípios de Clean Architecture e conformidade OWASP 2025.

---

## 🚀 Tecnologias

*   **Runtime & Linguagem:** Node.js com TypeScript (tipagem estática forte)
*   **Framework Web:** Express
*   **Limitação de Taxa:** Algoritmo Token Bucket nativo implementado em memória com coletor automático de conexões inativas para evitar vazamentos de memória (Memory Leaks).
*   **Segurança:** Middleware customizado de Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS).

---

## 🏗️ Princípios de Engenharia & Arquitetura

O projeto foi estruturado seguindo os rigorosos padrões de design de software contidos no guia de referência [agente-core](file:///c:/Dev/agente-core/README.md):

1.  **DIP (Dependency Inversion Principle):** O middleware de limitação de taxa depende estritamente de uma abstração (`RateLimiter`), permitindo que a implementação do algoritmo seja facilmente substituída por outros storages (como Redis) sem quebrar as camadas superiores.
2.  **Zero-Trust Security (OWASP 2025):** 
    *   Habilitação segura de proxy trust (`trust proxy`) no Express para evitar spoofing de IP de clientes através de cabeçalhos HTTP.
    *   Presença obrigatória de cabeçalhos de segurança contra Clickjacking, MIME sniffing e XSS.
3.  **Graceful Shutdown:** Implementação de interceptores de ciclo de vida (`SIGTERM` e `SIGINT`) garantindo que as conexões em andamento do Express e o temporizador de limpeza de memória do Rate Limiter sejam drenados e interrompidos com segurança antes de derrubar o processo.

---

## 📊 Estrutura de Pastas

```text
safe-api-limiter/
 ├── src/
 │    ├── core/                         <-- Regras de negócio essenciais e interfaces
 │    │    ├── errors/                  <-- Erros HTTP personalizados (429, 400, etc.)
 │    │    └── interfaces/              <-- Interfaces e abstrações de Rate Limiting
 │    ├── infrastructure/               <-- Detalhes técnicos e persistência
 │    │    └── security/                <-- Implementação concreta do Token Bucket
 │    └── presentation/                 <-- Controladores, middlewares e rotas da API
 │         ├── controllers/             <-- Lógica dos endpoints
 │         ├── middlewares/             <-- Proteções, tratamento de erro e filtros
 │         └── routes.ts                <-- Roteamento de endpoints
 ├── test-rate-limiter.ts               <-- Script utilitário de teste de estresse
 └── tsconfig.json                      <-- Configuração do compilador TypeScript
```

---

## ⚡ Como Rodar o Projeto

### Pré-requisitos
Instale as dependências com seu gerenciador de pacotes favorito:
```bash
npm install
```

### Desenvolvimento
Inicie a API em modo de hot-reload para desenvolvimento local:
```bash
npm run dev
```
A API estará disponível por padrão em `http://localhost:3000`.

### Construção de Produção
Compila o TypeScript para JavaScript otimizado:
```bash
npm run build
npm start
```

### Teste de Rate Limiting
O projeto acompanha um script utilitário projetado para estressar os endpoints e testar o bloqueio temporário por esgotamento de tokens:
```bash
npm run test:limiter
```
Este comando disparará requisições simultâneas contra a rota `/api/status`, demonstrando a resposta `429 Too Many Requests` com os cabeçalhos de controle `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `Retry-After`.
