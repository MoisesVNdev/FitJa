# Auditoria Completa de UX, Front-end e Arquitetura: Laís Fit Já

**Data da Auditoria:** 22/11/2026  
**Versão do Sistema:** 1.0.0 (Etapa 07 — Demonstração Operacional e Contratos de Integração)  
**Ambiente de Execução:** Local (`http://127.0.0.1:5174/`) — Vite 6 + React 19 + TypeScript  
**Dispositivos e Viewports Auditados:**  
- **Smartphone Moderno (Mobile-First):** 390 × 844 px (iPhone 14/15/16, Galaxy S22/S23) e 393 × 852 px  
- **Notebook/Desktop (Área Administrativa):** 1366 × 768 px e 1280 × 720 px  
- **Perfis de Acesso:** Cliente de primeira viagem em smartphone; Desenvolvedor Frontend Sênior e Especialista em UX/Design System  

---

## 1. Visão Geral e Diagnóstico Executivo

O sistema **Laís Fit Já** é uma aplicação web mobile-first de cardápio digital, sacola de compras e encaminhamento de pedidos para WhatsApp, acompanhada de um painel administrativo completo para gestão de catálogo, pedidos, horários, aparência e relatórios de vendas.

### Pontos Fortes Notáveis
1. **Arquitetura Sólida e Separação de Responsabilidades:** O código adota separação estrita entre domínio puro (`shared/domain`), contratos de API (`shared/contracts`) e interface do usuário (`src/features`), mantendo regras de precificação por peso, descontos progressivos por quantidade e cálculo de horários livres de dependência de UI ou frameworks.
2. **Fluxo de WhatsApp com Rastreabilidade:** O processo de checkout em 2 etapas com cotação com assinatura, chave de idempotência e geração de código de referência único (ex: `FJ-20261122-0167BB1BA8`) resolve a fragilidade típica de pedidos via WhatsApp, garantindo integridade e registro simultâneo no banco.
3. **Identidade Visual com Energia:** O uso do laranja da marca (`#EA5A1C`) na barra superior e nos pontos focais cria imediato reconhecimento da marca, alinhado à proposta de alimentação saudável e apetitosa.
4. **Desempenho no Cliente:** Busca instantânea sem recarga, suporte a buscas sem acento e por ingredientes, e pré-visualização de fotos com variantes WebP otimizadas de 320 px e 640 px.

### Principais Oportunidades e Problemas Críticos
1. **Bug Visual nos Cartões do Cardápio (`.product-photo`):** Conflito de CSS legado força `height: 160px` em containers de imagem de 76 px de largura, gerando um retângulo cinza vazio de ~84 px acima da foto nos cards do smartphone.
2. **Incompatibilidade Mobile no Painel Administrativo (`/admin`):** O painel administrativo possui sidebar fixa e tabelas sem contêiner de rolagem horizontal adequado (como no Dashboard), gerando quebra de layout e rolagem horizontal na tela do smartphone.
3. **Bloqueio Silencioso na Sacola sem WhatsApp Cadastrado:** Quando o catálogo não possui um telefone válido cadastrado, o botão "Revisar itens e preços" não transiciona e não exibe erro explicativo inline no botão, deixando o cliente sem feedback.
4. **Contraste de Acessibilidade em Textos Pequenos sobre Laranja:** Combinações de texto branco sobre o laranja `#EA5A1C` possuem taxa de contraste de ~3,51:1 (abaixo do mínimo de 4,5:1 exigido pela WCAG AA para textos menores que 18,7 px bold).
5. **Microinterações e Ergonomia de Toque:** Ausência de feedback tátil/visual imediato ao toque (`:active { transform: scale(0.98); }`), falta de `touch-action: manipulation` explícito e de `overscroll-behavior: contain` nos modais.

---

## 2. Análise da Experiência do Cliente (Smartphone 390 × 844 px)

