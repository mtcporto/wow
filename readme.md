# Azeroth Explorer

## Descrição

Azeroth Explorer é um catálogo conectado de World of Warcraft: classes, raças, especializações, talentos, battle pets, criaturas domáveis, montarias, Journal, profissões, transmog, housing, conquistas, reinos e mídia oficial. A aplicação usa Next.js App Router, React e TypeScript, como base para um futuro calculador de builds. A API autentica com a Blizzard no servidor; os detalhes carregam sob demanda e os catálogos têm busca e paginação.

## Tecnologias utilizadas

- Next.js App Router, React e TypeScript.
- CSS para manter o visual existente e as árvores de talentos.
- API da Blizzard autenticada exclusivamente no servidor.
- Contrato de builds preparado para persistência Turso e login Google futuros.

## Funcionalidades

- **Exploração por Famílias**: Visualize pets agrupados por suas famílias (Aquático, Besta, Voador, etc.)
- **Exploração por Categorias**: Navegue por pets organizados por categorias (Crustáceos, Insetos, etc.)
- **Detalhes Completos**: Acesse informações detalhadas sobre cada pet:
  - Nome, família e descrição
  - Fonte de obtenção
  - Status de negociabilidade e capturabilidade
  - Habilidades e níveis de desbloqueio
  - Imagens de alta qualidade
  - Informações de facção
- **Suporte a Múltiplos Idiomas**: Interface disponível em português e inglês
- **Armazenamento em Cache**: Otimização de performance através de cache local dos dados da API

## Como executar

1. Use Node.js 24 e execute `npm ci`.
2. Configure `BLIZZARD_CLIENT_ID` e `BLIZZARD_CLIENT_SECRET` no `.env.local` (ignorado pelo Git). As credenciais não usam prefixo `NEXT_PUBLIC_`.
3. Execute `npm run dev` e abra http://127.0.0.1:3000/.

A prévia em http://localhost/wow/ usa `npm run build:local` e `npm run start:local`, na porta 8788. O serviço de usuário `wow-local.service` já executa essa prévia nesta máquina. Depois de alterações, execute `npm run build:local` e `systemctl --user restart wow-local.service`. A compilação local fica em `.next-local`, separada da produção/Vercel. Para editar com atualização automática, use o servidor de desenvolvimento na porta 3000; ele não depende de WebSocket através do Apache.

Produção: `npm run build` seguido de `npm start`. Vercel está configurada para Next.js e não precisa do prefixo `/wow`. Os URLs antigos `.html` continuam funcionando.

Validação: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`. Com o servidor ativo, `npm run verify:http -- http://localhost/wow` verifica as rotas e a API real.

Catálogos ficam em `public/data/`, com detalhes sob demanda. Para renová-los após um patch, use `npm run catalogue:update`, `npm run mounts:update`, `npm run media:update` e `npm run icons:update`.

A arquitetura, a camada temporária de compatibilidade e o plano do calculador estão em [docs/architecture.md](docs/architecture.md). Turso e Google Auth ainda não estão ativados.

## Requisitos

- Navegador web moderno com suporte a JavaScript ES6+
- Conexão com a internet para consumo das APIs
- Credenciais de acesso à API da Blizzard (Client ID e Client Secret)

## Limitações Conhecidas

- A API da Blizzard possui limite de requisições, o que pode afetar o carregamento de dados em uso intensivo
- Algumas informações exibidas em sites como warcraftpets.com não estão disponíveis diretamente na API oficial
- Detalhes como mobilidade, animação, som e interatividade não são fornecidos pela API

## Desenvolvimento Futuro

- Implementação de um sistema de busca
- Adição de mais filtros de visualização
- Integração com a API de perfil para mostrar os pets que o jogador já possui
- Suporte a mais idiomas

## Licença

Este projeto é fornecido para fins educacionais e de pesquisa. World of Warcraft e todos os elementos relacionados são propriedade da Blizzard Entertainment.

## Créditos

- Dados e imagens fornecidos pela API oficial da Blizzard Entertainment
- Inspiração de design baseada em warcraftpets.com e wowhead.com
## Exploração conectada

Os cartões de classe levam a `explore.html?class=ID`. A página conecta raças, especializações, talentos e montarias de classe. Hunters têm uma área de famílias e criaturas domáveis, distinta do catálogo de battle pets. As buscas são paginadas; detalhes e renders carregam sob demanda.

