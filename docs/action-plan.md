# Plano do Azeroth Explorer

## Primeira etapa implementada localmente

- Classes como ponto de entrada: cada cartão abre uma página de classe.
- Classe → raças disponíveis → facção e habilidades raciais.
- Classe → especializações → função, recurso e atributo principal.
- Especialização → talentos da classe, da especialização, heroicos elegíveis e PvP.
- Talentos com escolhas e referências por nome; agora apresentados também em árvore visual interativa.
- Classe → montarias com restrição explícita de classe. Catálogo gerado com 51 entradas; detalhes, nomes traduzidos e aparência carregam ao abrir a montaria.
- Hunter → famílias → criaturas domáveis; busca paginada, com mídia sob demanda.
- Battle pets continuam independentes de criaturas domáveis de hunters.
- Logo oficial de Midnight no catálogo e ícones/mídia oficiais da API nas páginas de detalhe.

## Segunda etapa implementada localmente

- Catálogo completo de 1.676 montarias, com busca por nome, facção, origem e restrição de classe; paginação de 24 itens.
- Nomes localizados pelo índice da API; filtro sem acentos; valores ausentes identificados como não informados.
- Montaria → requisitos de classe → página da classe, com mídia carregada sob demanda.
- Journal: expansão → masmorra/raide → encontro → criaturas, habilidades e itens.
- Item → atributos e mídia, com retorno ao encontro de origem.
- Navegação global e painel inicial atualizados para Montarias, Journal, Masmorras e Raides.

## Terceira etapa implementada localmente

- Árvores de classe, especialização e talentos heroicos elegíveis em painéis simultâneos, com seletor da árvore heroica.
- Posições e conexões de nós conforme a API, sem inventar ligações entre árvores.
- Seleção de talento destaca suas conexões e abre habilidades, graus e relações por nome.
- Zoom, área de rolagem, modo lista e filtro por árvore, nomes opcionais e navegação por teclado.
- Modo de consulta: ainda não aloca pontos nem valida/exporta builds.

## Quarta etapa implementada localmente

- Profissões do personagem e demais sistemas de criação listados pela API.
- Profissão → linhas de habilidade → categorias e receitas, com busca e paginação.
- Receita → itens produzidos e reagentes, preservando variantes de facção.
- Item → retorno à receita, que preserva o retorno à linha de habilidade.
- Ícones de profissão, receita e item carregados sob demanda.
- Reagentes opcionais reconhecidos, mas seus detalhes e a simulação de qualidade de crafting ficam para outra etapa.

## Quinta etapa implementada localmente

- Catálogo de conjuntos de aparências, com busca e paginação.
- Conjunto → aparências/peças → itens que compartilham aquela aparência.
- Item do Journal ou de receita → aparência → retorno ao item de origem.
- Atributos e requisitos continuam na página de item; origem na receita/encontro/conjunto é preservada.
- Mídia oficial dos itens usada como ícone; não há simulação 3D de personagem nem validação de desbloqueio de conta.
- Detalhes das peças carregados somente no conjunto aberto, com até quatro consultas concorrentes; ícones carregam ao entrar na área visível.

## Sexta etapa implementada localmente

- Catálogos de decoração, estruturas, pontos de encaixe e ambientes, com busca e paginação.
- Decoração → item associado → retorno à decoração.
- Decoração com espaços de cor informados pela API.
- Estrutura → pontos de encaixe → estrutura associada, com navegação de volta.
- Ambientes e seus nomes conforme a API. Não há editor 3D, planta de casa ou leitura da casa de um jogador.
- Painel inicial e navegação atualizados.

## Sétima etapa implementada localmente

- Categorias principais, todas as categorias, categorias de guilda e catálogo completo de conquistas.
- Busca e paginação sem consultar os detalhes de cada conquista na abertura.
- Categoria → subcategorias/conquistas → critérios e suas relações com outras conquistas.
- Critérios hierárquicos preservam operadores (todos, pelo menos, etc.), quantidades e facção quando informadas.
- Conquista → anterior/próxima → item de recompensa → retorno à conquista.
- Dados públicos do catálogo, sem leitura de progresso ou conclusão pessoal.

## Oitava etapa implementada localmente

- Regiões US, EU, KR e TW, com informações consultadas em seus hosts oficiais.
- Reinos por região, com busca e paginação; detalhe informa idioma, categoria, tipo e fuso quando disponíveis.
- Reino → grupo conectado → seus reinos, com estado, população e fila informados pela API.
- Namespace dinâmico selecionado no servidor; região limitada a uma lista explícita de hosts.
- Dados dinâmicos têm cache CDN de um minuto e botão de nova consulta; não são apresentados como monitoramento instantâneo.
- Painel inicial e navegação atualizados; não há consulta a personagens ou dados privados.

## Nona etapa implementada localmente

- Galeria com metadados públicos de 147 conteúdos da página oficial da Blizzard.
- Vídeos/cinematics, quadrinhos, contos, livros e áudio, com títulos em inglês e português.
- Busca, filtro por tipo, paginação e miniaturas carregadas sob demanda.
- Cada conteúdo abre em sua página oficial; sem re-hospedar vídeos ou inventar feeds de wallpapers/screenshots.
- Os botões antigos de mídia foram substituídos pelos catálogos que a galeria oficial oferece atualmente.
- `npm run media:update` renova os metadados (requer Python 3 localmente; a aplicação não depende de Python).