### 2.1 Primeira Dobra (Header e Abertura)
- **Cabeçalho:** A faixa laranja `#EA5A1C` preenche a largura total com altura adequada e respeito ao `safe-area-inset-top`.
  - *Logo:* Imagem redonda de 52 × 52 px com respiro equilibrado.
  - *Botão da Sacola no Topo:* Visível, com ícone e badge numérico tabular (`tabular-nums`). O contraste do texto e ícone marrom-escuro (`#28150D`) sobre o laranja entrega 4,97:1 (conforme WCAG AA).
  - *Botão de Informações:* Abre diálogo com dados de contato, horário e controle de economia de dados.
- **Destaque da Vitrine (Hero / Featured Product):**
  - O produto em destaque (ex: Coxinha fit) ocupa a primeira dobra de forma muito convidativa.
  - *Melhoria:* Em smartphones com alturas menores (ex: 667 px do iPhone SE), o card em destaque empurra a busca e as categorias para baixo da dobra. Recomenda-se reduzir a altura máxima da foto do destaque em telas verticais compactas.

### 2.2 Campo de Busca e Pílulas de Categoria
- **Busca:**
  - *Pontos Fortes:* Busca reativa instantânea (cliente-side), case-insensitive e sem diferenciação de acentos (ex: "sanduiche" encontra "Sanduíche natural").
  - *Empty State:* Excelente mensagem explicativa com botão "Limpar busca" quando nenhum produto é encontrado.
  - *Problema UX:* O campo de busca esconde o botão nativo do WebKit (`::-webkit-search-cancel-button { display: none; }`) e só exibe o ícone de `X` condicionalmente. Em conexões lentas ou ao digitar, o botão de limpar pode apresentar ligeiro atraso visual. O campo deve ter um botão de limpeza rápida com alvo de toque de pelo menos 44 × 44 px permanentemente posicionado à direita quando houver texto.
- **Categorias (Category Pills):**
  - Rolagem horizontal fluida com `scroll-snap` e `white-space: nowrap`.
  - Pílula ativa com destaque forte (verde escuro / contraste visível).
  - *Melhoria:* Adicionar um gradiente sutil de máscara (*fade mask*) na borda direita da barra de categorias para sinalizar visualmente que a lista é rolável horizontalmente.

### 2.3 Cartões de Produto (Listagem Principal)
- **Problema Crítico de Layout (Bug do Container de Foto):**
  - No arquivo `src/styles.css` (linha 666 e media queries nas linhas 1330, 1429, 1663), existe a regra:
    ```css
    .category-section .product-photo { height: 160px; } /* e 130px em telas < 480px */
    ```
  - Como o cartão no celular foi reestruturado para um grid horizontal de duas colunas (`grid-template-columns: 76px minmax(0, 1fr)`), o container da foto fica com 76 px de largura e 130–160 px de altura. Como a imagem interna possui `aspect-ratio: 1` (76 × 76 px), sobra um retângulo cinza de 54 a 84 px no topo de cada produto.
  - *Correção necessária:*
    ```css
    .product-card {
      align-items: start;
    }
    .product-card .product-photo {
      width: 76px;
      height: 76px;
      aspect-ratio: 1 / 1;
      border-radius: 10px;
      overflow: hidden;
      align-self: start;
    }
    ```
- **Hierarquia de Informações do Card:**
  - Título com bom peso (`font-weight: 800`), seguido por porção cadastrada (ex: "120 g") e badge de destaque.
  - Preço inicial bem visível com prefixo "A partir de" para itens com variantes.
  - Botão de ação ("Escolher"): altura de 40 px com padding confortável. Para cumprir estritamente o critério de acessibilidade de 44 × 44 px sem alterar o visual compacto, o container deve usar `min-height: 44px` ou área de toque expandida com pseudo-elemento `::after`.

