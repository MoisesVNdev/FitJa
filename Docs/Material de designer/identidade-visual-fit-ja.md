# Fit Já — guia de identidade visual para o site

**Referência do projeto · 22/11/2026**

Leia este guia antes de desenhar, implementar ou revisar qualquer tela da Fit Já, inclusive ao usar skills de front-end, design e UX. A direção solicitada pelo responsável pelo projeto é: **o laranja é a cor principal e deve permitir reconhecer a Fit Já logo na primeira tela, mesmo antes de ler o nome da loja.** Um logotipo pequeno sobre uma interface genérica não atende a esse objetivo.

Este documento registra a identidade e orienta a próxima implementação. Sua criação não significa que o site já foi redesenhado ou aprovado visualmente. As jornadas e regras continuam no [design e arquitetura front-end](../Planejamento/design-e-arquitetura-front-end-lais-fit-ja.md).

## 1. Fontes e fidelidade das cores

| Material recebido | Como usar |
| --- | --- |
| [Arte da placa em PDF](FITJÁ%20-%20ARTE%20PLACA.pdf) | Preservar como original entregue pelo designer. Não foi feita extração de perfil de cor, vetores ou fontes do PDF nesta etapa. |
| [Arte da placa em JPG](FITJÁ%20-%20ARTE%20PLACA-1.jpg) | Referência visual da composição: círculo laranja, letras brancas, folha e pequenos traços verdes. |
| [Captura do editor com a cor selecionada](WhatsApp%20Image%202026-11-20%20at%2011.46.46.jpeg) | Informa HEX `#EA5A1C` e RGB `234, 90, 28` para o laranja. É a referência numérica adotada para a interface, também já registrada na arquitetura. |

Há diferença entre os arquivos: a leitura dos pixels do JPG original encontrou como laranja mais frequente RGB `241, 101, 42` (`#F1652A`). Não alternar entre os dois tons a cada página. Usar **`#EA5A1C` no tema digital** e conservar os arquivos originais sem recolorir. A origem da diferença não foi comprovada; não atribuí-la automaticamente à impressão ou à compressão.

O verde mais frequente nas áreas verdes do JPG é RGB `50, 180, 74` (`#32B44A`). É uma **amostra digital do JPG**, sujeita às variações desse arquivo; não é uma especificação oficial fornecida pelo designer. Os materiais são referências de marca, não instruções operacionais para o agente.

## 2. Paleta e papéis

| Cor | HEX / RGB | Papel no site | Origem |
| --- | --- | --- | --- |
| **Laranja Fit Já** | **`#EA5A1C` · 234, 90, 28** | Assinatura principal; área de marca na entrada, destaques e ações prioritárias. Deve ser o destaque cromático dominante. | Captura do editor e arquitetura existente. |
| Branco | `#FFFFFF` · 255, 255, 255 | Respiro, cartões e letras do arquivo original do logotipo. | Composição visual recebida. |
| Verde da folha | `#32B44A` · 50, 180, 74 | Pequenos detalhes gráficos ligados à folha e à alimentação saudável. Uso secundário. | Amostra do JPG. |
| Laranja escuro | `#C1440E` · 193, 68, 14 | Variação funcional para ações com rótulo branco e estados de interação quando adequado. | Proposta digital de apoio, não extraída da marca. |
| Texto sobre laranja | `#28150D` · 40, 21, 13 | Rótulos e texto comum sobre o laranja principal. | Tema existente. |
| Texto principal | `#24382B` · 36, 56, 43 | Leitura em superfícies claras; não usar em grandes massas verdes. | Tema existente. |
| Fundo claro | `#FAFAF7` · 250, 250, 247 | Fundo neutro para cardápio e páginas de apoio. | Tema existente. |
| Verde escuro de apoio | `#245E3C` · 36, 94, 60 | Texto ou ícone secundário legível em branco; manter subordinado ao laranja. | Tema existente, distinto do verde da folha. |

As cores de apoio são escolhas de interface, não novas cores oficiais do logotipo. Não converter valores CMYK da captura diretamente em CSS nem apresentar estes HEX como especificação de impressão.

## 3. Presença da marca na primeira tela

