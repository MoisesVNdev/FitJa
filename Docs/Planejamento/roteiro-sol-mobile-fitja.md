# Fit Já | Roteiro de implementação para Sol em esforço médio

Revisão de 22/11/2026 sobre o commit `4c5eeee`. A loja pública deve ser desenhada exclusivamente para a jornada no celular. Em uma tela larga, ela pode manter a coluna de leitura centralizada. O painel da Laís tem outro contexto: notebook, teclado, tabelas de pedidos, edição de catálogo e prévia do celular.

## Como entregar por partes

Selecione Sol com esforço médio. Comece por 01. Cada etapa abaixo é uma tarefa revisável com responsável sugerido, pontos de entrada e aceite. Nas etapas com várias regras comerciais, cada linha da tabela pode ser entregue separadamente. Antes de uma mudança visual, capture a versão anterior no mesmo navegador, viewport e catálogo que serão usados na comparação.

**Prompt para colar no Codex**

> Trabalhe em G:\Work\LaisFitJa. Leia AGENTS.md e Docs/Planejamento/roteiro-sol-mobile-fitja.md. Execute somente a etapa 01 deste roteiro, incluindo o aceite. Confira o estado do Git e crie uma branch temática a partir da última entrega aprovada, levando este roteiro junto. Para telas, siga o guia de identidade Fit Já e aplique a skill local web-design-guidelines. Implemente pela rota normal do produto. Preserve dados já salvos. Use dados fictícios em testes. Rode npm.cmd test e npm.cmd run build após mudanças de código. Confira a interface no navegador e guarde as evidências da etapa. Faça o commit local. Informe branch, hash, resultado do aceite e pendências para revisão.

Troque 01 pelo número desejado nas próximas tarefas. Faça as mudanças da loja em 01–04. A etapa 05 pode avançar assim que existir a primeira vitrine para conferir na prévia. As etapas 06 e 07 precisam de regras ou contratos compartilhados. Integre as branches após a revisão de cada entrega.

**Referências de trabalho:** [guia da marca](../Material%20de%20designer/identidade-visual-fit-ja.md), [respostas da Laís](../respostas-lais-fit-ja.md), [fluxos do produto](design-e-arquitetura-front-end-lais-fit-ja.md), [arquitetura e contratos](arquitetura-de-software-lais-fit-ja.md) e [capturas da base](../../artifacts/aceite-mobile-2026-11-22/).

## O que a revisão encontrou

| Evidência no projeto e no ensaio local anterior | Consequência | Etapa |
| --- | --- | --- |
| Na captura de 393 × 852 px, o visitante lê slogan, chamada, horário e outra chamada antes de alcançar nome e preço. A abertura é verde-clara e o botão é verde. | A loja demora a mostrar o que vende e o laranja aparece em áreas pequenas. | 01 |
| “Marmita” retornou zero resultados. Refeições exibia lasanha e escondidinho. Frango e carne estão arquivados em src/data.ts. Café em copo aparece no cardápio. | O catálogo inicial precisa incorporar as decisões posteriores da Laís. | 02 |
| O arquivo do suco na garrafa tem 149 × 149 px. O da coxinha com sufixo 640 tem 185 × 185 px. O detalhe oferece zoom. | A ampliação expõe o desfoque e rouba espaço dos sabores. | 03 |
| Duas coxinhas, 240 g no total, entraram por R$ 18. A sacola mostrou quantidade 1 para a porção. A falta de WhatsApp só apareceu depois da revisão. | O cálculo funciona, mas unidade e possibilidade de encaminhar precisam ficar claras antes. | 04 |
| Há painel sob demanda, prévia, pedidos, CSV e relatórios. Horários são texto, existem quatro estados de pedido e a restauração recupera o catálogo completo. | O painel pode evoluir em notebook agora. Operações independentes precisam de contratos próprios. | 05–07 |

## 01 | Primeira tela comprável e identidade — júnior com revisão visual

**Partida.** src/features/catalog/Menu.tsx, src/styles.css, src/shared/styles/useTheme.ts e regras de prévia em src/features/admin/admin.css. A cor primária já existe. O hook aplica o tema salvo sobre as variáveis globais.

1. Substituir a abertura institucional por um cabeçalho compacto com a arte original, nome e sacola identificável. Fazer o laranja **#EA5A1C** ocupar uma superfície contínua, com texto escuro **#28150D**. Usar branco e fundo claro para os produtos, verde da folha apenas em detalhes. Manter Nunito Sans e as escolhas de tema da proprietária.
2. Logo abaixo, exibir uma vitrine compacta com um **produto comprável**: miniatura, nome, composição ou porção, preço e botão “Escolher”. A primeira candidata da Laís é a coxinha de batata inglesa, frango e muçarela. Conferir o cadastro antes de exibir a composição. Esgotou o destaque? Usar o próximo escolhido e disponível. Sem destaque, iniciar a navegação diretamente.
3. Aproximar busca, categorias e lista. Retirar o botão intermediário “Encontre seu favorito” e as frases que repetem a função da loja. Deixar horário e contatos acessíveis em informações da loja. Remover os estilos obsoletos do hero e da simulação móvel no painel.