### 2.4 Ficha / Modal de Detalhes do Produto
- **Abertura e Transição:** Modal entra com animação suave e escurecimento de fundo (*backdrop*).
- **Conteúdo e Seletores:**
  - Foto em tamanho maior (proporção 4:3 ou 1:1) com indicador de zoom quando a resolução permitir.
  - Seletor de porções via botões de opção (*radio cards*): excelente feedback ao selecionar, alterando instantaneamente o valor total no rodapé.
  - Avisos de desconto progressivo ("Comprando 2 unidades você economiza R$ X,XX") aparecem de forma clara e motivadora.
  - Tabela nutricional expansível bem organizada, com aviso de confirmação da porção.
- **Rodapé Fixo do Modal:**
  - Botão largo "Adicionar à sacola • R$ XX,XX" fixado na parte inferior.
  - *Ponto de Atenção:* Em aparelhos com barra de navegação virtual ou teclado ativo, o rodapé pode sobrepor o último item da rolagem interna se a classe `.dialog-scroll` não tiver padding inferior compensatório (`padding-bottom: calc(80px + env(safe-area-inset-bottom))`).

### 2.5 Sacola de Compras e Checkout via WhatsApp
- **Barra Flutuante Inferior (Bottom Cart Bar):**
  - Aparece suavemente quando há itens na sacola.
  - Posicionada perfeitamente na *Thumb Zone* (zona de alcance natural do polegar).
  - Inclui contagem de itens, chamada clara e valor total atualizado.
- **Gaveta / Modal da Sacola:**
  - Lista de itens com foto miniatura, porção escolhida e botões de quantidade (`-` e `+`) com resposta em tempo real.
  - Botão de exclusão (lixeira) com confirmação visual.
  - Alternador de modalidade: **Entrega** vs **Retirada** com destaque limpo.
  - Campo de observações com contador de caracteres (ex: 0/450) e dica de segurança para não incluir dados sensíveis.
- **Processo de Finalização em Duas Etapas:**
  1. *Etapa 1 (Revisão):* O cliente clica em "Revisar itens e preços". O sistema relê o catálogo, recalcula os valores com a assinatura vigente do servidor e notifica sobre eventuais mudanças de preço ou esgotamento.
  2. *Etapa 2 (Preparação):* O cliente clica em "Preparar pedido para WhatsApp". Um código de referência de 10 caracteres é gerado, o pedido é salvo de forma transparente e uma tela de sucesso exibe a mensagem pronta com botão "Abrir WhatsApp" e "Copiar pedido completo".
- **Problema Crítico de Fluxo (Bloqueio sem WhatsApp Cadastrado):**
  - No arquivo `src/features/checkout/useCheckout.ts` (linhas 70–74), se `validPhone(next.catalog.whatsapp)` for falso, a função `refresh()` executa `setReview(null)` sem atribuir nenhuma mensagem de erro à variável `error`.
  - O botão principal permanece exibindo "Revisar itens e preços", e o cliente clica repetidamente sem entender por que a mensagem para o WhatsApp não avança.
  - *Correção necessária:* Definir mensagem explícita no estado: `"A loja está temporariamente sem número de WhatsApp cadastrado para receber pedidos online. Entre em contato por outro canal."`

---

## 3. Análise da Área Administrativa (`/admin`)

### 3.1 Responsividade em Smartphones (390 px)
- **Problema de Usabilidade:**
  - O painel administrativo foi concebido prioritariamente para telas de desktop (grid de 235 px na barra lateral + conteúdo de até 1500 px).
  - Em telas móveis (`@media (max-width: 760px)`), a barra lateral passa para o topo como uma linha horizontal rolável de botões. No entanto, as telas internas possuem tabelas com `white-space: nowrap` e grids rígidos.
  - Na tela de **Visão Geral (Dashboard)**, a tabela "Vendas por origem" (linha 113 de `Dashboard.tsx`) não possui o container `.table-scroll`, causando expansão da página e rolagem horizontal involuntária em toda a aplicação administrativa.
