# Laís Fit Já — arquitetura de software e estrutura do código

**Versão 1.0 · 22 de novembro de 2026**

React, TypeScript e CSS com Vite formam a base do cardápio e do painel. Cloudflare Workers, D1, R2 e Access são o destino da execução, dos dados, das fotos e do acesso administrativo. Este documento define a estrutura a adotar quando a programação começar. As jornadas, telas e critérios para celular estão no [documento de design e arquitetura front-end](design-e-arquitetura-front-end-lais-fit-ja.md).

## Estrutura e responsabilidades

Uma aplicação em um repositório pode ser publicada como uma unidade e manter módulos independentes no código e no carregamento. Vite empacota os arquivos. A divisão por responsabilidade e os pontos de carregamento sob demanda definem o que chega primeiro ao cliente.

~~~text
src/
  main.tsx                  # Inicializa a aplicação React
  app/                      # Rotas, tema e montagem dos módulos
  features/
    catalog/                # Vitrine, categorias, busca e detalhe de produto
    cart/                   # Seleção, edição e revisão da sacola
    checkout/               # Entrega, retirada e encaminhamento ao WhatsApp
    admin/                  # Páginas e navegação da área privada
      catalog/              # Cadastro de produtos, fotos, ofertas e publicação
      orders/               # Solicitações, vendas diretas e histórico
      store/                # Horários, contatos, pausas e aparência
      reports/              # Visão geral e exportação de vendas
  shared/
    ui/                     # Componentes reutilizados por mais de um módulo
    http/                   # Cliente HTTP e tratamento comum de erros
    styles/                 # Tema, tokens e estilos globais
shared/
  domain/                   # Regras puras de catálogo, preços e solicitações
  contracts/                # Entradas, saídas e erros da API
worker/
  index.ts                  # Entrada do Worker
  routes/                   # Entradas HTTP públicas e administrativas
  services/                 # Casos de uso, autorização e coordenação de operações
  adapters/                 # Integrações Cloudflare D1, R2 e Access
  migrations/               # Migrações SQL do D1
tests/                      # Regras, integração e cenários completos
scripts/                    # Tarefas locais e operacionais reproduzíveis
~~~

Importações seguem a responsabilidade. `main.tsx` entra em `app`, que compõe as funcionalidades. As funcionalidades usam seus próprios componentes, a interface compartilhada, os contratos e as regras puras. Chamam a API pelo cliente HTTP. No servidor, a rota valida a entrada, o serviço coordena a operação e os adaptadores falam com a Cloudflare. O domínio e os contratos podem ser usados nos dois lados e ficam livres de React, navegador, SDKs e infraestrutura. Módulos vizinhos usam somente a interface que o outro expõe. Evitar importações internas entre módulos e dependências circulares.

Cada módulo pode ganhar subpastas para componentes, hooks e chamadas HTTP conforme crescer. Extrair um componente ou arquivo quando houver uma responsabilidade clara que pode mudar sozinha. Evitar um `App.tsx` com todas as telas, um arquivo global de utilidades e uma pasta de abstrações sem uso real. O estado de uma tela fica perto dela. A sacola atravessa a navegação pelo seu próprio módulo. Os registros da loja vêm da API.

## SOLID aplicado ao projeto

| Princípio | Decisão prática |
| --- | --- |
| Responsabilidade única | O componente mostra a interface. A regra calcula preço ou disponibilidade. O serviço registra a solicitação e o adaptador persiste os dados. Uma mudança de CSS pode ficar na tela e uma mudança de preço na regra correspondente. |
| Aberto à extensão | Concentrar modelos de preço no módulo de precificação. Incluir uma nova regra com seus testes antes de usá-la no painel ou na sacola. Uma função ou união de tipos é suficiente quando expressa bem as variantes. |
| Substituição de Liskov | Adaptadores reais e de teste devem respeitar o mesmo contrato para sucesso, ausência e erro. Por exemplo, trocar a persistência de uma solicitação deve preservar o número e a regra de não criar duplicatas. |
| Segregação de interfaces | A API pública expõe o catálogo publicado e a criação de solicitações. Operações como salvar rascunho, registrar venda e alterar preços ficam em contratos administrativos menores, com autorização própria. |
| Inversão de dependências | As regras e os serviços trabalham com os dados e as operações de que precisam. D1, R2 e Access entram na montagem do Worker. Criar uma interface quando for útil para isolamento, troca de integração ou teste. |

## Vínculos entre telas, dados e publicação