**Aceite.** Em 390 × 844 e 393 × 852, a captura a partir do topo deve mostrar marca, sacola, busca, categorias e pelo menos um produto com nome, preço e ação legíveis. Tocar nele abre a ficha correta. Cobrir o logo numa cópia da captura ainda deixa a assinatura laranja evidente. Conferir também com tema personalizado e sem destaque. Esta é a primeira entrega a mostrar à Laís.

## 02 | Marmitas, lanches, categorias e busca — júnior + revisão do conteúdo

**Partida.** src/data.ts, Menu.tsx e as respostas sobre marmitas, bolo, coxinha e café. Depende da estrutura de 01.

1. Comparar os cadastros item a item com o questionário. Preparar marmitas prontas com proteína, peso total, composição e preço por variante. Para a demonstração, usar os exemplos registrados. Conferir com a Laís o que será publicado. Preservar identificadores e catálogos já editados. Revisar café em copo, destaque da coxinha e ordem de grupos.
2. Abrir em **Marmitas prontas**. Tornar **Lanches**, **Doces** e **Todas as categorias** fáceis de achar. Usar estado programático de seleção. A busca sem acento deve percorrer o catálogo publicado, indicar a categoria do resultado, permitir filtro e recuperar o grupo anterior ao limpar.
3. Distinguir item esgotado, item arquivado e busca vazia. Deixar o esgotado visível na lista com rótulo. Ocultar o arquivado. Oferecer limpar a busca ou trocar de grupo quando não houver resultados.

**Aceite.** Em perfil de demonstração novo, encontrar a marmita de frango de 300 g do exemplo de R$ 16, abrir e adicionar. Em Lanches, buscar “frango”, identificar resultados de outros grupos e voltar a Lanches ao limpar. Em perfil com catálogo anterior salvo, conferir que o conteúdo publicado foi preservado.

## 03 | Cartões, fotografias e detalhe — júnior

**Partida.** src/features/catalog/ProductViews.tsx, src/styles.css, scripts/prepare-assets.mjs e src/features/admin/catalog/images.ts. Pode avançar após 01.

Montar cartão compacto com nome, miniatura proporcional, porção, preço e ação. Conferir dimensões reais antes de escolher o tamanho de exibição. Manter recortes pequenos como miniaturas e oferecer ampliação só quando existir detalhe adicional. Reservar espaço estável para a foto e tratar o produto sem foto com a mesma hierarquia textual. Pedir originais para fotos grandes. No detalhe, trazer composição, variantes, peso e preço para perto do título. “A partir de” deve corresponder a opção disponível. Mostrar nutrição apenas para porção e composição conferidas. Priorizar o botão de adicionar sem encobrir a última opção.

**Aceite.** Comparar o mesmo suco de 149 px antes/depois. Testar um item sem foto e outro com foto de maior definição. Mudar de uva a R$ 8 para tangerina a R$ 9, conferir preço do botão e da sacola. Voltar ao catálogo mantendo grupo, rolagem e foco.

## 04 | Sacola, revisão e WhatsApp — pleno

**Partida.** src/features/cart/CartDialog.tsx, src/features/checkout/useCheckout.ts, service.ts na mesma pasta e shared/contracts/checkout.ts. Usar 02 e 03 para o ensaio completo.

1. Tornar porção e quantidade inequívocas, por exemplo “1 porção de 2 coxinhas · 240 g”. Mostrar itens, escolhas, edição, remoção, entrega/retirada, observação e total. A sacola persistente deve respeitar a área segura da tela e o teclado.
2. Informar a falta de contato configurado antes da preparação. Manter breve a instrução sobre a avaliação pela Laís. Quando houver mudança de preço ou disponibilidade, indicar a linha afetada e preservar as escolhas válidas.
3. Revisar as releituras de catálogo em reviewSelection e createRequest. Evitar chamadas redundantes preservando a validação definitiva do servidor. Garantir que uma resposta atrasada após edição não habilite encaminhar seleção antiga.

**Aceite.** Adicionar marmita e porção dupla de coxinha, editar, remover e escolher entrega. Testar preço novo, esgotamento, erro de rede, contato ausente e dois toques rápidos. Com número fictício válido, inspecionar o link e o resumo. Retomar a seleção inalterada com a mesma referência. Testar dez montagens extensas e cópia integral. Encerrar o teste local antes do envio real.

## 05 | Área da proprietária em notebook — júnior na interface, pleno nas operações

**Partida.** src/features/admin/Admin.tsx, admin.css e subpastas catalog, store, orders e reports.

**A. Trabalho diário.** Em 1366 × 768, organizar navegação lateral, área central e ações de cada tela. Priorizar pedidos que precisam de resposta, disponibilidade, catálogo e publicação. Deixar referência, estado e ação legíveis nas tabelas. No editor, distinguir salvar rascunho, ver prévia e publicar. Posicionar erros junto ao campo e avisar sobre edição pendente ao sair.