- **Recomendação para Mobile Admin:**
  1. Envolver todas as tabelas em `<div className="table-scroll">`.
  2. Implementar visualização em cartões (*card layout*) para pedidos e produtos no smartphone, reservando o formato tabular para telas a partir de 768 px.
  3. Adicionar uma barra de navegação inferior (*Bottom Navigation Bar*) no mobile com os 4 itens mais frequentes (Pedidos, Cardápio, Disponibilidade e Dashboard) e menu "Mais" para Configurações e Aparência.

### 3.2 Experiência em Desktop / Notebook (1366 × 768 px)
- **Excelente Acabamento Funcional:**
  - **Dashboard:** Gráficos de barras em CSS nativo muito elegantes, sem dependência de bibliotecas pesadas de terceiros. Cards de métricas com valores grandes, ícones coloridos e filtros de período por semana, mês e ano.
  - **Catálogo & Editor de Produtos:** Formulário completo com upload de imagens, variantes com porção e peso, faixas de preço progressivas por quantidade, tabela nutricional e controle de rascunho versus publicação.
  - **Prévia Mobile Integrada (`CatalogPreview`):** Recurso excepcional que permite à proprietária testar o visual do cardápio em um frame de 390 px dentro do próprio painel antes de publicar.
  - **Disponibilidade Rápida:** Tela dedicada para esgotar ou pausar produtos e sabores com um clique sem precisar editar o produto completo nem alterar o rascunho de trabalho.
  - **Horários da Loja:** Configuração por faixas de horário para cada dia da semana com suporte a datas excepcionais (feriados/recessos).

---

## 4. Design, Cores, Tipografia e Microinterações

### 4.1 Cores e Identidade Visual

| Cor / Token | Código HEX | Uso no Sistema | Avaliação de Contraste e UX |
|---|---|---|---|
| **Laranja Principal** | `#EA5A1C` | Cabeçalho, botões primários, badges de destaque, barra flutuante | Cor vibrante e memorável. Contraste com texto `#28150D` é 4,97:1 (Aprovado). Contraste com texto branco `#FFFFFF` é 3,51:1 (Apenas para texto grande ≥ 18,7 px bold). |
| **Texto sobre Laranja** | `#28150D` | Títulos e rótulos sobre fundo laranja | Excelente legibilidade e harmonia com tons quentes. |
| **Verde da Folha** | `#32B44A` | Detalhes sutis da marca e ícones saudáveis | Uso decorativo secundário (não usar com texto branco devido ao contraste baixo de 2,71:1). |
| **Verde Escuro Apoio** | `#245E3C` | Botão do WhatsApp, pílula de categoria ativa | Contraste de 7,66:1 com texto branco (Excelente acessibilidade). |
| **Superfície / Cartão** | `#FFFFFF` | Cards de produtos, modais, painéis | Branco puro garante respiro e destaca as fotos reais dos alimentos. |
| **Fundo da Página** | `#FAFAF7` | Background neutro do site e cardápio | Leve tom quente que reduz a fadiga visual em comparação com branco puro. |
| **Linhas e Bordas** | `#E5E8DE` | Divisores de categorias e bordas de inputs | Suave e bem integrado à paleta natural. |

### 4.2 Tipografia e Escala
- **Fontes Carregadas:** `Nunito Sans` (títulos e interface), `Manrope` e `DM Sans`.
- **Hierarquia:**
  - Títulos de categoria (`h2`): 1,25rem a 1,45rem com peso 900.
  - Nomes de produtos (`h3`): 1rem a 1,1rem com peso 800.
  - Preços: Tipografia tabular (`tabular-nums`) para evitar desalinhamento visual na rolagem.
- **Oportunidade:** Utilizar a propriedade moderna de CSS `text-wrap: balance` nos títulos de produtos e na mensagem da marca para evitar palavras órfãs na segunda linha.

### 4.3 Microinterações e Estados de Botões
- **Estados de Interação:**
  - O sistema possui bom efeito de `:hover` no desktop (`transform: translateY(-1px)`).
  - No celular, telas sensíveis ao toque não disparam hover antes do clique. É fundamental adicionar feedback imediato de toque:
    ```css
    .button:active,
    .product-action:active,
    .header-cart:active {
      transform: scale(0.97);
      transition: transform 0.08s ease-out;
    }
    ```