- **Cardápio publicado.** A interface pública lê um resumo compacto do catálogo. Busca e seleção usam os dados publicados. O painel guarda rascunhos, e a ação de publicar atualiza a versão pública. Comandos operacionais independentes, como esgotar um sabor, devem valer para o público sem publicar as demais alterações.
- **Preços e sacola.** O navegador calcula uma previsão com as regras compartilhadas. O Worker consulta os dados vigentes e revalida as escolhas antes de registrar. Mudanças de preço ou disponibilidade voltam para revisão com indicação do item. A solicitação mantém a composição e os valores originais para consulta.
- **Horários.** O painel define dias, faixas e avisos. O domínio recebe a configuração e o horário da loja explicitamente, o que permite testar abertura, intervalo e fechamento. A ausência de horários exibe instrução de consulta pelo WhatsApp.
- **Dados e mídia.** D1 guarda catálogo, configurações, pedidos e histórico. R2 guarda originais privados e arquivos otimizados para exibição. Access protege o painel e as operações administrativas. Validar a identidade também no Worker antes de ler ou alterar dados privados.
- **Publicação.** Empregar o mesmo código em homologação e produção e conectar recursos D1, R2 e Access próprios de cada ambiente. Versionar as migrações. Preservar o procedimento de exportação e testar recuperação antes de desativar o caminho anterior.

## Desempenho e padrão dos arquivos

- Carregar catálogo, busca e acesso à sacola na entrada pública. Abrir editores, relatórios e configurações sob demanda. Conferir no navegador se a visita pública deixa de baixar os módulos administrativos.
- Manter estilos globais de tema e base pequenos. Associar estilos de cartão, sacola ou painel ao módulo que os usa. Usar a composição de React e controles nativos para manter o comportamento no toque e no teclado.
- Servir imagens de aproximadamente 320, 640 e 1.280 px conforme a área visível, mantendo o original fora da página pública. Priorizar a imagem principal quando for necessária e adiar fotos fora da tela.
- Usar TypeScript estrito, nomes claros, arquivos UTF-8 e formatação alinhada aos arquivos vizinhos. Usar PascalCase em componentes, camelCase em funções e hooks e nomes descritivos em pastas. Preferir mudanças de formatação apenas no trecho editado.
- Medir com fotos reais em celular e rede limitada. Verificar peso da primeira tela, tempo de resposta dos controles e estabilidade visual. Confirmar que extrair um componente reduz acoplamento. Para reduzir o que é baixado, conferir também a divisão dos módulos no build.

## Ponto de partida antes da etapa 1

Antes da etapa 1, `src/App.tsx` reunia navegação, cardápio e sacola, enquanto `src/admin/Admin.tsx` reunia várias telas privadas. `src/lib.ts` concentrava a conexão e a operação do Supabase. A separação de telas e regras compartilhadas está registrada na etapa 1 abaixo. As próximas etapas ligam as telas à API do Worker e validam D1, R2 e Access em homologação antes do corte de produção.

Os scripts ativos estão no `package.json`. `npm run dev`, `npm test` e `npm run build` formam a base local. `npm run assets` é necessário somente para regenerar as fotos de referência do projeto. Os scripts de backup e restauração existentes são de PostgreSQL. Na conversa de dados, definir os comandos locais de migração, exportação e recuperação para D1. Na conversa de publicação, definir os scripts Cloudflare e o fluxo de homologação e produção. Acrescentar essas ferramentas quando a etapa estiver em execução, com versões no projeto e lockfile atualizado.

## Etapa 1 implementada na conversa 02 · 22/11/2026

`src/main.tsx` entra em `src/app/App.tsx`, que apenas seleciona o cardápio ou carrega o painel com `React.lazy`. `src/App.tsx` permanece como exportação de compatibilidade. O painel saiu de `src/admin/Admin.tsx` para `src/features/admin/Admin.tsx`: coordena acesso, rascunho, publicação e navegação; login, catálogo, pedidos, aparência, configurações e visão geral têm arquivos próprios e carregamento sob demanda. O CSS administrativo também é carregado separadamente.

`features/catalog` contém a vitrine e o detalhe; `catalog/products.ts` expõe a seleção de produtos sem importar a vitrine. `features/cart` possui a sacola e sua persistência; `features/checkout` possui revisão, criação da solicitação e verificação Turnstile legada. `shared/ui` contém diálogo, quantidade e aviso. O tema está em `src/shared/styles/useTheme.ts`. As exportações antigas de `src/components.tsx` e `src/lib.ts` existem para compatibilidade; telas novas usam as interfaces dos módulos.

