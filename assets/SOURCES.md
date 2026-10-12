# Fontes dos assets

## Logo

`wow-midnight.webp`: logo oficial de World of Warcraft: Midnight, obtido da página oficial https://worldofwarcraft.blizzard.com/en-us/ em 12/10/2026.

Origem: https://blz-contentstack-images.akamaized.net/v3/assets/blt9c12f249ac15c7ec/blt72d80cd6c38f4fb6/6a9224dc9b942e1a81f741e5/midnight-logo-homepage.png

Conversão WebP e redução proporcional para carregamento. O logo é da expansão Midnight, não um logo genérico criado para o explorador. World of Warcraft e seus assets pertencem à Blizzard; a página é identificada como projeto independente de fãs.

## Mídia do catálogo

Ícones de classes, especializações, famílias e renders de criaturas/montarias vêm dos links retornados pela Blizzard Game Data API. São carregados dos hosts oficiais, conforme fornecidos pela API.

Documentação: https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis

## Galeria oficial

`data/media.json` contém títulos, tipos e referências públicas da galeria oficial em https://worldofwarcraft.blizzard.com/en-us/media e https://worldofwarcraft.blizzard.com/pt-br/media. Os conteúdos são abertos em suas páginas oficiais e as miniaturas são carregadas dos CDNs da Blizzard. Este catálogo é separado da Game Data API. Atualização: `npm run media:update`.