**B. Aparência.** Usar a loja real em uma prévia móvel. Comparar prévia e rota pública: hoje o tema é aplicado ao documento e a simulação recebe regras especiais de CSS. Conferir fotos, vitrine, ordem, tipografia e cores com o rascunho diferente do publicado. A restauração independente da aparência depende da etapa 07.

**Aceite.** Em 1366 × 768 e 1280 × 720, localizar um pedido, duplicar um produto fictício, mudar seu preço e destaque, salvar rascunho, conferir prévia, publicar localmente e conferir outra aba. A visita pública deve continuar sem baixar os módulos e estilos administrativos.

## 06 | Regras comerciais compartilhadas — pleno, uma regra por entrega

**Partida.** shared/domain/index.ts, shared/contracts, editor de produtos, ficha e tests/domain.test.ts. Manter centavos inteiros e resultados iguais na interface e no servidor.

| Entrega | O que implementar | Aceite |
| --- | --- | --- |
| Preço por peso | Gravar preço/kg e porções permitidas. Mostrar tabela calculada antes de publicar. Levar arredondamento fracionário ao planejamento. | A R$ 50/kg, 100 g custam R$ 5 e 200 g custam R$ 10. |
| Faixas por quantidade | Agrupar avulsos iguais por sabor e tamanho mesmo se adicionados separadamente. Recalcular ao editar e indicar desconto. | Brigadeiros com 9/10/11 e coxinhas com 1/2/4/5/6. Testar sabores mistos e combo mais avulsos. Alertar Laís se adicionar unidade fizer o total cair. |
| Combos e personalizadas | Aproveitar kits fixos e grupos de escolha existentes. Obter um exemplo aprovado de combinação, limites e preço antes de implementar a montagem experimental. | Pausar somente personalizadas. Editar e duplicar montagem, identificar escolha obrigatória e separar subtotal pronto, subtotal estimado e total previsto. |

## 07 | Operações que dependem de dados — pleno com a conversa 03

Definir entradas, respostas, erros e compatibilidade em shared/contracts antes de integrar persistência. A conversa 02 implementa apresentação e demonstração. A 03 implementa o servidor.

| Operação | Entrega e prova |
| --- | --- |
| Horários | Substituir texto por dias, faixas e aviso excepcional. Usar hora local de Caruaru. Testar intervalo no mesmo dia, feriado, fechado e configuração vazia. Fora de horário, permitir encaminhar com aviso. |
| Operação rápida | Alterar disponibilidade por produto ou sabor e pausar montagens sem publicar rascunhos. Restaurar apenas aparência com prévia. Esgotar sabor, restaurar tema e conferir que ele segue esgotado. |
| Solicitações | Incluir “Em avaliação”, “Confira se a mensagem chegou” e forma de pagamento. Para atendimento parcial, preservar lista original, histórico e referência. Testar atualização simultânea e reuso da referência do site sem duplicar venda. |
| Visão geral e CSV | Exibir pedidos a responder, aceitos, concluídos por semana/mês, produtos e vendas por origem. Ticket médio sobre concluídos. Conferir com massa fictícia com cancelamento, venda direta, ajuste e combo. CSV respeita filtros. |
| Infraestrutura | Worker revalida preços e autoriza operações, D1 persiste, R2 separa originais privados e derivados públicos, Access protege o painel. Testar paridade do adaptador local e remoto, idempotência e conflito. Homologação, publicação, backup e recuperação pertencem às conversas 03/04. |

## 08 | Aceite integrado — pleno revisor

1. Usar `npm.cmd run dev` para a prévia local. Para aceitar o pacote, executar `npm.cmd test`, `npm.cmd run build` e `npm.cmd run preview`. Abrir a porta exibida. Usar perfil descartável para os cenários fictícios.
2. Registrar topo sem rolar, ficha, sacola, revisão e painel com prévia. Anotar viewport, catálogo e revisão do código. Comparar sob as mesmas condições. Os 30 testes aprovados da base cobrem domínio e integração local; o novo layout precisa de evidência própria.
3. Conferir loja em 320 px, 390 × 844 e 393 × 852, texto ampliado a 200%, teclado virtual, foco e leitor de tela. Alvos principais de 44 px, contraste mínimo de 4,5:1 para texto comum e 3:1 para texto grande. Testar movimento reduzido e ausência de rolagem horizontal indevida.
4. Em cache vazio e rede limitada, medir primeira tela e fotos. Comparar com os alvos do projeto de até 1 MB inicial e cerca de 100 KB por foto de cartão. Confirmar ausência de recursos do painel na visita pública.
5. Antes do lançamento, repetir a compra em iPhone, Android e navegador interno do Instagram. Registrar o que foi verificado em emulação e em aparelhos reais. Coordenar o ensaio efetivo de WhatsApp e a recuperação em homologação com os responsáveis.

**Ao entregar cada parte:** indicar qual tarefa o cliente ou a Laís já consegue executar, evidência que demonstra o aceite, branch, commit e pendência específica. Se faltar uma regra comercial ou fotografia, registrar a dúvida e concluir os itens independentes.
