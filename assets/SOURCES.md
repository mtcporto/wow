# Fontes dos assets

## Logo

`wow-midnight.webp`: logo oficial de World of Warcraft: Midnight, obtido da página oficial https://worldofwarcraft.blizzard.com/en-us/ em 12/10/2026.

Origem: https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt72d80cd6c38f4fb6/6a9224dc9b942e1a81f741e5/midnight-logo-homepage.png

Conversão WebP e redução proporcional para carregamento. O logo é da expansão Midnight, não um logo genérico criado para o explorador. World of Warcraft e seus assets pertencem à Blizzard; a página é identificada como projeto independente de fãs.

## Mídia do catálogo

Ícones de classes, especializações, famílias e renders de criaturas/montarias vêm dos links retornados pela Blizzard Game Data API. São carregados dos hosts oficiais, conforme fornecidos pela API.

Documentação: https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis

## Galeria oficial

`public/data/media.json` contém títulos, tipos e referências públicas da galeria oficial em https://worldofwarcraft.blizzard.com/en-us/media e https://worldofwarcraft.blizzard.com/pt-br/media. Os conteúdos são abertos em suas páginas oficiais e as miniaturas são carregadas dos CDNs da Blizzard. Este catálogo é separado da Game Data API. Atualização: `npm run media:update`.

## Ícones de talentos e habilidades

`public/data/spell-icons.json` reúne links de ícones retornados por `/data/wow/media/spell/{id}` para as habilidades presentes nas árvores das especializações. As imagens são carregadas do host oficial `render.worldofwarcraft.com`. Renovação: `npm run icons:update`. A composição dos painéis e tooltips é HTML/CSS próprio, inspirado na interface do jogo; não utiliza código nem imagens do Wowhead.

## Descrições de encontros

Descrições e habilidades exibidas vêm da API da Blizzard. Não são preenchidas com resumos editoriais ou fontes de terceiros. Quando o Journal não fornece uma descrição, ela fica ausente até existir uma fonte verificável da Blizzard.

## Mapas do cliente

`public/assets/maps/uimap-330.webp` é a planta original do Covil de Gruul, montada e convertida a WebP a partir de 12 texturas Blizzard BLP. Os FileDataIDs, dimensões, UiMapArtID e coordenadas dos encontros estão registrados em `public/data/instance-maps.json`.

Fontes: https://wago.tools/db2/JournalEncounter/csv, https://wago.tools/db2/UiMap/csv, https://wago.tools/db2/UiMapXMapArt/csv, https://wago.tools/db2/UiMapArt/csv, https://wago.tools/db2/UiMapArtStyleLayer/csv e https://wago.tools/db2/UiMapArtTile/csv; texturas em `https://wago.tools/api/casc/{FileDataID}`. O mapa pertence à Blizzard. Não usa imagens ou posições copiadas do Wowhead.

O mapa físico de ID 565 retornado pela API web e o UiMapID 330 do cliente são identificadores distintos. O importador relaciona encontros pelo JournalInstanceID 746, sem supor que esses IDs de mapas sejam iguais.
