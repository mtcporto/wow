# Pesquisa da API Blizzard — 12/10/2026

Pesquisa de leitura, sem alteração de credenciais ou da aplicação. Foram consultados os conteúdos oficiais do portal e realizadas chamadas autenticadas de Game Data, na região US, namespace `static-us`. As respostas identificaram `static-12.1.0_68914-us`. Isso é um registro do ambiente consultado, não uma regra para fixar a versão no código.

Fontes oficiais:
- https://community.developer.battle.net/documentation/world-of-warcraft/game-data-apis
- https://community.developer.battle.net/documentation/world-of-warcraft/profile-apis
- Conteúdo JSON público dessas páginas: `/api/pages/content/documentation/world-of-warcraft/{game-data-apis,profile-apis}.json`.

Resultados resumidos das consultas: `api-probes.json`. Nenhuma credencial ou token foi incluído.

## Relações confirmadas em respostas reais

| Origem | Relação | Campos ou recursos |
|---|---|---|
| Classe | Especializações e raças disponíveis | `specializations`, `playable_races` |
| Raça | Facção, classes disponíveis e habilidades raciais | `faction`, `playable_classes`, `racial_spells` |
| Especialização | Classe, função, recurso, atributo principal | `playable_class`, `role`, `power_type`, `primary_stat_type` |
| Especialização | Árvores e talentos PvP | `spec_talent_tree`, `hero_talent_trees`, `pvp_talents` |
| Árvore de talentos | Nós, escolhas e dependências | `class_talent_nodes`, `spec_talent_nodes`, `hero_talent_trees`; nós com `locked_by`, `unlocks`, posições e ranks |
| Montaria | Classe ou facção exigida | `requirements.classes`, `requirements.faction`, `faction` |
| Battle pet | Tipo de batalha, habilidades e criatura visual | `battle_pet_type`, `abilities`, `creature`, `media` |
| Criatura | Família, tipo e domabilidade | `family`, `type`, `is_tameable`, `creature_displays` |
| Família de criatura | Especialização do pet | `specialization`, `media` |
| Expansão / instância / encontro | Navegação do Journal | Instância traz `expansion`, `encounters`, `modes`, `category`; encontro traz `instance`, `creatures`, `items` |
| Item | Atributos, requisitos e aparência | `required_level`, `item_class`, `item_subclass`, `preview_item`, `appearances` |
| Decoração | Item e cores | `items`, `dye_slots` |

Exemplos verificáveis:
- Hunter: classe 3 → Beast Mastery: especialização 253 → árvore 774/253.
- Montaria 221 (Acherus Deathcharger): `requirements.classes` contém Death Knight (6).
- Montaria 6 (Brown Horse): restrição de Alliance.
- Criatura 42002 (Wolf): `is_tameable=true`, família Wolf (1).
- Família Wolf (1) → Ferocity (especialização 74). O retorno de Ferocity informa `playable_class.id=0`; não é uma especialização jogável de Hunter.
- Battle pet 39 (Mechanical Squirrel) → criatura 2671, cujo `is_tameable=false`.
- Encontro 477 (Kresh) → Wailing Caverns (instância 240) → item 13245.
- Decoração 80 → item 235994.

## Distinções de domínio

Separar `battle-pet` de `hunter-pet` e de `creature`. O catálogo `/pet` é de battle pets; a família de batalha (Mechanical, Beast etc.) não é a família de criatura (Wolf etc.). `is_capturable` de battle pet não equivale a `is_tameable` de criatura.

A documentação oferece `/profile/wow/character/{realmSlug}/{characterName}/hunter-pets`, explicitamente restrito a personagens hunters (404 para outras classes). Esse endpoint é o plantel de um personagem, não um catálogo global. Não foi testado com personagem nesta pesquisa.

Battle pets têm níveis próprios e podem ter flags de facção. Não modelar que todos os pets são acessíveis sem requisitos; requisitos de treinamento, coleção, conta e conteúdo precisam de verificação específica. A amostra de criatura domável não informou coordenadas, nível de domabilidade ou restrição de Beast Mastery. Esses dados exigem pesquisa complementar/curadoria.

Montarias não pertencem necessariamente a uma classe. Modelar relação opcional de restrição, preservando também facção, fonte e possíveis outros requisitos. Ausência de campo não prova ausência de restrição.

## Busca, paginação e limitações observadas

- `/search/creature?is_tameable=true&family.id=1&_pageSize=3`: retornou criaturas domáveis da família Wolf. Permite uma página de hunters com busca sob demanda, sem carregar todas as criaturas.
- `/search/mount?faction.type=ALLIANCE&_pageSize=3`: retornou montarias Alliance.
- `/search/mount?requirements.classes.id=6&_pageSize=3`: HTTP 200, zero resultados, apesar da montaria 221 ter essa restrição no recurso de detalhe. A busca por ID 221 omitiu `requirements` no documento indexado. Não depender desse filtro sem validação adicional; construir índice próprio de restrições.
- Links individuais `/talent-tree/774/hero-talent/43` e `/44` retornaram 404. A árvore principal 774/253 retornou nós de talentos heroicos embutidos. Preferir o conteúdo da árvore, validando elegibilidade contra os IDs informados pela especialização; não apresentar todo bloco como aplicável a uma especialização.
- Alguns IDs não existem (creature/1, quest/2606). Descobrir recursos por índices e links, não inferir IDs.
- Categorias atuais de pets no projeto usam palavras no nome, não uma taxonomia oficial. Não reutilizar essa heurística como prova de relação entre entidades.

## Outros recursos documentados atualmente

Além dos botões antigos: Housing Decor (decor, fixture, fixture-hook, room), Neighborhood, Character House, Toy, Item Appearance e coleções de transmog. Decor 80 e índice de decor responderam HTTP 200. Casas, bairros e coleções pessoais foram identificados na documentação; ainda precisam de provas com exemplos apropriados.

Profissões têm `skill_tiers`; a documentação também oferece receitas. Possível caminho: profissão → expansão/tier → receita → resultado, sujeito à confirmação dos campos de cada receita.

A documentação separa coleções de personagem e coleções de conta. Os endpoints `/profile/user/wow/...` exigem OAuth de usuário com escopo `wow.profile`. Isso seria uma fase opcional de conexão Battle.net, sem confundir o login do jogador com a credencial técnica usada pelo catálogo.

## Proposta de evolução

1. Classe como página central: raças, função, especializações, talentos e montarias restritas.
2. Hunter como experiência específica: famílias de criaturas, busca de domáveis e especializações de pets.
3. Coleções independentes: battle pets, montarias, brinquedos e transmog.
4. Journal conectado: expansão → masmorra/raide → encontro → criatura e item.
5. Profissões e housing após validar os campos e relações necessários.
6. Perfil opcional de personagem/conta para comparar o catálogo com o que o jogador possui.

Usar IDs e referências como base das relações; armazenar nomes localizados separadamente. Manter catálogos leves e versionados, consultas de detalhes e buscas paginadas sob demanda. Identificar a origem das relações: API confirmada, curadoria, ou informação desconhecida. O proxy atual aceita apenas alguns recursos; novas páginas exigirão ampliar sua lista permitida de forma explícita, sem habilitar URLs arbitrárias.
