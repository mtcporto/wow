# De catálogo a calculador de builds

A aplicação passa a usar Next.js App Router, React e TypeScript. A próxima entrega funcional será um calculador de talentos. Turso e autenticação Google ficam para depois; a aplicação atual não exige banco nem login.

## Fronteiras da aplicação

- `app/`: rotas de classes, mascotes e exploração, layout comum, erro/404 e API da Blizzard.
- `components/`: navegação e idioma em React, compartilhados entre páginas.
- `features/classes/`: catálogo de classes convertido para React, com cancelamento das consultas quando o idioma muda.
- `features/legacy/` e `public/legacy/`: fronteira temporária que preserva os catálogos, árvores e tooltips já implementados. São iniciados depois da hidratação, em ordem, sem `eval` nem HTML externo. A navegação dessas páginas continua por documento completo para não reaproveitar listeners, observers e estado imperativo entre rotas. Esta camada não deve receber o motor de pontos do calculador.
- `lib/blizzard/` e `server/blizzard.cjs`: comunicação com a API. OAuth, credenciais, validação de recursos e cache do token permanecem no servidor. O cliente usa a API da mesma origem.
- `features/builds/types.ts`: formato versionado de uma build, vinculado à versão do jogo, árvore e especialização.
- `lib/builds/repository.ts`: contrato de persistência com proprietário obrigatório; uma futura implementação Turso será exclusiva do servidor.
- `public/data/`: snapshots de catálogo, renovados pelos scripts existentes.

Os URLs `.html` são compatíveis por rewrites do Next.js, preservando query strings. As rotas canônicas são `/`, `/pets` e `/explore`. `.htaccess` encaminha somente `/wow` para o Next local. Não há servidor estático Node separado.

## Próximas entregas

1. Converter a árvore de talentos para componentes React com estado explícito. Separar normalização da API, regras, reducer de alocações e renderização.
2. Investigar e documentar regras do patch atual: pontos por nível, limites por árvore, pré-requisitos, gates, graus e nós de escolha. Nem toda conexão da API equivale a um requisito obrigatório; não assumir essas regras por aparência.
3. Implementar alocação/reembolso, troca de hero tree e tratamento de dependentes, com testes do motor de regras. Recalcular orçamentos e validar toda build carregada, sem confiar em dados do navegador.
4. Importação/exportação e URLs compartilháveis, com formato versionado e testes de round-trip; o formato nativo do WoW precisa de uma investigação própria.
5. Adicionar Google OAuth e sessões verificadas no servidor. Exploração e calculador anônimo continuam disponíveis; salvar builds exige autenticação.
6. Implementar o repositório Turso, schema/migrações, propriedade, visibilidade e controle de concorrência. IDs de proprietário devem vir da sessão, nunca do payload do cliente.

## Operação

`npm run dev` usa `localhost:3000` com atualização automática. `npm run build` e `npm start` validam/servem produção sem prefixo; Vercel usa essa configuração.

A prévia Apache `localhost/wow` usa `npm run build:local` e `npm run start:local`, com prefixo `/wow` e diretório `.next-local`. O serviço `wow-local.service` mantém a prévia na porta 8788. Após editar, recompile e reinicie o serviço. Essa configuração evita o bloqueio de hidratação encontrado no Next dev quando o Apache não encaminha o WebSocket de HMR. O servidor de desenvolvimento direto permanece independente.

As credenciais existentes `.env.local` foram preservadas. Configurações futuras de Turso e Google não são obrigatórias nem conectadas nesta etapa.