As regras e tipos puros foram movidos para `shared/domain/index.ts`. O caminho `supabase/functions/_shared/domain.ts` reexporta esse domínio para manter a função existente compatível no código. Empacotamento e execução remotos dessa função continuam sem ensaio nesta etapa. Nenhuma regra de preço ou horário nova foi inventada: os modelos atuais foram preservados.

As telas usam `src/shared/api/{catalog,cart,checkout,admin,identity,media}.ts`. Persistência e consultas legadas ficam em `legacyAdapter.ts`; autenticação e armazenamento de fotos ficam atrás de funções próprias, sem SDK nas funcionalidades. São fronteiras de substituição para a conversa 03; ainda não são um cliente HTTP de Worker. `checkout/service.ts` recebe `CheckoutApi` explicitamente, permitindo testar revisão e criação sem React, navegador ou servidor.

O encaminhamento agora inclui controles nativos de Entrega/Retirada e usa `orderMessage` como fonte única do resumo. A lista longa permanece integral para cópia; acima de 5.500 caracteres codificados, o link abre somente a conversa e orienta colar a lista. A abertura não prova envio. A chave da tentativa e as preferências são preservadas no navegador para retomar a mesma seleção e cotação; mudanças geram nova chave. A sacola continua com validade de sete dias e só é apagada por ação do cliente. Iniciar nova sacola limpa a tentativa anterior.

### Contratos para a conversa 03 · Dados e integrações

| Fronteira atual | Entrada, saída e invariantes a preservar |
| --- | --- |
| Catálogo público | `loadCatalog(): Promise<Catalog>`. Somente versão publicada; validar resposta. `Catalog`, `Product`, `CartLine`, `Quote` e `Order` estão em `shared/domain`. Valores monetários são centavos inteiros. Rascunho não deve ser acessível por essa operação. |
| Revisão e criação | `CheckoutApi` em `shared/contracts/checkout.ts`: `submitOrder(cart, notes, idempotencyKey, expectedSignature, token, expectedWhatsApp?): Promise<Order>`. Servidor recalcula com dados vigentes, rejeita assinatura divergente e opções indisponíveis, valida limites e retorna snapshot e referência. Quando informado, o contato revisado precisa coincidir com o atual. Nunca confiar no total do navegador. Chave repetida com o mesmo conteúdo retorna o registro original; com conteúdo diferente deve falhar. |
| Preferência de recebimento | `Fulfillment = delivery \| pickup`. Nesta transição vai como prefixo de `notes` (limite total 500; editor reserva 450 para observação). Worker e D1 poderão ganhar campo próprio em mudança coordenada. Não exigir esse campo no servidor legado. |
| Pedidos administrativos | `OrderEdit` em `shared/contracts/admin.ts`. `saveOrder` preserva `original`, origem inicial e referência; usa `expectedUpdatedAt` para impedir sobrescrita concorrente. `listOrders` mantém paginação completa. Só concluídos entram na receita. |
| Catálogo administrativo | `getDraft`, `saveDraft`, `publish`, `rollback` em `src/shared/api/admin.ts`. Validar publicação no servidor e manter versão pública separada. A restauração atual ainda é de catálogo completo. Separar aparência de disponibilidade operacional exige novo contrato. |
| Identidade | `isAdmin`, `observeIdentity`, `signIn`, `signOut`, recuperação legada. Na troca por Access, substituir essa fronteira e o login; validar identidade e autorização no Worker em cada operação privada. Demonstração local não é autenticação. |
| Mídia | `uploadProductImages({name, blob}[])` retorna URL pública de 640 px, com versões 320/640/1280 WebP e fallback JPEG. A geração não amplia o original. R2 deverá separar originais privados e derivados públicos; o envio de original privado ainda não existe. |
| Eventos | `EventRow` em `shared/contracts/admin.ts`; falha de telemetria não bloqueia cardápio nem checkout. Preservar paginação dos relatórios e não usar eventos como vendas. |

Erros atuais chegam como `Error.message`; não há envelope HTTP ou códigos estáveis definidos. A conversa 03 deve definir status e códigos para preço alterado, indisponibilidade, conflito, acesso negado e limite de requisições, preservando a seleção para revisão. Horários ainda são texto (`Catalog.hours`), não calendário estruturado. Estado “Em avaliação”, forma de pagamento, publicação operacional independente e regras completas das personalizadas continuam pendentes de contratos próprios. Não simular essas capacidades como concluídas.

### Verificação e limite desta entrega

