# Plano de Resolução Técnica UI/UX e Design System: Laís Fit Já
**Guia operacional passo a passo, com código "antes" conferido no repositório**
**Versão:** 2 (revisada e completada em 22/11/2026)
**Origem:** `Docs/Planejamento/diagnostico-ui-ux-design-system-fit-ja.md`
**Regras de contorno:** `AGENTS.md` e `Docs/Material de designer/identidade-visual-fit-ja.md` (o guia de identidade tem prioridade sobre o diagnóstico quando houver conflito)
**Alvos:** `src/styles.css`, `src/features/catalog/Menu.tsx`, `src/features/catalog/ProductViews.tsx`, `src/features/cart/CartDialog.tsx`, `src/shared/styles/useTheme.ts`, `src/data.ts`, `shared/domain/index.ts`
**Objetivo:** dar acabamento premium à interface (contorno, profundidade, hierarquia, microinterações) mantendo o laranja `#EA5A1C` como assinatura, o contraste acessível e a personalização do tema pela Laís.

---

## 0. O que mudou em relação à versão 1 (registro de correções)

A versão 1 foi escrita sem conferir o código atual. A conferência mostrou os pontos abaixo, todos corrigidos neste documento.

| # | Erro ou lacuna da v1 | Evidência no projeto | Correção na v2 |
|---|---|---|---|
| 1 | Trocar `--primary-text` para `#ffffff` quebra a validação do tema | `shared/domain/index.ts:309` exige `contrast(primary, primaryText) >= 4.5`. Branco sobre `#EA5A1C` dá **3,51:1**. O catálogo com esse tema seria rejeitado. | Decisão D2 (seção 1). Padrão: manter `#28150D` (4,97:1). |
| 2 | Mudar `:root` não altera o site ao vivo | `useTheme.ts` grava `--primary`, `--primary-text`, `--page`, `--surface`, `--ink` direto em `documentElement` a partir de `catalog.theme`. O padrão real mora em `src/data.ts:430`. A v1 mandava "atualizar `useTheme.ts` para `#ffffff` por padrão", mas o hook não tem padrão. | Seção 1.3 e Fase 1: valores-padrão do tema ficam em `data.ts`, e o CSS novo deriva tudo de `var(--primary)`. |
| 3 | Gradientes e sombras com laranja fixo (`#f06423`, `#d94e0f`, `rgba(217,78,15,…)`) | O editor de aparência deixa a Laís trocar a cor primária. Os valores fixos ignorariam o tema. | Tudo via `color-mix(in srgb, var(--primary) …)`. |
| 4 | `color: #ffffff !important` | Anula o campo "Texto dos botões" do painel e qualquer tema salvo. | Removido. Nenhum `!important`. |
| 5 | Gradiente com topo `#F06423` e base `#D94E0F` sob texto branco | Branco sobre `#F06423` = 3,21:1. Sobre `#D94E0F` = 4,16:1. Sobre `#F26D2E` = 3,0:1. Nenhum ponto chega a 4,5:1. | Base do gradiente = `var(--primary)` (contraste já validado). Topo só mais claro, o que melhora o contraste do texto escuro. |
| 6 | Seletores inexistentes | Ver tabela 1.1. Ex.: `.featured-card`, `.bottom-cart-bar`, `.bottom-cart-button`, `.category-pill`, `.badge-favorite`, `.header-cart-badge`. | Todos mapeados para as classes reais. |
| 7 | Blocos "Código Antes" não batem com o arquivo | O `:root` real não tem `--primary-hover`, `--primary-soft`, `--danger`, `--shadow`, `--container-max-width`. A fonte é `--font`, não `--font-family`. `--line` real é `#e5e8e0`. O `.site-header` real **não é sticky**. | "Antes" refeito a partir do arquivo. |
| 8 | Itens já entregues contados como pendentes | Commits `c981d80` e `3bdbfad`: `:active scale(.97)`, `touch-action`, alvos de 44 px, correção do retângulo cinza da foto, busca e categorias. | Fase marcada como "já feito" quando for o caso (tabela 1.2). |
| 9 | Foto 76→88 px sem mexer no grid | `.product-card` usa `grid-template-columns: 76px …` (linha 593) e há overrides em `@media` (linhas 544, 1376, 1476, 1711). Mudar só a foto desalinha o cartão. | Fase 5 lista todos os pontos. |
| 10 | Borda do cartão ignorada pelo CSS de categoria | `.category-section .product-card { border-color: transparent }` (linha 721) vence `.product-card`. Os cartões ficam sobre `--section-bg` por categoria, não sobre `--page`. | Fase 5 trata essa regra. Justificativa do "fundo linho" revisada. |
| 11 | Texto de marketing sem base | "🔥 Mais Pedido da Semana": não existe ranking de vendas no produto (o destaque é escolhido pela Laís). "Ingredientes 100% selecionados", "Entrega ágil em Caruaru": não constam nas respostas da Laís. | Rótulos neutros e fluxo de confirmação (D4). |
| 12 | Header branco e categoria ativa verde contrariam o guia | O guia pede superfície laranja marcante na primeira tela, categoria selecionada com sinal laranja e verde apenas como apoio. | Decisão D1 e D3. Padrão: seguir o guia. |
| 13 | Fases sem código ou sem entrega | Fase 5 citava modais e `CartDialog.tsx` sem nenhuma instrução. Tipografia, painel, foco, movimento reduzido, tema dinâmico, evidências e documentação não apareciam. | Fases 8 a 12 e seção 4 acrescentadas. |
| 14 | Critério de aceite desatualizado | "52/52 testes" não foi confirmado (`codex-setup.md` registrou 30 e hoje há cerca de 44 `it(` nos arquivos de teste). O checklist exigia "nenhum texto escuro sobre laranja", o que contraria o guia. | Critérios refeitos (seção 4). Número de testes passa a ser "todos passando", sem total fixo. |
| 15 | Z-index e posição da sacola | `.toast` está em `bottom: 100px; z-index: 30`. A v1 punha a sacola também em `z-index: 30`. A sacola real é `.floating-cart` (z 8) e já respeita `safe-area`. | Fase 6 ajusta sem colisão. |

