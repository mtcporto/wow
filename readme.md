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

1. Clone este repositório para sua máquina local
2. Configure suas credenciais da API da Blizzard no arquivo `config.js`
3. Abra o arquivo pets.html em um navegador moderno

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