- Base anterior: 24 testes aprovados. Após separação: 30 testes em quatro arquivos, incluindo preço alterado, indisponibilidade, rede, contato inválido, preferências, dez composições extensas e idempotência no adaptador local com armazenamento fictício. Testes SQL continuam exercitando a migração PostgreSQL existente em PGlite, não D1.
- `npm run build` aprovou TypeScript estrito e Vite. Comparação de builds locais: CSS público de 56,74 para aproximadamente 38,89 kB; CSS administrativo de 18,41 kB separado. Painel passou de um chunk de aproximadamente 50,18 kB para uma entrada de 12,08 kB e páginas próprias. JavaScript público ficou próximo de 287 kB sem compressão. São tamanhos do build, não medições de rede ou Core Web Vitals. Inspeção das importações locais não encontrou ciclos.
- `npm run dev` iniciou em `http://127.0.0.1:5173/`. Conferência visual **não concluída**: navegador integrado retornou `ERR_CONNECTION_TIMED_OUT`; a ferramenta encerrou o controle do Firefox por falta de suporte à política de URLs nesse navegador Windows. Não houve captura nova, comprovação visual em 390 px nem abertura/envio real ao WhatsApp. O arquivo antigo `artifacts/preview-mobile.jpg` não é evidência desta mudança.
- Próximo aceite: conferir em 390 × 844 px busca sem acento, categoria, detalhe, inclusão, edição/remoção, preferência, duas etapas de revisão, resumo e retomada com mesma referência; conferir painel, rascunho e prévia. Usar número fictício na demonstração e não enviar mensagem. Em rede do navegador, verificar ausência dos módulos e CSS administrativos na visita pública. Depois, ensaiar em iPhone/Android e navegador do Instagram.
- Ferramentas existentes foram suficientes para código, testes e build. Sem dependências, skills ou agentes externos instalados, sem alteração de lockfile. Para a lacuna visual, o [Responsive Design Mode nativo do Firefox](https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/index.html), aberto com `Ctrl+Shift+M`, permite a conferência manual. Fonte oficial Mozilla consultada em 22/11/2026; documentação contínua sem versão fixa. Não requer download, comando de instalação ou ativação de conteúdo externo.

Situação da primeira execução: implementação local entregue. A verificação no navegador foi retomada e está registrada abaixo.

### Aceite visual e rede na conversa 02 · 22/11/2026

**Aceite local concluído a 390 × 844 px.** Chrome 158.0.8127.36 com emulação móvel, toque e preferência de movimento reduzido. O ensaio usou a prévia do build de produção do Vite (`npm.cmd run build` e `npm.cmd run preview`), com perfil descartável, cache HTTP desativado, catálogo de demonstração e contato, observação e pedido fictícios. As seis capturas têm viewport de 390 × 844 px e largura de documento de 390 px.

| Área | Evidência e resultado |
| --- | --- |
| Cardápio | Marca, busca e categorias visíveis na primeira tela. Os cartões de destaque começam na borda inferior, e é preciso rolar para ler os nomes. A busca por `sanduiche` encontrou “Sanduíche natural”. A busca por `frango` permitiu filtrar por Lanches. O detalhe da Coxinha fit mostrou foto, opções e preço. [Cardápio](../../artifacts/aceite-mobile-2026-11-22/01-cardapio.png) · [Detalhe](../../artifacts/aceite-mobile-2026-11-22/02-detalhe.png) |
| Sacola | Inclusão, edição de 120 g para 240 g, ajuste de quantidade, recálculo para R$ 36,00 com duas porções e remoção até a sacola vazia. Na tentativa final, Entrega e a observação fictícia apareceram no resumo. A primeira etapa revisou preços sem gravar pedido. A segunda criou uma solicitação. Após recarregar, a sacola preservou a preferência, repetiu a mesma referência e manteve um único registro. O destino do botão foi conferido pelo link, sem abrir o WhatsApp. [Sacola](../../artifacts/aceite-mobile-2026-11-22/03-sacola.png) · [Resumo](../../artifacts/aceite-mobile-2026-11-22/04-resumo.png) |
| Painel | Visão geral e navegação utilizáveis no viewport. O rascunho salvo mudou o nome na prévia móvel, enquanto a vitrine pública manteve o nome publicado. A tela Pedidos encontrou a solicitação pela mesma referência. Durante o primeiro carregamento da Visão geral houve espaço em branco abaixo da navegação. Após carregar o conteúdo, a navegação ocupou 138 px e o painel exibiu os indicadores. [Painel carregado](../../artifacts/aceite-mobile-2026-11-22/05-painel.png) · [Prévia do rascunho](../../artifacts/aceite-mobile-2026-11-22/06-previa-rascunho.png) |