---

## 1. Fundamentos que valem para todas as fases

### 1.1 Mapa de seletores: v1 → projeto real

| Nome usado na v1 | Classe real | Arquivo e linha aproximada |
|---|---|---|
| `.button.primary` | `.button` + `.primary` (o `.primary` é global) | `styles.css:150`, `:166` |
| `.button.ghost` | não existe | — |
| `.site-header` (sticky) | `.site-header` (grid, **sem** sticky) | `:301` |
| `.site-header .icon-button` | `.store-info` (botão de informações) | `:335` |
| `.header-cart-badge` | `.header-cart b` | `:354` |
| `.brand-accent` | não existe (precisaria de marcação nova) | `Menu.tsx:212` |
| `.featured-card` | `.featured-product` | `:374`, `ProductViews.tsx:81` |
| `.featured-tag` | não existe (precisa de TSX) | — |
| `.category-pill` | `.category-nav button` (+ `.active`) | `:490`, `:511` |
| `.badge-favorite` | `.product-badge` | `:659` |
| `.bottom-cart-bar` / `.bottom-cart-button` | `.floating-cart` / `.floating-cart > button` | `:800`, `:817` |
| `.bottom-cart-count` | `.floating-count` | `Menu.tsx:404` |
| `.footer-trust-badges` | não existe (precisa de TSX) | — |

### 1.2 O que já está pronto (não refazer)

- Feedback de toque: `.button:active` com `scale(0.97)`, `touch-action: manipulation`.
- Alvos de toque de 44 px em `.icon-button`, `.header-cart`, `.category-nav button`, `.product-action`.
- Correção do retângulo cinza acima da foto no cartão.
- Busca instantânea e estado vazio.
- `font-variant-numeric: tabular-nums` nos preços.

### 1.3 Decisões que precisam do responsável (com padrão adotado)

| ID | Decisão | Padrão deste plano | Alternativa (exige aprovação) |
|---|---|---|---|
| **D1** | Cor do cabeçalho | **Laranja** `var(--primary)`, com acabamento (contorno, brilho, sombra). Segue o guia §3 e §5. | Cabeçalho claro e translúcido, como no diagnóstico. Exige reescrever a regra de "presença do laranja na primeira tela" no guia, porque o laranja sairia do topo. |
| **D2** | Cor do texto sobre laranja | **`#28150D` sobre `#EA5A1C`** (4,97:1). Para ações com rótulo branco, usar o laranja escuro `#C1440E` (5,12:1), conforme guia §6. | Branco em todos os botões: só fecha com os botões em `#C1440E` ou mais escuro, o que reduz o laranja de assinatura. Exige mudar `data.ts`, o guia e o texto do editor. Nunca usar branco sobre `#EA5A1C` em texto pequeno. |
| **D3** | Categoria selecionada | **Laranja** com texto `var(--primary-text)`, anel e peso maior (não depende só da cor). | Verde botânico `#183D24` com branco (13,8:1 de contraste, mas contraria "verde é secundário"). |
| **D4** | Selos de confiança no rodapé | Só textos que a Laís confirmou. Os três do diagnóstico ficam como **rascunho a aprovar**. | Publicar como estão (não recomendado: são promessas comerciais). |