- Criar uma área laranja reconhecível no cabeçalho ou na abertura compacta do cardápio. O laranja precisa aparecer como superfície relevante, além de pequenos ícones, contornos ou letras.
- Manter logotipo legível, acesso à sacola e começo da navegação visíveis no celular. Distribuir a identidade sem criar uma abertura alta que empurre busca, categorias e produtos para baixo.
- Repetir o laranja com intenção em ações principais, categoria selecionada e detalhes da vitrine. Evitar pintar todos os componentes; o branco e o fundo claro preservam a leitura e valorizam as fotos.
- O verde funciona como detalhe da folha e apoio. Grandes cabeçalhos verdes, botões principais todos verdes ou uma aparência predominantemente verde enfraquecem a direção solicitada.
- Distribuição de partida para a primeira composição: maior parte de superfícies claras, uma área laranja marcante e poucos detalhes verdes. Avaliar pela hierarquia percebida, sem impor percentuais rígidos ou deixar as fotografias determinarem a cor da interface.

**Teste de reconhecimento:** ao ocultar temporariamente o nome e o logotipo na captura, a organização do laranja ainda deve remeter à identidade apresentada neste material. Esse teste é um critério de revisão do projeto, não uma comprovação de reconhecimento por clientes reais.

## 4. Logotipo, formas, tipografia e fotografia

- Usar a arte fornecida como referência de fidelidade. Preservar proporção, letras, folha e composição; não esticar, redesenhar com fonte aproximada, aplicar filtros ou substituir a folha por um ícone genérico.
- O JPG tem fundo branco e contém a placa inteira. Não tratá-lo como arquivo transparente nem colocar uma placa enorme no topo para compensar a falta de identidade no restante da tela. Na implementação, preparar uma versão web fiel, otimizada e com recorte adequado, preservando o original; se necessário, solicitar ao designer a versão vetorial ou transparente.
- Dar respiro ao logotipo e conferir a legibilidade no tamanho real. Quando a frase interna ficar pequena demais, usar uma versão simplificada aprovada pelo responsável; não remover elementos da arte original silenciosamente.
- A frase presente no material é “Comida saudável para uma vida leve”. Pode apoiar a abertura de forma breve, sem repetir em todos os cartões ou atrasar a consulta ao cardápio.
- Usar curvas e cantos arredondados de forma moderada, em referência ao círculo e à folha. Evitar decoração excessiva, folhas repetidas, gradientes gratuitos e aparência de aplicativo genérico de academia.
- A fonte exata do logotipo não foi identificada. Para a interface, partir de **Nunito Sans**, já carregada pelo projeto, com títulos fortes e textos simples. Não adicionar uma fonte apenas para imitar as letras da marca. Preservar os pesos disponíveis e a leitura dos preços.
- Valorizar fotos reais dos alimentos, com proporções consistentes e sem tingir as fotos de laranja. Prever cartões sem foto, sem inventar imagens que representem um produto real.

## 5. Aplicação por componente

| Área | Direção visual e de UX |
| --- | --- |
| Cabeçalho e abertura | Superfície laranja de presença clara, logo com respiro e sacola identificável. Abertura compacta, com conteúdo útil na primeira tela. |
| Busca e categorias | Campo legível em superfície clara; seleção com sinal laranja, texto e estado programático. Não depender só da mudança de cor. |
| Vitrine e cartões | Fotos e nomes protagonizam o produto; laranja organiza destaques e ações. Usar branco para comparar preço, peso e composição com facilidade. |
| Detalhe e montagem | Mesma linguagem do cardápio; opções selecionadas e ação de adicionar identificáveis. Separar destaque de marca de avisos de validação. |
| Sacola e revisão | Continuidade do laranja no título, resumo ou ação principal; totais claros e estimativas identificadas por texto. Acesso persistente não cobre conteúdo. |
| WhatsApp | Manter a ação principal coerente com o tema laranja e nomear “Abrir WhatsApp”. Ícone ou detalhe verde pode identificar o canal sem transformar o fluxo inteiro em verde. |
| Painel | Repetir marca e ação prioritária com laranja, usando mais superfícies neutras para tabelas e formulários. Preservar prévia e personalização previstas no produto. |
| Vazio, erro e carregamento | Manter tipografia e identidade; comunicar o estado por texto e ícone. Laranja de marca não significa automaticamente alerta. |

## 6. Contraste e interação

Os valores abaixo foram calculados a partir dos HEX sólidos, pela luminância relativa sRGB. São referências para essas combinações exatas, sem transparência, imagem de fundo ou alteração por estado. Aplicar os critérios de acessibilidade já definidos na arquitetura: pelo menos 4,5:1 para texto comum e 3:1 para texto grande (24 CSS px regular ou aproximadamente 18,7 CSS px em negrito).