- **Transições Suaves:** Substituir declarações genéricas por propriedades explícitas de compositor (`transform`, `opacity`), mantendo respeito a `@media (prefers-reduced-motion: reduce)`.
- **Prevenção de Zoom Acidental:** Adicionar `touch-action: manipulation` no CSS global de botões e links para eliminar o atraso de 300 ms de duplo toque nos navegadores móveis.

---

## 5. Auditoria Técnica de Código e Arquitetura

### 5.1 CSS e Estrutura de Folhas de Estilo
- **Pontos Positivos:**
  - Separação física de CSS: `src/styles.css` (estilos públicos e compartilhados) e `src/features/admin/admin.css` (estilos administrativos carregados sob demanda apenas em `/admin`).
  - Utilização de variáveis CSS modernas e funções nativas como `color-mix(in srgb, ...)`.
- **Pontos de Atenção:**
  - Limpeza de seletores legados: regras que definem altura fixa para fotos de produtos em `.category-section .product-photo` devem ser removidas em favor do formato quadrado `76 × 76 px` auto-ajustável.
  - Unificação de breakpoints: existem media queries espaçadas em 1100 px, 900 px, 760 px, 600 px e 480 px. Recomenda-se consolidar em 3 breakpoints canônicos: Mobile (< 640 px), Tablet (< 1024 px) e Desktop (≥ 1024 px).

### 5.2 Acessibilidade e Diretrizes Web (Vercel Guidelines & WCAG)
- **Modais e Diálogos:**
  - O componente `Modal.tsx` gerencia fechamento com tecla `Escape`, aprisionamento de foco (*focus trap*) e associação correta de `aria-labelledby`.
  - *Melhoria Recomendada:* Adicionar `overscroll-behavior: contain` no container `.dialog-scroll` para impedir que a rolagem interna do modal propague a rolagem para a página de fundo (*scroll chaining*).
- **Alvos de Toque (Touch Targets):**
  - Garantir que todos os botões de ajuste de quantidade (`+` e `-`), botões de fechar modal e pílulas de categoria tenham no mínimo 44 × 44 px de área interativa (usando padding ou margens negativas transparentes).

### 5.3 Otimização e Exibição de Fotografias
- **Formatos e Responsividade:**
  - O componente `FoodImage` adota formato moderno WebP com fallback para JPEG, servindo a versão de 320 px em cards pequenos e 640 px em fichas de detalhe.
  - Imagens com `loading="lazy"` para itens abaixo da dobra e `loading="eager"` / `fetchpriority="high"` no produto em destaque.
  - Imagens possuem atributos explícitos de `width` e `height`, prevenindo oscilações bruscas de layout (*Cumulative Layout Shift - CLS*).
- **Tratamento de Produtos sem Foto:**
  - Placeholder visual muito elegante com ícone de folha e cores suaves, preservando a harmonia da listagem mesmo quando faltam fotos de determinados produtos.

---

## 6. Plano de Ação e Matriz de Melhorias Priorizadas

Abaixo está o roteiro de correções e aprimoramentos técnicos e de design, ordenados por prioridade e impacto na conversão de vendas e experiência do usuário:

### Detalhamento das Tarefas de Implementação