Se o responsável escolher as alternativas, as fases abaixo continuam válidas; só mudam os valores dos tokens `--cta-*` e as regras marcadas com **[D1]**, **[D2]**, **[D3]**.

### 1.4 Princípios técnicos

1. **Tema dinâmico primeiro.** Nenhuma cor de marca fixa em regra nova. Usar `var(--primary)` e `color-mix`.
2. **Sem `!important`.**
3. **Tokens novos só aditivos.** Não renomear `--primary`, `--primary-text`, `--page`, `--surface`, `--ink`, `--green`, `--muted`, `--line`, `--font`.
4. **Fonte:** manter Nunito Sans (guia §4). O diagnóstico sugere Plus Jakarta Sans, mas o guia pede para não adicionar fonte nova. Ajustar só pesos e espaçamento.
5. **Movimento reduzido:** toda animação nova entra em `@media (prefers-reduced-motion: no-preference)`.
6. **Foco:** manter o anel `outline: 3px solid #267849` já existente; não removê-lo ao trocar fundos.

---

## Fase 0: Preparação e linha de base

1. Criar branch: `git switch -c feat/acabamento-design-system`.
2. Rodar `npm.cmd test` e `npm.cmd run build` e anotar o resultado **antes** de mexer (linha de base real).
3. Subir `npm.cmd run dev` e capturar "antes" em 390 × 844 e 1366 × 768: cardápio, ficha de produto, sacola, resumo, painel. Salvar em `artifacts/etapa-08-acabamento/antes-*.png`, no mesmo padrão das etapas anteriores.
4. Conferir o tema atual no painel (Aparência) e anotar os valores, para testar a restauração depois.

---

## Fase 1: Tokens aditivos

### Arquivo: `src/styles.css` (bloco `:root`, linha 1)

#### Antes (real)
```css
:root {
  --primary: #ea5a1c;
  --primary-text: #28150d;
  --page: #fafaf7;
  --surface: #fff;
  --ink: #24382b;
  --green: #245e3c;
  --muted: #687169;
  --line: #e5e8e0;
  --font: "Nunito Sans", sans-serif;
  /* … */
}
```

#### Depois
Manter tudo acima e **acrescentar**:
```css
:root {
  /* derivados do tema: seguem a cor escolhida no painel */
  --primary-lift: color-mix(in srgb, var(--primary) 88%, #fff);
  --primary-deep: color-mix(in srgb, var(--primary) 82%, #000);
  --primary-gradient: linear-gradient(180deg, var(--primary-lift) 0%, var(--primary) 100%);
  --primary-glow: color-mix(in srgb, var(--primary) 38%, transparent);

  /* apoio */
  --green-deep: #15331c;
  --green-soft: #edf5ef;
  --ink-secondary: #4d5c52;

  /* contorno e profundidade */
  --stroke: 1px solid rgba(22, 51, 0, 0.08);
  --shadow-sm: 0 1px 3px rgba(22, 51, 0, 0.05), 0 1px 2px rgba(22, 51, 0, 0.03);
  --shadow-card: 0 2px 6px -1px rgba(0, 0, 0, 0.04), 0 8px 16px -4px rgba(22, 51, 0, 0.05);
  --shadow-card-hover: 0 8px 24px -6px rgba(22, 51, 0, 0.1);
  --shadow-button: 0 4px 14px var(--primary-glow);
  --shadow-float: 0 12px 28px -4px var(--primary-glow), 0 4px 8px -2px rgba(0, 0, 0, 0.08);

  /* forma */
  --radius-sm: 9px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
}
```
Observações:
- `color-mix` tem suporte nos navegadores atuais (Safari 16.2+, Chrome 111+). O projeto já o usa em `.header-cart:hover`.
- O gradiente termina em `var(--primary)`: o texto sobre ele mantém o contraste validado pelo domínio (≥ 4,5:1) no ponto mais escuro, e fica igual ou melhor no ponto mais claro (só vale para texto escuro; se o responsável optar por D2 com branco, o topo deve ser igual à base).
- **`--page`:** não alterar o `:root` para `#f6f7f4`. O hook sobrescreve `--page` com `catalog.theme.background`. Se a mudança for desejada, alterar `theme.background` em `src/data.ts:430` **e** conferir `supabase/migrations/202611200001_initial.sql` e o catálogo salvo. O guia §2 registra `#FAFAF7` como fundo claro oficial do tema. Recomendação: manter `#FAFAF7` e criar separação com contorno e sombra.

