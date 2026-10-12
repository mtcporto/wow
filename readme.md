# WoW Pet Explorer

## Descrição

WoW Pet Explorer é uma aplicação web que permite explorar e visualizar informações detalhadas sobre os mascotes (pets) do jogo World of Warcraft. A aplicação consome a API oficial da Blizzard para fornecer dados atualizados sobre todos os mascotes disponíveis no jogo.

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