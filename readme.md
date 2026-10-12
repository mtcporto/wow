# Azeroth Explorer

## Descrição

Azeroth Explorer é um catálogo conectado de World of Warcraft: classes, raças, especializações, talentos, battle pets, criaturas domáveis, montarias, Journal, profissões, transmog, housing, conquistas, reinos e mídia oficial. O frontend continua em HTML, CSS e JavaScript. A API Node autentica com a Blizzard no servidor; os detalhes carregam sob demanda e os catálogos têm busca e paginação.

## Tecnologias Utilizadas

- **HTML5**: Estrutura base da aplicação
- **CSS3**: Estilização e responsividade
- **JavaScript (ES6+)**: Lógica da aplicação e interatividade
- **Fetch API**: Comunicação com as APIs da Blizzard
- **OAuth 2.0**: Autenticação para acesso às APIs da Blizzard
- **LocalStorage/SessionStorage**: Armazenamento de cache para otimização de performance

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

## Como Executar

1. Configure `BLIZZARD_CLIENT_ID` e `BLIZZARD_CLIENT_SECRET` no arquivo `.env.local` (ignorado pelo Git).
2. Execute `npm run dev` com Node.js 24.
3. Abra http://127.0.0.1:8788/ para classes ou http://127.0.0.1:8788/pets.html para mascotes.

As páginas continuam em HTML, CSS e JavaScript, sem etapa de build. A API Node autentica com a Blizzard no servidor. As cópias em `localhost/wow/` também precisam desse servidor na porta 8788.

A navegação entre classes e mascotes funciona nos dois idiomas. Os demais recursos estão identificados como futuros. O catálogo de mascotes abre com `data/pets.json` (famílias e ícones) e uma consulta ao índice da Blizzard para os nomes no idioma escolhido. Detalhes e imagens maiores são consultados apenas ao abrir um mascote. Para atualizar o catálogo depois de um patch, execute `npm run catalogue:update`; essa operação consulta todos os mascotes uma vez e substitui o arquivo apenas quando termina com sucesso. Inclua o arquivo atualizado no próximo deploy.

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

Use `npm run mounts:update` para renovar `data/mounts.json` e `data/class-mounts.json` após patches. O plano de expansão está em [docs/action-plan.md](docs/action-plan.md); as fontes das imagens estão em [assets/SOURCES.md](assets/SOURCES.md).

O catálogo completo fica em `explore.html?mounts=1`, com filtros e paginação. O Journal começa em `explore.html?journal=1` e liga expansões, masmorras/raides, encontros e seus itens. A página de item preserva o retorno ao encontro que o originou.

As especializações apresentam árvores de talentos interativas, com abas para classe, especialização e árvores heroicas elegíveis. Selecionar um talento mostra habilidades, graus e conexões, com zoom e modo lista. A visualização é de consulta; não distribui pontos nem exporta builds.

Profissões começam em `explore.html?professions=1` e conectam linhas de habilidade, categorias, receitas, materiais e itens produzidos. As receitas têm busca e paginação; variantes Aliança/Horda ficam separadas e o retorno do item preserva a origem na receita.

Conjuntos de transmog ficam em `explore.html?transmog=1`, com busca e paginação. Cada conjunto abre suas aparências e os itens correspondentes. Itens do Journal e das receitas também ligam às suas aparências, mantendo links de retorno à origem. A mídia é a fornecida pela API; não há simulação 3D nem leitura das coleções pessoais do jogador.

Housing começa em `explore.html?housing=decor`. Os catálogos de decoração, estruturas, pontos de encaixe e ambientes têm busca e paginação. Decoração liga ao item correspondente; estruturas ligam aos seus pontos de encaixe. Os dados são do catálogo público, sem editor 3D nem consulta de casas pessoais.

Conquistas começam em `explore.html?achievements=1`, com categorias, busca e paginação. Os detalhes ligam critérios, conquistas anteriores/seguintes e itens de recompensa. Os critérios são requisitos do catálogo, sem indicação de progresso pessoal.

Reinos começam em `explore.html?realms=1`; regiões em `explore.html?regions=1`. Os dados dinâmicos são consultados no host oficial da região selecionada (US/EU/KR/TW). Reinos ligam aos seus grupos conectados e aos estados informados pela API; a interface oferece nova consulta sem prometer estado instantâneo.

A galeria oficial começa em `explore.html?media=all`, com vídeos, quadrinhos, contos, livros e áudio. Os metadados ficam em `data/media.json`, os conteúdos abrem no site oficial e as imagens carregam sob demanda. Para renovar o catálogo, execute `npm run media:update` com Python 3 instalado localmente.