### Arquivo: `src/shared/styles/useTheme.ts`
Nenhuma alteração obrigatória. O hook continua válido porque as novas variáveis derivam de `--primary`. Só incluir teste manual (Fase 12).

---

## Fase 2: Botões e CTAs

### Arquivo: `src/styles.css` (linhas 150 a 190)

#### Antes (real)
```css
.button { /* … */ border-radius: 12px; font-weight: 800; border: 1px solid transparent;
  transition: transform .18s, box-shadow .18s, background .18s; }
.button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 15px #26382610; }
.primary { background: var(--primary); color: var(--primary-text); }
.secondary { background: var(--surface); border-color: var(--line); }
.whatsapp { background: #245e3c; color: #fff; }
```

#### Depois
```css
.primary {
  background: var(--primary-gradient);
  color: var(--primary-text);
  border-color: color-mix(in srgb, var(--primary) 70%, #000);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), var(--shadow-button);
}
.primary:hover:not(:disabled) {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.34),
    0 6px 18px var(--primary-glow);
}
.primary:active:not(:disabled) {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.18);
}
.secondary {
  box-shadow: var(--shadow-sm);
}
.secondary:hover:not(:disabled) {
  background: var(--green-soft);
  border-color: color-mix(in srgb, var(--green) 25%, transparent);
}
.whatsapp {
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), var(--shadow-sm);
}
```
Notas:
- O `:hover` com `translateY(-1px)` e o `:active` com `scale(.97)` já existem; não duplicar.
- `.button.primary.whatsapp` (CartDialog, linha 216) usa as duas classes: `.whatsapp` vem depois de `.primary` no arquivo e continua verde. Manter essa ordem e conferir visualmente.
- **[D2]** Se o responsável aprovar botões com rótulo branco, criar `.primary { background: linear-gradient(180deg, #C1440E, #A93A0B); color: #fff; }` e ajustar o padrão de `primaryText` em `data.ts`. Sem isso, não usar branco.
- Estado `:disabled` já reduz opacidade (linha 37); conferir que o brilho interno não destoa.

---

## Fase 3: Cabeçalho

### Arquivos: `src/styles.css` (linha 301) e, se quiser o acento no nome, `Menu.tsx:212`

#### Antes (real)
```css
.site-header { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 8px;
  padding: 14px …; background: var(--primary); color: var(--primary-text); }
.header-cart { display: flex; align-items: center; gap: 6px; min-height: 44px; padding: 6px 10px;
  border: 1px solid currentColor; border-radius: 10px; font-size: .875rem; font-weight: 900; }
.header-cart b { font-size: .78rem; font-variant-numeric: tabular-nums; }
```

#### Depois **[D1 padrão: cabeçalho laranja]**
```css
.site-header {
  background: var(--primary-gradient);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 70%, #000);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 2px 10px rgba(22, 51, 0, 0.08);
}
.site-header h1 { font-weight: 800; letter-spacing: -0.02em; }
.site-header .brand img {
  border: 2px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.header-cart {
  border-radius: var(--radius-pill);
  padding: 6px 14px;
  background: color-mix(in srgb, var(--primary-text) 8%, transparent);
}
.header-cart b {
  display: inline-grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: var(--primary-text);
  color: var(--primary);
}
```
- O contraste do número no selo é o mesmo do par validado `primary`/`primaryText`, apenas invertido.
- **Header fixo (opcional, comportamento novo):** a v1 dizia que já era sticky; não é. Se desejado, `position: sticky; top: 0; z-index: 25;`. Atenção: `html { scroll-padding-top: 90px }` e `.category-section { scroll-margin-top: 95px }` já compensam ~90 px; um header sticky de ~80 px com a barra de categorias exige conferir a rolagem por âncora e o `.skip-link` (z-index 6). Só ativar se aprovado, porque o guia pede cuidado para não consumir a primeira tela.
- **[D1 alternativa]** Header claro: `background: rgba(255,255,255,.94); backdrop-filter: blur(12px); color: var(--ink)`, título em `var(--green-deep)`. Nesse caso, criar um bloco laranja de marca logo abaixo (a abertura compacta) para manter o teste de reconhecimento do guia §3.
- O logotipo permanece o arquivo atual (`/media/logo.webp`); não redesenhar (guia §4).