Use `npm run mounts:update` para renovar `public/data/mounts.json` e `public/data/class-mounts.json` após patches. O plano de expansão está em [docs/action-plan.md](docs/action-plan.md); as fontes das imagens estão em [assets/SOURCES.md](assets/SOURCES.md).

O catálogo completo fica em `explore.html?mounts=1`, com filtros e paginação. O Journal começa em `explore.html?journal=1` e liga expansões, masmorras/raides, encontros e seus itens. A página de item preserva o retorno ao encontro que o originou.

As especializações apresentam árvores de talentos interativas, com painéis simultâneos para classe, especialização e uma árvore heroica elegível. Selecionar um talento mostra habilidades, graus e conexões, com ícones oficiais, zoom, filtro por árvore e modo lista. A visualização é de consulta; não distribui pontos nem exporta builds.

Profissões começam em `explore.html?professions=1` e conectam linhas de habilidade, categorias, receitas, materiais e itens produzidos. As receitas têm busca e paginação; variantes Aliança/Horda ficam separadas e o retorno do item preserva a origem na receita.

Conjuntos de transmog ficam em `explore.html?transmog=1`, com busca e paginação. Cada conjunto abre suas aparências e os itens correspondentes. Itens do Journal e das receitas também ligam às suas aparências, mantendo links de retorno à origem. A mídia é a fornecida pela API; não há simulação 3D nem leitura das coleções pessoais do jogador.

Housing começa em `explore.html?housing=decor`. Os catálogos de decoração, estruturas, pontos de encaixe e ambientes têm busca e paginação. Decoração liga ao item correspondente; estruturas ligam aos seus pontos de encaixe. Os dados são do catálogo público, sem editor 3D nem consulta de casas pessoais.

Conquistas começam em `explore.html?achievements=1`, com categorias, busca e paginação. Os detalhes ligam critérios, conquistas anteriores/seguintes e itens de recompensa. Os critérios são requisitos do catálogo, sem indicação de progresso pessoal.

Reinos começam em `explore.html?realms=1`; regiões em `explore.html?regions=1`. Os dados dinâmicos são consultados no host oficial da região selecionada (US/EU/KR/TW). Reinos ligam aos seus grupos conectados e aos estados informados pela API; a interface oferece nova consulta sem prometer estado instantâneo.

A galeria oficial começa em `explore.html?media=all`, com vídeos, quadrinhos, contos, livros e áudio. Os metadados ficam em `public/data/media.json`, os conteúdos abrem no site oficial e as imagens carregam sob demanda. Para renovar o catálogo, execute `npm run media:update` com Python 3 instalado localmente.

Talentos, habilidades raciais/PvP e links de itens oferecem janelas flutuantes ao passar o mouse ou dar foco pelo teclado. Em telas de toque, segure o controle para consultar. Descrições de talentos usam os dados já carregados; itens são consultados sob demanda e reutilizam o cache da sessão. O catálogo `public/data/spell-icons.json` evita uma consulta de mídia por nó; renove com `npm run icons:update` após patches.

## Mapas de instâncias

O Covil de Gruul já tem mapa local, zoom, rolagem/arraste, marcadores selecionáveis e links entre encontros. A planta usa texturas originais do jogo; os marcadores usam posições normalizadas de `JournalEncounter` do cliente, importadas de Wago.tools. Esses dados complementam a API web da Blizzard.

Para atualizar: instale `scripts/requirements-maps.txt` no ambiente Python e execute `npm run maps:update`. O importador aceita `--instance ID` e `--build VERSÃO`; salva somente imagens convertidas e um catálogo compacto em `public/`. Os nomes localizados existentes são preservados. O build do Next não depende de Wago nem de Python, pois usa o snapshot já importado.

## Consultas públicas adicionais

O menu **Mais / More** e a página inicial oferecem missões, reputações, brinquedos, leilões, rankings e perfis públicos. Leilões usam busca por nome e seleção do item; a consulta de ofertas pode levar alguns segundos para filtrar o snapshot da Blizzard; commodities usam mercado regional e equipamentos usam reino conectado. Rankings incluem PvP, Míticas+ e Hall da Fama histórico. Perfis não exigem login e não acessam dados privados da conta. Veja [docs/action-plan.md](docs/action-plan.md) para limites e a próxima etapa: talent calculator.