O log de rede do Chrome registrou `index-BdrrjJm2.js` e `index-BBKRTzkV.css` na rota pública, durante a abertura e o fluxo da sacola. O controle positivo em `/admin` carregou `Admin-C3aX7g_V.js`, `Admin-BDMquTx8.css`, `Dashboard-D9gGLBvc.js`, `SettingsPanel-dEEpBHOs.js` e `Orders-DKnKHLlE.js` ao abrir as telas correspondentes. Nenhum desses cinco arquivos apareceu na rede pública, inclusive após visitar o painel. Os nomes com hash correspondem a este build.

Continuam para o aceite de lançamento os ensaios em iPhone e Android reais, navegador interno do Instagram, teclado virtual, rede limitada e encaminhamento efetivo pelo WhatsApp.

## Etapa 01 do roteiro móvel · Vitrine e identidade

A rota pública usa o cabeçalho com a arte da Fit Já, sacola identificada e acesso a horário, localização e contatos. A vitrine apresenta o primeiro produto marcado como destaque que passa pela regra de disponibilidade do domínio. O botão abre a ficha existente. Sem destaque disponível, a busca vem logo após o cabeçalho. A ordem dos destaques segue a lista do catálogo publicado. O catálogo inicial põe a coxinha em primeiro lugar e mostra a porção cadastrada de 120 g por R$ 9,50. A composição pode ser confirmada com a Laís antes de entrar na ficha.

O painel reutiliza a abertura pública na prévia do rascunho. A largura real da coluna determina a apresentação dos cartões, inclusive na moldura móvel. O cabeçalho e as ações usam as variáveis do tema do catálogo. Os contratos, os identificadores e as chaves de persistência foram preservados. A mudança no destaque de fábrica só vale para o catálogo de demonstração inicial.

### Aceite da etapa

Aprovado localmente no Chrome 158, com perfil descartável, movimento reduzido e dados fictícios nos cenários de personalização e sacola. As comparações partiram do topo da rota `/`, na prévia de produção do Vite, com o mesmo navegador, viewport e catálogo-base. O ensaio usou toque emulado no destaque e confirmou a passagem pela ficha existente.

| Cenário | Resultado e capturas |
| --- | --- |
| 390 × 844 | Marca, sacola, busca, categorias e Coxinha fit com porção, preço e ação visíveis sem rolar. A ação termina a 236 px do topo. [Antes](../../artifacts/etapa-01-vitrine-mobile/antes-390.png) · [Depois](../../artifacts/etapa-01-vitrine-mobile/depois-390.png) · [Ficha](../../artifacts/etapa-01-vitrine-mobile/ficha-390.png) |
| 393 × 852 | Os mesmos critérios passaram. A ação termina a 222 px e abre a ficha da coxinha. [Antes](../../artifacts/etapa-01-vitrine-mobile/antes-393.png) · [Depois](../../artifacts/etapa-01-vitrine-mobile/depois-393.png) |
| Identidade | A faixa laranja `#EA5A1C` permanece visível com a marca e o logotipo ocultos em uma cópia da captura. [Assinatura sem logotipo](../../artifacts/etapa-01-vitrine-mobile/identidade-sem-logo-390.png) |
| Destaque e dados existentes | Com a coxinha esgotada, a vitrine mostrou a próxima opção de destaque disponível. Sem destaque, abriu diretamente na busca. A recarga preservou o catálogo fictício armazenado e os itens da sacola. [Destaque alternativo](../../artifacts/etapa-01-vitrine-mobile/fallback-esgotado-390.png) · [Sem destaque](../../artifacts/etapa-01-vitrine-mobile/sem-destaque-390.png) |
| Personalização | Tema azul e fonte Manrope aplicados na rota pública e na prévia do painel. O diálogo exibiu horário, localização e contato fictícios. [Tema salvo](../../artifacts/etapa-01-vitrine-mobile/tema-personalizado-390.png) · [Prévia do painel](../../artifacts/etapa-01-vitrine-mobile/previa-painel-390.png) |
| Tela larga | Vitrine centralizada a 1366 × 768. [Antes](../../artifacts/etapa-01-vitrine-mobile/antes-1366.png) · [Depois](../../artifacts/etapa-01-vitrine-mobile/depois-1366.png) |

A revisão com `web-design-guidelines` conferiu os nomes dos controles, o estado das categorias, o foco e o atalho de teclado para a busca, as dimensões das imagens e as áreas de toque dos controles da abertura. A navegação pública continuou sem carregar os arquivos do painel. `npm.cmd test` aprovou 30 testes em quatro arquivos e `npm.cmd run build` passou.

Para revisão da entrega, mostrar a comparação à Laís e confirmar a composição da coxinha. O aceite de lançamento ainda inclui os aparelhos reais e o navegador interno do Instagram.