---

## Fase 4: Destaque da vitrine (hero)

### Arquivos: `src/styles.css` (linha 374) e `src/features/catalog/ProductViews.tsx` (linha 81)

#### Antes (real)
```css
.featured-product { display: grid; grid-template-columns: minmax(56px, min(25%, 104px)) minmax(0,1fr);
  align-items: center; gap: 12px; padding: 10px; margin-bottom: 12px;
  border: 1px solid var(--line); border-inline-start: 4px solid var(--primary);
  border-radius: 14px; background: var(--surface); }
```

#### Depois
```css
.featured-product {
  border: var(--stroke);
  border-radius: 18px;
  box-shadow: var(--shadow-card);
  padding: 12px;
}
.featured-photo { border-radius: var(--radius-md); }
.featured-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  margin-bottom: 6px;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--primary) 12%, #fff);
  color: color-mix(in srgb, var(--primary) 55%, #000);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  font-size: 0.75rem;
  font-weight: 800;
}
```
Em `ProductViews.tsx`, dentro de `.featured-details`, antes do `<h2>`:
```tsx
<span className="featured-tag">Destaque da casa</span>
```
- **Rótulo:** não usar "Mais pedido da semana". Não há dado de vendas por produto que sustente isso; o destaque é uma escolha da Laís. Se ela quiser esse texto, ele precisa vir de um campo do catálogo (mudança de contrato, fora deste plano).
- Conferir o contraste do `.featured-tag` com o tema padrão: laranja 55% + preto sobre laranja 12% + branco deve passar de 4,5:1; recalcular se o tema mudar (o domínio não valida esse par).
- Em telas de 667 px (iPhone SE), o destaque não pode empurrar a busca para fora da primeira dobra (item da auditoria UX). O `padding` novo soma 4 px; compensar com `.featured-details p { display: -webkit-box; -webkit-line-clamp: 1 }` se necessário.

---

## Fase 5: Cartões de produto

### Arquivo: `src/styles.css` (linhas 544, 591, 602, 659, 710, 721, 1376, 1476, 1711)

#### Antes (real)
```css
.product-card { display: grid; grid-template-columns: 76px minmax(0,1fr); align-items: start; gap: 12px;
  padding: 12px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); }
.product-badge { color: var(--green); font-size: .75rem; font-weight: 800; }
.category-section .product-card { border-color: transparent; }
```

#### Depois
```css
.product-card {
  grid-template-columns: 88px minmax(0, 1fr);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.product-photo,
.detail-photo { border: 1px solid rgba(0, 0, 0, 0.05); }
.category-section .product-card { border-color: rgba(22, 51, 0, 0.08); }
@media (hover: hover) {
  .product-card:hover { box-shadow: var(--shadow-card-hover); border-color: rgba(22, 51, 0, 0.14); }
}
.product-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  background: var(--green-soft);
  color: var(--green);
}
```
Passos obrigatórios (a v1 omitiu):
1. Procurar **todas** as ocorrências de `76px` ligadas ao cartão e às regras `@media` das linhas 544, 1376, 1476 e 1711 que redefinem `.product-photo`; atualizar para 88 px juntas. A linha 942 já usa `88px` para outra estrutura (provável miniatura da sacola); não confundir.
2. **Não** trocar `object-fit: contain` por `cover` sem decisão: hoje a foto é centralizada sobre `--page`. O guia pede proporção consistente e não pede recorte. Testar com as fotos reais de `public/media` antes de decidir.
3. O `:hover` com `translateY(-2px)` da v1 foi retirado: em telas de toque causa "hover preso". Usar `@media (hover: hover)`.
4. Em 390 px, 88 px de foto deixa ~214 px para o texto. Conferir nomes longos e o botão "Escolher" (44 px de altura) sem quebra.
5. `.sold-out .product-photo img { filter: grayscale(.7) }` e `.out-badge` permanecem.
6. O contorno `rgba(22,51,0,.08)` sobre `--section-bg` colorido por categoria precisa ser visto em todas as categorias; as cores de categoria são editáveis e validadas por contraste de texto, não de borda.

---

## Fase 6: Sacola flutuante

### Arquivo: `src/styles.css` (linhas 800 a 830 e 1526 a 1535)