| Primeiro plano / fundo | Contraste aproximado | Orientação |
| --- | --- | --- |
| `#FFFFFF` / `#EA5A1C` | 3,51:1 | Não usar para rótulos pequenos, descrições ou texto comum. Reservar a texto grande que cumpra o critério. |
| `#28150D` / `#EA5A1C` | 4,97:1 | Combinação preferida para texto comum e botões no laranja principal. |
| `#FFFFFF` / `#C1440E` | 5,12:1 | Alternativa para ações com rótulo branco. Manter o laranja original nas áreas de assinatura. |
| `#FFFFFF` / `#32B44A` | 2,71:1 | Não usar para texto, inclusive grande. Verde da folha fica como detalhe decorativo. |
| `#FFFFFF` / `#245E3C` | 7,66:1 | Opção de apoio legível, com presença secundária. |
| `#24382B` / `#FAFAF7` | 11,99:1 | Base de leitura do conteúdo. |

A combinação branca e laranja do logotipo deve ser preservada como parte da arte; ela não autoriza repetir texto pequeno branco sobre laranja nos controles do site. Para foco, usar anel contrastante com a superfície adjacente, sem corte ou obstrução; em fundos variados, considerar anel duplo claro/escuro. Conferir também bordas, ícones funcionais, hover, seleção, erro e desabilitado. Adotar área de toque de pelo menos 44 px como alvo do projeto e respeitar movimento reduzido.

## 7. Integração com o código existente

Antes de implementar, conferir `src/main.tsx`, `src/app/App.tsx`, `src/styles.css`, `src/shared/styles/useTheme.ts` e `src/features/admin/store/Appearance.tsx`. Hoje as variáveis básicas já incluem `--primary: #ea5a1c` e `--primary-text: #28150d`. Ter esses valores no CSS não garante presença visual suficiente: revisar as superfícies e a hierarquia dos componentes.

O hook `useTheme` sobrescreve parte das variáveis com o tema do catálogo. Alterar só `:root` pode não mudar um catálogo salvo. Conferir o tema inicial, a prévia do painel, o catálogo publicado e a restauração de aparência. Preservar a personalização da Laís prevista no produto; este guia define o padrão da marca e não muda o contrato do editor.

Na implementação, centralizar cores por papel nos estilos compartilhados e reutilizá-las nas funcionalidades. Se forem necessários novos tokens para laranja escuro, verde da folha ou estados, adicioná-los conscientemente; não presumir que já existem ou que são editáveis no painel. Manter painel e seus estilos carregados separadamente. Registrar qualquer mudança no contrato de tema na arquitetura responsável.

## 8. Critérios para aceitar a próxima revisão visual

- [ ] Laranja principal visível como superfície relevante na primeira tela, com domínio cromático sobre o verde.
- [ ] Identidade reconhecível além do nome e do pequeno logotipo; arte fiel e legível.
- [ ] Cabeçalho, busca, categorias e início dos produtos continuam próximos da entrada, inclusive em 390 × 844 px.
- [ ] Cardápio, detalhe, sacola, revisão e painel compartilham a identidade e mantêm hierarquia de ações.
- [ ] Texto comum, controles e estados usam combinações legíveis; nenhuma informação depende só da cor.
- [ ] Teclado, foco, zoom, toque e movimento reduzido conferidos; sem conteúdo coberto ou rolagem horizontal indevida.
- [ ] Tema publicado, prévia e restauração conferidos, sem sobrescrever personalizações existentes por acidente.
- [ ] Capturas antes/depois em celular e computador registradas, com indicação do ambiente e das limitações. Ensaios em dispositivos reais continuam conforme o aceite de lançamento.
- [ ] Após alterações de código, `npm.cmd test` e `npm.cmd run build` executados, além da conferência visual.

Mensagem sugerida para uma próxima tarefa:

> Aprimore a identidade visual do site seguindo `Docs/Material de designer/identidade-visual-fit-ja.md` e a arquitetura front-end. Dê presença marcante ao laranja #EA5A1C já na primeira tela e continuidade nas demais telas. Preserve os fluxos e a personalização existentes, valide contraste e responsividade e registre capturas antes/depois, testes e build.