## Etapa 02 do roteiro móvel · Catálogo e busca

### Conferência do catálogo de demonstração

As respostas do questionário e as decisões posteriores do produto orientam a demonstração em perfil novo. A arte física é a referência dos recortes fotográficos e de parte dos cadastros. A Laís ainda precisa aprovar o conteúdo definitivo para publicação. [Questionário](../respostas-lais-fit-ja.md) · [Decisões de produto](design-e-arquitetura-front-end-lais-fit-ja.md#exemplos-do-questionário-para-conferir-a-interface)

| Cadastro conferido | Aplicação na demonstração |
| --- | --- |
| Marmita de frango | Arroz, feijão e frango em cubos. 300 g por R$ 16,00, 350 g por R$ 18,00, 400 g por R$ 20,00 e 500 g por R$ 22,00. De 350 g em diante, inclui legumes. |
| Marmita de carne moída | Arroz, feijão e carne moída. 300 g por R$ 18,00, 350 g por R$ 20,00, 400 g e 500 g por R$ 22,00. De 350 g em diante, inclui legumes. |
| Escondidinho | Preservada a variante de carne moída de 300 g por R$ 21,00, junto das outras variantes cadastradas. |
| Bolo de banana | Nome alinhado para Bolo fit de banana, com a fatia de 100 g por R$ 5,00 já cadastrada. Mantidas as demais variantes existentes. |
| Coxinha | Mantida como primeiro destaque. A descrição usa a composição da resposta 1. As porções e preços existentes foram preservados. A demonstração mantém Lanches como categoria da coxinha, que aparece acima da lista de Marmitas prontas por ser destaque. |
| Café | Café puro, café com leite e cappuccino em copo ficam arquivados no catálogo inicial. O café gelado foi mantido, pois a imagem da arte mostra o produto em garrafa. |

A arte antiga mostra R$ 24,00 e R$ 26,00 nas marmitas de 500 g. A demonstração usa R$ 22,00 para ambas, conforme a resposta mais recente da Laís. Confirmar com ela esses preços, os recortes das marmitas e a categoria definitiva da coxinha, pois a resposta 1 também menciona Marmitas prontas. Os exemplos de combo aguardam a definição dos sabores e preços antes de cadastro.

### Implementação e aceite

O catálogo de demonstração abre na categoria de ID `marmitas`, rotulada Marmitas prontas no catálogo inicial. Se esse ID estiver ausente ou sem itens visíveis, abre em Todas as categorias. A ordem e os nomes dos grupos salvos continuam vindo do catálogo publicado. A consulta global usa nome, descrição, ingredientes e variantes sem diferenciar acentos. O filtro da busca é independente da categoria em navegação. Ao limpar, a interface retoma o grupo anterior. O foco volta ao campo ao acionar a limpeza. Produtos esgotados continuam listados com rótulo e inclusão desabilitada. Arquivados ficam fora da navegação e da busca.

Os IDs de produto, categoria e variantes existentes foram preservados. As variantes novas de 350 g usam `v3` em cada marmita. A composição por porção usa o nome da variante existente, que chega à ficha e à sacola. Publicação e rascunho salvos seguem com seus dados originais. Nenhuma migração foi necessária.

**Aceite local no Chrome 158 a 390 × 844 px**, pela prévia do build, com perfil descartável e dados fictícios.

| Cenário | Resultado e evidência |
| --- | --- |
| Demonstração nova | Abriu em Marmitas prontas. A ficha exibiu composição e preços das quatro porções de frango. A de 300 g entrou na sacola por R$ 16,00. [Antes](../../artifacts/etapa-02-catalogo-mobile/antes-390.png) · [Lista](../../artifacts/etapa-02-catalogo-mobile/marmitas-390.png) · [Ficha](../../artifacts/etapa-02-catalogo-mobile/ficha-marmita-390.png) · [Sacola](../../artifacts/etapa-02-catalogo-mobile/sacola-marmita-390.png) |
| Busca e filtro | Partindo de Lanches, `frango` encontrou itens em Marmitas prontas e Lanches, com categoria em cada cartão. O filtro restringiu os resultados. Doces sem resultados ofereceu busca em todas as categorias ou limpeza. Limpar retornou a Lanches. `sanduiche` encontrou Sanduíche natural e `cafe` encontrou o café gelado de garrafa. [Busca](../../artifacts/etapa-02-catalogo-mobile/busca-frango-390.png) · [Categoria sem resultados](../../artifacts/etapa-02-catalogo-mobile/filtro-sem-resultados-390.png) |
| Catálogo salvo | O catálogo anterior fictício manteve o nome Refeições, um produto renomeado, marmita arquivada fora da lista e escondidinho esgotado sem ação de inclusão. O publicado e o rascunho permaneceram idênticos no armazenamento. [Catálogo anterior](../../artifacts/etapa-02-catalogo-mobile/catalogo-anterior-esgotado-390.png) |

A revisão com `web-design-guidelines` conferiu seleção programática dos filtros, texto de esgotamento, anúncio de resultados, foco ao limpar e área de toque de 44 px na ação dos cartões. `npm.cmd test` passou com 31 testes e `npm.cmd run build` passou.

## Etapa 03 do roteiro móvel · Cartões, fotografias e ficha

Os cartões da rota pública e da prévia passaram a usar miniatura proporcional em área reservada de 76 px, nome, porção, preço e uma ação. A ficha exibe composição, porção e preço junto ao título. A área das opções rola independentemente do rodapé com a ação de adicionar. Ao voltar de uma ficha aberta pelo cardápio, o grupo e a busca permanecem e o foco retorna ao botão que abriu a ficha, com a rolagem preservada.

O preço inicial vem da variante mais barata e das escolhas obrigatórias disponíveis, cotadas pela mesma regra da sacola. Cartões esgotados mostram o estado e permitem consultar a ficha com a inclusão desabilitada.

O recorte `sucos` mede 149 × 149 px em todas as versões existentes, inclusive nas que levam 640 e 1280 no nome. Coxinha mede 185 × 185 px e a marmita de frango mede 185 × 188 px. Os recortes são servidos como miniaturas com o arquivo WebP menor e alternativa JPEG. Para uploads, os cartões usam o derivado menor e a ficha usa até o derivado intermediário, conforme economia de dados. Oferecer ampliação depende dos pixels reais carregados no navegador e exige pelo menos 320 px em ambos os lados. A ficha mantém a hierarquia quando falta foto. Os caminhos existentes das imagens e a rotina de upload permanecem compatíveis. O editor pede os originais para fotografias maiores.

`Variant.nutrition.confirmed` é opcional e fica no próprio JSON do catálogo. Valores já cadastrados continuam salvos e aguardam confirmação da porção e da composição no painel antes de voltar à ficha. É preciso informar a porção e pelo menos um valor. Alterar nome, composição, opção ou dados nutricionais requer nova confirmação. A tabela é exibida para o produto avulso sem adicionais selecionados. A função Supabase legada deve usar a validação de catálogo desta revisão quando for implantada para publicar a confirmação no backend.

### Aceite da etapa

**Aprovado localmente** no Chrome 158 a 390 × 844 px, em perfil descartável e pela prévia de produção do Vite.

| Cenário | Resultado e evidências |
| --- | --- |
| Mesmo suco de 149 px | A ficha antiga exibia o recorte em uma área de 390 × 235 px. A nova ficha exibe em 88 × 88 px e retira o controle de ampliação. [Cartão antes](../../artifacts/etapa-03-cartoes-mobile/antes-cartao-suco-390.png) · [Cartão depois](../../artifacts/etapa-03-cartoes-mobile/depois-cartao-suco-390.png) · [Ficha antes](../../artifacts/etapa-03-cartoes-mobile/antes-ficha-suco-390.png) · [Ficha depois](../../artifacts/etapa-03-cartoes-mobile/depois-ficha-suco-390.png) |
| Variante e retorno | Uva de 300 ml marcou R$ 8,00. Tangerina de 300 ml atualizou o resumo e o botão para R$ 9,00, valor conferido na sacola. A última opção alcançou a área visível acima do rodapé. Voltar preservou Bebidas, a posição de rolagem e o foco em Escolher. [Ficha com tangerina](../../artifacts/etapa-03-cartoes-mobile/tangerina-390.png) · [Sacola](../../artifacts/etapa-03-cartoes-mobile/sacola-tangerina-390.png) |
| Foto ausente e foto maior | O produto sem foto preservou porção, preço e ação no cartão e na ficha. A imagem fictícia de 640 × 480 px permitiu ampliar e reduzir. No mesmo ensaio, a tabela apareceu para a variante fictícia confirmada e sumiu na variante sem confirmação. [Cartão sem foto](../../artifacts/etapa-03-cartoes-mobile/sem-foto-cartao-390.png) · [Ficha sem foto](../../artifacts/etapa-03-cartoes-mobile/sem-foto-390.png) · [Ampliação](../../artifacts/etapa-03-cartoes-mobile/foto-maior-ampliada-390.png) |

A revisão com `web-design-guidelines` conferiu nome acessível da ação, dimensões e proporção das imagens, foco de retorno e acesso à última opção. `npm.cmd test` passou com 32 testes e `npm.cmd run build` passou. Para a próxima revisão com a Laís, solicitar as fotografias originais e confirmar as tabelas nutricionais que ela deseja publicar.

## Etapa 04 do roteiro móvel · Sacola, revisão e WhatsApp

A sacola identifica o número de porções e o conteúdo de cada porção. O resumo usa a mesma distinção. A barra persistente usa a cor principal do tema e reserva espaço na página, com margem para a área segura. No celular, sai do caminho quando um campo recebe foco. O painel da sacola se adapta à altura visível disponível. Entrega, retirada, observação e escopo da confirmação com a Laís aparecem antes de preparar a solicitação. A falta de contato é informada ao abrir a sacola.

A revisão carrega o catálogo uma vez e compara a cotação por linha. Alterações de preço mostram os valores anterior e atual. Produtos e escolhas indisponíveis são sinalizados na própria linha, com edição e remoção disponíveis. As demais linhas continuam cotadas, e o total fica em revisão enquanto houver itens inválidos. A sacola e a chave de idempotência mantêm o formato de persistência anterior.

A preparação usa a assinatura e o contato da revisão, com envio direto ao adaptador. A função legada e a demonstração fazem a validação definitiva. Um conflito reportado na preparação dispara uma releitura para recuperar os itens afetados. Erros transitórios preservam a chave para uma nova tentativa. Cada revisão assíncrona pertence à versão da seleção que a iniciou. Editar ou fechar invalida respostas anteriores, mesmo que a observação volte ao valor original. Um bloqueio síncrono impede dois envios simultâneos pelo mesmo diálogo.

### Aceite da etapa

**Aprovado localmente** no Chrome 158 a 390 × 844 px, com perfil descartável e dados fictícios. O ensaio da sacola principal usou a prévia do build. O ensaio de falha e latência usou uma API HTTP fictícia servida localmente.

| Cenário | Resultado e evidência |
| --- | --- |
| Porções, edição e contato | Adicionou marmita de 300 g e uma porção de duas coxinhas de 240 g, editou a opção para cinco unidades e removeu a coxinha. Selecionou Entrega e inseriu observação fictícia. A abertura já informou a ausência de WhatsApp. [Antes](../../artifacts/etapa-04-sacola-mobile/antes-sacola-390.png) · [Porções](../../artifacts/etapa-04-sacola-mobile/porcoes-390.png) · [Contato ausente](../../artifacts/etapa-04-sacola-mobile/contato-ausente-390.png) |
| Alterações de catálogo | A marmita passou de R$ 16,00 para R$ 17,00 e a linha mostrou a diferença. O esgotamento após a revisão bloqueou a preparação. A atualização recuperou a oferta quando voltou a ficar disponível. [Preço novo](../../artifacts/etapa-04-sacola-mobile/preco-novo-390.png) · [Esgotamento](../../artifacts/etapa-04-sacola-mobile/esgotado-390.png) |
| Latência, erro e teclado | Uma edição seguida de retorno à observação original invalidou a resposta atrasada. Uma falha HTTP simulada mostrou o erro e permitiu nova revisão. Com viewport reduzido a 390 × 465 px, a observação ficou na área rolável acima do rodapé. [Resposta atrasada](../../artifacts/etapa-04-sacola-mobile/resposta-atrasada-390.png) · [Falha de rede](../../artifacts/etapa-04-sacola-mobile/falha-de-rede-390.png) · [Viewport reduzido](../../artifacts/etapa-04-sacola-mobile/viewport-reduzido-390.png) |
| Referência, link e cópia | Dois cliques rápidos geraram uma solicitação. Reabrir e preparar a mesma seleção devolveu a mesma referência. O link curto reproduziu o resumo integral com preferência e observação. Dez montagens fictícias produziram um link apenas para a conversa. O texto passado à operação de cópia, capturada por um substituto descartável da área de transferência, coincidiu integralmente com o resumo. [Resumo](../../artifacts/etapa-04-sacola-mobile/resumo-390.png) · [Resumo longo](../../artifacts/etapa-04-sacola-mobile/resumo-longo-390.png) |

`npm.cmd test` passou com 32 testes e `npm.cmd run build` passou. O teste de contrato conferiu que preparar não repete a leitura de catálogo. A sintaxe TypeScript da função legada foi verificada localmente. Deno, Supabase e Turnstile reais, teclado em aparelhos físicos e envio pelo WhatsApp continuam no aceite de homologação.