#### Antes (real)
```css
.floating-cart { position: fixed; bottom: calc(22px + env(safe-area-inset-bottom)); left: 50%;
  transform: translateX(-50%); width: 440px; max-width: calc(100% - 32px); z-index: 8; }
.floating-cart > button { display: flex; align-items: center; gap: 15px; justify-content: space-between;
  width: 100%; background: var(--primary); color: var(--primary-text); padding: 15px 20px;
  border-radius: 14px; box-shadow: 0 7px 25px #0d381a38; font-size: .87rem; }
.floating-count { display: flex; align-items: center; gap: 8px; border-right: 1px solid currentColor; padding-right: 15px; }
```
Ou seja, **ela já é uma barra flutuante** com margem e `safe-area`; a v1 a tratava como barra colada.

#### Depois
```css
.floating-cart > button {
  min-height: 54px;
  border-radius: var(--radius-pill);
  background: var(--primary-gradient);
  border: 1px solid color-mix(in srgb, var(--primary) 70%, #000);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), var(--shadow-float);
  font-weight: 800;
  font-size: 0.95rem;
  padding: 0.6rem 1.25rem;
}
.floating-cart > button:active { transform: scale(0.97); }
.floating-count {
  border-right: 0;
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--primary-text) 14%, transparent);
  font-weight: 800;
}
```
Conferir:
- `.storefront.has-cart { padding-bottom: calc(84px + env(safe-area-inset-bottom)) }` precisa cobrir 54 px de botão + 22 px de margem; subir para ~92 px se o rodapé ficar coberto.
- O `.toast` fica em `bottom: 100px; z-index: 30`: a sacola (z 8) não colide, mas o toast não pode cobrir o botão com 54 px; testar adição de item com a sacola visível.
- A regra `@media (pointer: coarse)` que esconde a sacola enquanto um campo tem foco continua válida.
- Bloco de `@media` na linha 1526 redefine `.floating-cart` em telas pequenas; revisar para não reintroduzir `border-radius: 14px`.
- Não é necessário o wrapper transparente com `pointer-events: none` da v1.

---

## Fase 7: Busca e categorias

### Arquivo: `src/styles.css` (linhas 434 a 520)

#### Antes (real)
```css
.category-nav button { min-height: 44px; border: 1px solid var(--line); border-radius: 9px;
  padding: 8px 14px; background: var(--surface); font-size: .875rem; font-weight: 800; }
.category-nav button:hover { border-color: var(--ink); }
.category-nav button.active { background: var(--primary); color: var(--primary-text); border-color: currentColor; }
```

#### Depois **[D3 padrão: laranja]**
```css
.category-nav button {
  border-radius: var(--radius-pill);
  border-color: rgba(22, 51, 0, 0.1);
  color: var(--ink-secondary);
  box-shadow: var(--shadow-sm);
}
.category-nav button:hover { border-color: var(--green); color: var(--green-deep); }
.category-nav button.active {
  background: var(--primary-gradient);
  color: var(--primary-text);
  border-color: color-mix(in srgb, var(--primary) 70%, #000);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 3px 10px var(--primary-glow);
  font-weight: 900;
}
```
- A seleção hoje é só cor. O guia pede estado programático: conferir se o botão ativo tem `aria-pressed` ou `aria-current` em `Menu.tsx` (linhas 273 a 290). Se não tiver, acrescentar.
- Máscara de rolagem (item da auditoria UX): `mask-image: linear-gradient(90deg, #000 90%, transparent)` em `.category-nav` no mobile.
- **Busca (`.search-box`):** manter o campo claro; acrescentar `box-shadow: var(--shadow-sm)` e, no `:focus-within`, `border-color: var(--primary)` com anel `0 0 0 3px var(--primary-glow)`. Ler o bloco atual antes de editar (linhas 434 a 475), pois há botão de limpar e ícone posicionados.
- **[D3 alternativa]** Ativa em `var(--green-deep)` com `#fff`.

---

## Fase 8: Rodapé institucional

### Arquivos: `src/styles.css` (linha 745) e `src/features/catalog/Menu.tsx` (linha 370)

#### Antes (real)
`footer-top` em grade `1.1fr 1fr 0.5fr` com marca, horário/endereço e contatos; `footer-bottom` com direitos e links. Não há selos.