| # | Item / Melhoria | Arquivo(s) Afetado(s) | Impacto | Esforço | Descrição da Solução |
|---|---|---|---|---|---|
| **01** | **Correção da Foto dos Cards** | `src/styles.css` (linhas 502, 666, 1330, 1429, 1663) | **Crítico (Visual)** | Baixo (10 min) | Remover `height: 160px` / `130px` de `.category-section .product-photo`. Definir `.product-card .product-photo` com `width: 76px; height: 76px; aspect-ratio: 1/1; align-self: start;` eliminando a sobra cinza vazia. |
| **02** | **Aviso de WhatsApp Ausente no Checkout** | `src/features/checkout/useCheckout.ts` (linhas 70–75) | **Crítico (Conversão)** | Baixo (15 min) | Em `refresh()`, se `!validPhone(...)`, definir erro explícito: `"Número de WhatsApp da loja indisponível. Entre em contato por outro canal."` em vez de apenas travar o avanço silenciosamente. |
| **03** | **Prevenção de Rolagem Horizontal no Admin** | `src/features/admin/reports/Dashboard.tsx` (linha 113) e `admin.css` | **Crítico (Usabilidade)** | Baixo (15 min) | Envolver a tabela `Vendas por origem` em `<div className="table-scroll">` e adicionar regra `.table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }` em `admin.css`. |
| **04** | **Microinteração e Toque Mobile** | `src/styles.css` (linha 150) | **Alto (UX Mobile)** | Baixo (10 min) | Adicionar `touch-action: manipulation;` nos botões e regras de `:active { transform: scale(0.97); }` em botões de ação e cards para resposta instantânea ao toque do polegar. |
| **05** | **Isolamento de Rolagem nos Modais** | `src/styles.css` (classes de modais) e `Modal.tsx` | **Alto (UX Mobile)** | Baixo (10 min) | Adicionar `overscroll-behavior: contain;` em `.dialog-scroll` e `.cart-content` para impedir o encadeamento de rolagem na página ao rolar a sacola ou a ficha de produto. |
| **06** | **Botão de Limpar Busca com Alvo Expandido** | `src/features/catalog/Menu.tsx` (linha 262) e `styles.css` | **Alto (Ergonomia)** | Médio (20 min) | Tornar o botão de limpar visível e fixo à direita do input assim que houver texto digitado, com alvo de toque de no mínimo 44 × 44 px e ícone contrastante. |
| **07** | **Ajuste Fino de Contraste WCAG** | `src/styles.css` e `identidade-visual-fit-ja.md` | **Alto (Acessibilidade)** | Baixo (15 min) | Garantir que nenhum texto abaixo de 18 px utilize branco puro sobre `#EA5A1C`. Utilizar `#28150D` ou o tom funcional escuro `#C1440E` para manter conformidade WCAG AA. |
| **08** | **Indicador Visual de Rolagem nas Categorias** | `src/styles.css` (`.category-nav`) | **Médio (Design)** | Médio (25 min) | Adicionar pseudo-elemento com gradiente transparente-para-fundo na extremidade direita do container de categorias para indicar que há mais itens à direita. |
| **09** | **Tipografia Balanceada em Títulos** | `src/styles.css` | **Médio (Design)** | Baixo (10 min) | Adicionar `text-wrap: balance;` em títulos de produtos (`.product-title`), cabeçalhos de categoria e slogans para evitar quebras de linha com palavras únicas. |
| **10** | **Cards de Pedidos para Admin Mobile** | `src/features/admin/orders/Orders.tsx` e `admin.css` | **Médio (Operação)** | Médio (40 min) | Criar visualização alternativa em cartões compactos para lista de pedidos quando a tela for menor que 640 px, facilitando a conferência da proprietária pelo próprio celular. |

---

## 7. Conclusão da Análise

O projeto **Laís Fit Já** já se encontra em um patamar de maturidade técnica e funcional muito avançado para o segmento de alimentação saudável e delivery via WhatsApp:
- O catálogo público carrega com excelente rapidez;
- As regras de cálculo por peso e faixas de quantidade atendem com precisão às necessidades comerciais da Laís;
- O painel administrativo no computador oferece controle detalhado e seguro com rascunhos e publicação desacoplados.

Aplicando as três correções críticas imediatas (**ajuste dimensional da foto nos cards**, **exibição de erro no checkout sem WhatsApp** e **envolvimento das tabelas do painel em contêiner de rolagem**) e incorporando os aprimoramentos de microinterações táteis e acessibilidade, o produto atingirá nível excepcional de qualidade de produção e alta taxa de conversão em dispositivos móveis.