## Próximas etapas

1. Talentos: comparação, validação de regras de pontos e códigos de exportação antes de oferecer uma calculadora.
2. Aprofundar reagentes opcionais de crafting e os requisitos de transmog.
3. Aprofundar housing quando houver dados suficientes para novas relações.
4. Perfil opcional Battle.net para comparar os catálogos com as coleções do jogador.

## Critérios

- Uma relação precisa ser confirmada pela API ou identificada como curadoria.
- IDs identificam entidades; nomes e descrições são localizados.
- Não interpretar campo ausente como prova de acesso irrestrito.
- Catálogos mínimos, detalhes sob demanda, buscas paginadas.
- Sem credenciais no browser; o proxy permite apenas recursos e filtros explícitos.
- Roteiros de captura, requisitos exóticos e localização de criaturas ficam fora da promessa até haver fontes confiáveis.

## Atualização dos catálogos

- `npm run catalogue:update`: famílias e ícones de battle pets.
- `npm run mounts:update`: catálogo completo de montarias e subconjunto com restrição de classe.
- Os scripts fazem a coleta uma vez; os arquivos só são substituídos quando a coleta completa termina. Incluir os JSONs atualizados no deploy.

## Interface de talentos e informações flutuantes

- Nós compactos com ícones oficiais e formas de habilidade ativa, passiva e escolha.
- Tooltips com descrições, graus, custo, alcance e recarga conforme fornecidos pela API.
- Itens, habilidades raciais e PvP também têm consulta flutuante; cliques mantêm a navegação/detalhes.
- Nós heroicos duplicados pelo retorno da API são removidos do painel da especialização.
- Catálogo de ícones renovável; sem consultas de mídia individuais por talento ao abrir a árvore.

## Mudança de direção: calculador de talentos

A base agora é Next.js, React e TypeScript. A árvore atual permanece de consulta; alocação de pontos, validação, exportação, Google Auth e Turso são próximas entregas. A fronteira de compatibilidade e a ordem de implementação estão em [architecture.md](architecture.md).

## Recursos públicos integrados — outubro de 2026

- Missões: áreas, categorias e tipos; detalhes, requisitos e recompensas; links para itens e reputações.
- Reputações: facções, relações e faixas de reputação (incluindo a faixa de ID 0).
- Brinquedos: catálogo e item de coleção, com ícone e informações flutuantes.
- Leilões: mercadorias regionais ou reino conectado, sempre por ID de item; preços em moedas, quantidades e paginação. O servidor lê o snapshot em streaming e mantém até 20 mil ofertas mais baratas por item; o total continua indicando todas as ofertas. Cache de 60 segundos, sem promessa de atualização em tempo real.
- Rankings: temporadas e modalidades PvP, Míticas+ por reino/masmorra/semana e Hall da Fama por raide/facção. Links dos participantes para perfis públicos.
- Personagens: consulta pública por região, reino e nome; equipamento, especializações, reputações, missões concluídas, montarias e mascotes. Dados ausentes ou perfis não disponíveis são informados, sem inferir coleções completas. Autenticação pessoal Battle.net não foi implementada; Google Auth futuro não concede acesso a contas Battle.net.

**Lembrete solicitado: retomar o talent calculator após este bloco.** A próxima entrega deve permitir distribuir/remover pontos, validar pré-requisitos e limites das três árvores, selecionar talentos de escolha e salvar/exportar uma build. Google Auth e Turso continuam posteriores à base funcional.

### Brinquedos como itens

O catálogo usa o item real de cada brinquedo (ID de coleção é distinto do ID do item), ícones oficiais e cores de qualidade. Os filtros são fonte de obtenção e qualidade. As 12 fontes vêm do campo `source` da Blizzard; não são categorias inventadas. Um snapshot localizado evita consultas de detalhe/mídia por linha ao abrir a página; os tooltips consultam o item sob demanda. `npm run toys:update` renova o catálogo completo e só substitui o arquivo após uma coleta bem-sucedida.

### Busca de leilões por nome

A entrada da Auction House usa nome localizado, seguida da seleção do item por ícone/nome/tipo. O ID existe apenas na URL e na chamada interna. O proxy permite Item Search com nome validado, limite de 12 resultados por página e campo localizado; palavras são combinadas em filtros do mesmo campo para evitar correspondências apenas com uma parte do nome. A seleção preserva região, mercado e reino e só então consulta as ofertas. Pesquisa de catálogo não implica disponibilidade no mercado escolhido.

### Leitura e apresentação de ofertas

A tabela omite IDs de leilões. Tempo restante é opcional (desativado inicialmente), com rótulos localizados; lances aparecem apenas no mercado de reino. Snapshots de até 32 MiB usam parsing nativo para reduzir tempo de processamento; arquivos maiores mantêm a leitura incremental. Os dois caminhos têm teste de equivalência com chunks pequenos. O cache de consulta por item continua em 60 segundos; a primeira consulta ainda depende do download da Blizzard.

### Enquadramento dos personagens

O render `main-raw` contém margens transparentes que deixavam o personagem pequeno. Uma rota de imagem recorta essas margens automaticamente, preserva a silhueta completa e mantém uma margem de segurança, sem depender da raça ou de zoom fixo. Aceita apenas renders PNG de personagens no host oficial da Blizzard, com limites de download/dimensões e cache de cinco minutos. Se a versão enquadrada falhar, a interface usa o original.