#### Depois
Marcação nova, **antes** de `.footer-top`, apenas com textos aprovados (D4):
```tsx
<ul className="trust-badges">
  <li><Leaf size={20} aria-hidden="true" /><span><strong>Comida saudável</strong>Para uma vida leve</span></li>
  {/* demais selos somente após confirmação da Laís */}
</ul>
```
A frase "Comida saudável para uma vida leve" consta no material de marca (guia §4), então é segura. Os selos "Ingredientes 100% selecionados", "Preparo artesanal e fresco" e "Entrega ágil em Caruaru" ficam **pendentes de aprovação** (a loja informa entrega e retirada, mas não há prazo prometido nas respostas).
```css
.trust-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 0 0 28px;
  padding: 0 0 24px;
  list-style: none;
  border-bottom: 1px solid var(--line);
}
.trust-badges li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface);
  border: var(--stroke);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  color: var(--green);
}
.trust-badges strong { display: block; font-size: 0.88rem; color: var(--green-deep); }
.trust-badges span { font-size: 0.78rem; color: var(--muted); }
```
- O horário de atendimento já aparece em `StoreHours`; não duplicar em outro cartão.
- Botões de contato em pílula: `.footer-social a` ganha `min-height: 44px; padding: 8px 14px; border-radius: var(--radius-pill); border: var(--stroke)`. Manter o WhatsApp com ícone verde sem pintar o fluxo todo de verde (guia §5).
- Existe regra duplicada de `.footer-social`/`.footer-bottom` nas linhas 764 a 800 e 1639 a 1665; editar o bloco que realmente vence (o último) para evitar conflito.
- `.footer-bottom` usa `font-size: .65rem`, abaixo de uma leitura confortável. Subir para `.75rem`.

---

## Fase 9: Ficha de produto, sacola e revisão (modais)

### Arquivos: `src/features/catalog/ProductViews.tsx`, `src/features/cart/CartDialog.tsx`, `src/styles.css` (linhas 920 a 1270)

A v1 citava este item sem instruções. Escopo:

1. **Botão "Adicionar" da ficha e "Revisar itens e preços" / "Abrir WhatsApp" da sacola** (`CartDialog.tsx:216`, `:246`): herdam o novo `.primary` da Fase 2. Conferir `.purchase-row > .button` (linha 1136) e `.modal-footer` para que a sombra colorida não seja cortada por `overflow` do rodapé.
2. **Seletor de porções:** o diagnóstico fala em "salmão e laranja misturados". Localizar a regra real (procurar por `.fulfillment-options`, `.portion` e `[aria-checked]` em `styles.css` e em `ProductViews.tsx`) e padronizar: opção selecionada com contorno laranja e fundo `color-mix(in srgb, var(--primary) 10%, #fff)`, não depender só da cor (marca de seleção ou peso).
3. **Cabeçalho do modal** (`.modal-header`, linha 922): manter continuidade do laranja no título ou no resumo (guia §5), sem criar bloco alto.
4. **Total** (`.cart-total`): `font-variant-numeric: tabular-nums` e peso 900, já parcialmente existente.
5. **Foco e Escape:** `Modal.tsx` já trata; não alterar.
6. Não alterar mensagem do WhatsApp nem regras de preço (domínio e testes).

---

## Fase 10: Tipografia

### Arquivo: `src/styles.css`

- Manter Nunito Sans (guia §4). Reduzir apenas o excesso de peso: `.product-title` de 900 para 800; `.site-header h1` já passa para 800 na Fase 3.
- `h1, h2, h3` já têm `letter-spacing: -0.035em`. O diagnóstico pede `-0.015em`; `-0.035em` é agressivo em corpo de 1rem. Testar `-0.02em` em `.product-title` e `.featured-details h2`.
- Preços: `tabular-nums` já aplicado.
- Texto de apoio: `.product-copy > p` com `color: var(--muted)` (`#687169`, 4,83:1 sobre `#FAFAF7`). **Não** usar o `#6b776e` da v1: dá 4,35:1 sobre `#F6F7F4` e reprova. Se precisar de mais leitura, usar `--ink-secondary` (`#4d5c52`).

---

## Fase 11: Painel administrativo

### Arquivo: `src/features/admin/admin.css` (carregado separadamente)

- Os novos tokens vivem em `styles.css`; conferir se o painel os recebe (ele compartilha `:root`?). Se `admin.css` for carregado em contexto isolado, **não** assumir `--primary-gradient` lá.
- `.button.primary` é compartilhado: o painel herdará gradiente e sombra. O guia §5 pede neutro nas tabelas e formulários com ação prioritária laranja; verificar tabelas, o editor de aparência e a prévia (`CatalogPreview`).
- A prévia do rascunho usa `.preview-store`; capturar com o tema alterado.
- Escopo do painel além do herdado fica fora deste plano.

---

## Fase 12: Tema dinâmico e acessibilidade (a verificação que a v1 não tinha)

1. **Tema padrão:** inalterado em `data.ts` (`#EA5A1C`/`#28150D`). Rodar os testes de domínio que validam contraste.
2. **Tema personalizado:** no painel, trocar a cor primária para um tom claro e outro escuro e conferir botões, cabeçalho, selo do carrinho e categoria ativa. O texto não pode ficar ilegível (o domínio exige 4,5:1 no par primário/texto).
3. **Restauração de aparência:** restaurar o tema e conferir que as variáveis derivadas voltam.
4. **Contraste:** recalcular os pares novos (`.featured-tag`, `.product-badge`, texto de selos) e registrar na tabela da seção 4.
5. **Teclado e foco:** percorrer cabeçalho, busca, categorias, cartão, ficha, sacola; o anel de 3 px deve aparecer sobre os fundos novos.
6. **Movimento reduzido:** emular `prefers-reduced-motion: reduce` e conferir que `translateY`, `scale` e transições curtas não bloqueiam o uso.
7. **Zoom 200%** e rolagem horizontal indevida em 390 px.
8. **Capturas "depois"** nos mesmos estados do "antes" (Fase 0).

---

## 4. Verificação, critérios de aceite e registro

### 4.1 Comandos
- `npm.cmd test`: todos os testes passando (comparar com a linha de base da Fase 0; não usar total fixo).
- `npm.cmd run build`: sem erros de TypeScript ou Vite.
- Se houver mudança em `Menu.tsx` ou `ProductViews.tsx`, conferir que nenhum teste de domínio depende de texto de interface.

### 4.2 Critérios (alinhados ao guia §8)
- [ ] Laranja principal continua como superfície relevante na primeira tela, com domínio sobre o verde.
- [ ] Nenhum texto branco pequeno sobre `#EA5A1C`; branco só sobre `#C1440E` ou mais escuro.
- [ ] Botões primários com contorno, brilho superior e sombra colorida derivada do tema.
- [ ] Hero sem faixa lateral de alerta; rótulo neutro, sem promessa de "mais pedido".
- [ ] Cartões com contorno e sombra visíveis sobre todas as cores de categoria; foto de 88 px sem desalinhar em 390, 393 e 1366.
- [ ] Sacola flutuante em pílula, sem cobrir conteúdo, rodapé nem toast.
- [ ] Categoria selecionada identificável sem depender só da cor.
- [ ] Selos do rodapé só com textos aprovados.
- [ ] Tema personalizado, prévia e restauração conferidos.
- [ ] Teclado, foco, zoom, toque e movimento reduzido conferidos.
- [ ] Capturas antes/depois em `artifacts/etapa-08-acabamento/`.

### 4.3 Tabela de contraste (calculada)

| Par | Contraste | Uso |
|---|---|---|
| `#28150D` / `#EA5A1C` | 4,97:1 | Padrão de botões e cabeçalho |
| `#FFFFFF` / `#EA5A1C` | 3,51:1 | **Reprova** em texto pequeno e no validador |
| `#FFFFFF` / `#F06423` | 3,21:1 | Reprova |
| `#FFFFFF` / `#D94E0F` | 4,16:1 | Reprova |
| `#FFFFFF` / `#C44710` | 4,93:1 | Passa |
| `#FFFFFF` / `#C1440E` | 5,12:1 | Passa (guia §6) |
| `#28150D` / `#F06423` | 5,45:1 | Passa (topo do gradiente) |
| `#FFFFFF` / `#15331C` | 13,8:1 | Passa |
| `#687169` / `#FAFAF7` | 4,83:1 | Passa (texto de apoio atual) |
| `#6B776E` / `#F6F7F4` | 4,35:1 | **Reprova** (valor proposto na v1) |
| `#245E3C` / `#EAF3ED` | 6,76:1 | Passa (badge verde) |

### 4.4 Registro e documentação
- Atualizar `Docs/codex-setup.md` (seção de retomada) e `Docs/Planejamento/arquitetura-de-software-lais-fit-ja.md` com a etapa, as capturas e os comandos executados.
- Se D1, D2 ou D3 forem alterados, atualizar `identidade-visual-fit-ja.md` (§3, §5, §6) **antes** de codificar.
- Corrigir no diagnóstico os trechos que descrevem o código de forma imprecisa (header sticky, sacola "colada", `border-color: transparent` como causa única) para não reintroduzir os erros.

### 4.5 Ordem de execução e reversão
`Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12`, com um commit por fase (`feat(ui): …`) e captura por fase. Cada fase é reversível com `git revert`. Fases 8 (selos) e 3 (sticky) dependem de aprovação e podem ser puladas sem afetar as demais.
