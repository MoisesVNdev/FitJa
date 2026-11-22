# Laís Fit Já — design e arquitetura front-end

**Versão 0.4 · 22 de novembro de 2026 · Escolha técnica para aprovação**

Este documento descreve o cardápio público, a área da Laís e a comunicação com o cliente, desde a primeira tela até a confirmação pelo WhatsApp. Consolida as respostas do dia 22 de novembro e as decisões anteriores de design. As propostas e os pontos a confirmar aparecem como tais. [Respostas da Laís](../respostas-lais-fit-ja.md) · [Parecer de design](01-parecer-design-front-end.md) · [Planejamento funcional v0.1](planejamento-funcional-lais-fit-ja-v0.1.md)

O site permite consultar produtos e preparar uma solicitação sem cadastro. Laís confirma o pedido inteiro pelo WhatsApp, incluindo os itens que consegue atender, o preço final, o pagamento e o prazo. O painel dá apoio à operação e ao registro das vendas. Pagamento no site e estoque por quantidade ficam para uma fase futura.

## Comunicação da loja com o cliente

| Onde aparece | O que comunicar |
| --- | --- |
| Cabeçalho | Nome e logo da Laís Fit Já, acesso à sacola e indicação breve de funcionamento quando aplicável. |
| Começo do cardápio | Pequena vitrine com produtos escolhidos pela Laís. A coxinha fit de batata inglesa, frango desfiado e queijo muçarela é a indicação inicial. Se um destaque esgotar, mostrar outro produto previamente escolhido por ela. |
| Lista e detalhe | Usar linguagem direta para peso, ingredientes, preço, disponibilidade e composição. Manter produtos esgotados na lista normal com o aviso “Esgotado”. |
| Sacola | Mostrar a seleção, os valores e a necessidade de avaliação. Se um preço mudar, mostrar o novo valor e avisar o cliente para revisar. Separar produtos prontos e personalizadas. |
| Aviso de horário | Mostrar os dias e horários cadastrados antes do encaminhamento quando a loja estiver fora do horário ou excepcionalmente fechada. O botão de abrir o WhatsApp permanece disponível. |
| Contatos da loja | WhatsApp comercial **(81) 99696-3174**, Instagram **@laisfitja** e endereço **R. Sanharó, 06, Jardim Boa Vista, Caruaru–PE, CEP 55038-060**, conforme o questionário. |

O WhatsApp recebe o pedido para avaliação. O Instagram serve para contato e divulgação do cardápio. Na revisão da sacola, antes do botão “Abrir WhatsApp”, exibir **Entrega** e **Retirada** como duas opções de toque com seleção única e indicação visível da escolha. Usar controles nativos de formulário estilizados com o CSS da Fit Já, com texto e foco acessíveis. A escolha vai para a mensagem como preferência. Prazo e eventual frete são combinados na conversa.

Textos propostos para revisar na demonstração:

> **Antes de abrir o WhatsApp.** Confira sua lista. Ao abrir a conversa, toque em enviar. Laís vai confirmar os itens, o valor final e o prazo com você.

> **Preço atualizado.** O preço deste item mudou. Confira o novo valor antes de continuar.

> **Fora do horário.** Você pode enviar sua lista agora. Laís pode responder no próximo horário de atendimento. Confira os dias e horários abaixo.

> **Marmita montada por você.** O valor é uma previsão. Laís confirma o que pode preparar e o preço pelo WhatsApp.

## Estrutura e navegação

| Superfície | Conteúdo e comportamento |
| --- | --- |
| Início | Cabeçalho compacto com marca laranja e sacola. Mostrar a vitrine sem empurrar busca, categorias e começo da lista para longe da primeira tela. A comparação entre cartões juntos e faixa manual fica para a revisão visual. |
| Categorias e busca | Abrir em **Marmitas prontas**, com **Lanches** e **Doces** entre os grupos iniciais. Trocar a lista no mesmo espaço e oferecer “Todas as categorias”. A busca cobre todo o cardápio, com filtro opcional por grupo. Aceitar buscas sem acento, identificar a categoria do resultado e recuperar a seleção anterior ao limpar. |
| Lista | Foto quando houver, nome, descrição e preço. A Laís pode publicar um produto sem foto. Usar “A partir de” somente quando corresponder a uma opção disponível. Preservar categoria, busca, rolagem e foco ao voltar do detalhe. |
| Detalhe | Exibir preço, peso, composição e disponibilidade da opção selecionada. Permitir reutilizar conteúdo quando realmente representar as opções. Incluir ampliação da foto, ingredientes e informação nutricional com porção e unidade. Informar quando a ficha da combinação escolhida não estiver disponível. |
| Montagem | Separar “Montar marmita” de “Montar combo”. Exibir regras, limites, escolhas obrigatórias restantes, adicionais e preço estimado antes da inclusão. Permitir editar e duplicar montagens. Oferecer ajuste apenas da escolha que acabou. Validar as combinações por tamanho e a necessidade de observação por marmita. |
| Sacola | Acesso persistente sem cobrir conteúdo, controles ou teclado. Separar produtos prontos de personalizadas com subtotal comum, subtotal estimado e total previsto dos produtos. Linhas identificam composição, quantidade e desconto. Preservar opções e observações válidas na revisão. |
| Revisão e encaminhamento | Informar que Laís avalia o pedido inteiro. Revalidar mudanças de preço ou disponibilidade, destacar as linhas afetadas e pedir nova revisão. Disponibilizar “Abrir WhatsApp” e “Copiar resumo”. Instagram fica nos contatos. |

Na opção com faixa, usar passagem manual com controles visíveis e acesso por teclado. Como proposta, quando faltarem substitutos disponíveis, ocultar aquele espaço sem deixar uma lacuna. Evitar apresentação alta, etiquetas repetidas e movimentos decorativos. [Padrão de carrossel do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)

No computador, ampliar o espaço de leitura e distribuir os cartões em colunas preservando a mesma ordem e as mesmas ações. No celular, considerar recortes da câmera, barras de navegação, teclado, gestos e margens laterais. Manter o catálogo consultável sem cadastro.

## Marca, acessibilidade e desempenho

O [guia de identidade visual Fit Já](../Material%20de%20designer/identidade-visual-fit-ja.md) detalha os materiais do designer, a paleta e a aplicação por componente. Conforme a orientação de 22/11/2026, o laranja deve formar uma área de presença marcante já na primeira tela, mantendo busca, categorias e produtos próximos da entrada. A identidade deve ser percebida além do pequeno logotipo, com continuidade no detalhe, na sacola e no painel. Essa direção orienta o próximo aprimoramento visual; sua documentação não comprova a implementação. O guia distingue o laranja de referência `#EA5A1C` da variação encontrada no JPG e separa cores da marca de cores funcionais de apoio.

O laranja **#EA5A1C** aparece no cabeçalho, nos destaques e nas ações que identificam a marca. O verde entra como detalhe associado à folha do logotipo. Branco sobre o laranja original tem contraste de aproximadamente **3,51:1**. Usar essa combinação para texto grande quando cumprir o critério aplicável. Em texto comum e botões, usar texto escuro ou escurecer o fundo laranja quando a marca pedir letras brancas. Usar rótulos escritos para estados como “Esgotado” e “Sob avaliação”. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Priorizar controles principais com área de toque de pelo menos 44 px como alvo de design. Verificar foco visível e sem obstrução, navegação por teclado, leitor de tela, ampliação e redução de movimento. Usar transições curtas que ajudem a perceber uma mudança de estado.

Usar originais das fotos, reservar proporções para evitar saltos, carregar cedo a imagem principal se ela for relevante à primeira tela e adiar as demais conforme a navegação. Servir tamanhos proporcionais à área exibida e oferecer ampliação e modo econômico. Testar os formatos com as fotos reais antes de fixar tamanho e compressão. [Imagens responsivas no web.dev](https://web.dev/learn/images/responsive-images)

Medir LCP até 2,5 s, INP até 200 ms e CLS até 0,1 como metas de referência no percentil 75 quando houver dados reais suficientes. Antes do lançamento, reproduzir uma primeira visita em rede limitada com fotos representativas e registrar o volume transferido. Definir o orçamento de transferência com esse teste. Manter os recursos do painel fora do caminho crítico do cardápio público. [Core Web Vitals](https://web.dev/articles/vitals)

## Regras comerciais visíveis nas telas

- **Marmita pronta.** Mostrar o peso total, a composição e o preço específico. A porção da proteína é parte do peso total e vem da descrição cadastrada. A disponibilidade final é confirmada na conversa.
- **Personalizada.** Opção experimental que aparece quando Laís a ativa e pode ser pausada independentemente das prontas. O cliente escolhe peso total, proteína, acompanhamentos e extras. A previsão depende dos alimentos e quantidades. Após falar com o cliente, Laís corrige o valor no painel. As regras de quantidade, combinação e preço precisam de um exemplo completo antes da construção.
- **Porção vendida por peso.** Laís define o valor por quilo e as porções vendidas. A tela mostra todos os preços calculados juntos antes de publicar. R$ 50/kg corresponde a R$ 5 para 100 g e R$ 10 para 200 g. Arredondamento permanece pendente para valores com fração de centavo.
- **Faixas de quantidade.** O desconto exige o mesmo sabor e tamanho. Somar unidades avulsas iguais mesmo quando adicionadas em momentos diferentes. Mostrar a faixa aplicada e recalcular ao editar. Avisar Laís quando uma faixa configurada fizer o total cair ao adicionar uma unidade.
- **Combos.** Cada combo usa seu próprio preço e regras. A faixa avulsa considera apenas avulsos. Exibir a composição de kits fixos e as escolhas de kits montáveis. O painel separa receita do combo e quantidades de componentes para produção.
- **Nutrição manual.** Abrir a tabela pelo botão “Ver tabela nutricional”. Mostrar os dados que a Laís conferiu para a porção e a composição selecionadas. Se faltar ficha, indicar que a informação ainda não está disponível. A Laís informou que tem parte das tabelas e pretende usar IA como apoio. Exibir apenas valores conferidos, com ingredientes e avisos sobre alergênicos em campos próprios.

### Exemplos do questionário para conferir a interface

Os valores abaixo servem de referência para o protótipo. **Laís define todos os preços, composições, descontos e combos pelo painel** e revisa o que vai publicar. O sistema calcula apenas o que ela configurar, como porções por quilo ou faixas de desconto.

| Item | Conforme informado pela Laís |
| --- | --- |
| Escondidinho de carne | 300 g por R$ 21,00. |
| Bolo fit de banana | Fatia de 100 g por R$ 5,00. |
| Marmitas prontas | 300 g, frango R$ 16,00 e carne R$ 18,00. 350 g, frango R$ 18,00 e carne R$ 20,00. 400 g, frango R$ 20,00 e carne R$ 22,00. 500 g, R$ 22,00 para ambos conforme a resposta. Laís define os valores que serão publicados. |
| Composição das marmitas | Arroz, feijão e frango ou carne. As opções de 350 g, 400 g e 500 g também incluem legumes conforme o exemplo do questionário. |
| Combo de cinco marmitas | Cinco unidades de 300 g, de R$ 80,00 por R$ 77,60 como exemplo. Sabores e preço serão definidos no painel quando Laís decidir publicar a oferta. |
| Outras ofertas | Marmita de frango 300 g e suco de uva por R$ 24,00. Coxinha fit e refrigerante de garrafinha por R$ 13,00. Sanduíche natural e Coca-Cola em lata por R$ 17,00. |

## Atendimento, horários e gestão

**Horário normal e fechamento excepcional.** Laís cadastra os dias e as faixas de atendimento no painel. Em feriados ou imprevistos, o cliente também pode encaminhar sua lista com um aviso de fechamento. Os horários aparecem no cardápio e antes de abrir o WhatsApp, com a expectativa de resposta no próximo período. Laís pode responder antes a seu critério. Exibir dias como fechados somente quando ela assim os cadastrar.

O painel permite que Laís escolha livremente, para cada dia da semana, se abre ou fecha e quais são os horários de abertura e fechamento. Ela pode cadastrar mais de uma faixa por dia, como manhã e tarde, e alterar os avisos de feriado ou imprevisto. O cardápio consulta essa configuração na hora local de Caruaru. Com a configuração ainda vazia, exibe “Consulte os horários pelo WhatsApp”. Os horários do questionário são exemplos de preenchimento.

Laís quer receber a **lista completa** no WhatsApp, com número da solicitação, produtos prontos, montagens personalizadas, quantidades, escolhas, valores, observações e a preferência por entrega ou retirada. O cliente abre a conversa e toca em enviar. Se voltar ao site sem enviar, pode retomar a sacola e reutilizar o mesmo número quando a seleção continuar igual. Validar dez montagens distintas. Se a mensagem for longa demais para o link, oferecer cópia da lista completa e acesso à conversa. [WhatsApp — mensagem preenchida](https://faq.whatsapp.com/5913398998672934)

Solicitações com envio ainda não verificado aparecem na lista principal com **“Confira se a mensagem chegou”**. A Laís atualiza o pedido desde que começa a conferi-lo. Os estados previstos são **Criado no site**, **Em avaliação**, **Confirmado**, **Concluído** e **Cancelado**. Ela localiza pelo número, registra substituições e atendimento parcial e mantém a lista original e o histórico. Para venda ligada a uma solicitação do site, usar o mesmo número para atualizar o registro existente. Vendas diretas recebem seu próprio número. A proposta é avisar antes de registrar uma venda com número já usado.

| Área do painel | Tarefas e estados |
| --- | --- |
| Operação rápida | Marcar produtos ou sabores como esgotados ou disponíveis, separadamente do rascunho. Permitir pausar personalizadas. |
| Catálogo | Laís escolhe os produtos da lista, duplica o cadastro de marmitas e gerencia fotos, opções, composição, preços, descontos e combos. Café em copo fica fora do catálogo online. Cadastro reservado de café só entra se houver necessidade de acompanhar essas vendas no balcão. |
| Aparência | Desde o primeiro dia, permitir trocar fotos, produtos da vitrine, ordem dos grupos, cores, tipos de letra e apresentação dos produtos. Com prévia no celular antes de publicar ou restaurar cores, ordem e vitrine. A restauração da aparência preserva os avisos atuais de esgotamento. Ajustes mais específicos de cartões e densidade serão definidos no protótipo. |
| Solicitações e vendas diretas | Filtrar pelo número e estado. Registrar origem, itens, quantidades, total, desconto e forma de pagamento informada. Usar o número do pedido do site quando existir. Contar a venda uma vez, pela origem em que começou. |
| Visão geral | Mostrar pedidos que precisam de resposta, pedidos aceitos, vendas concluídas por semana ou mês, produtos mais vendidos, vendas por origem e valor médio por venda. Permitir baixar a lista de vendas. Calcular vendas concluídas e valor médio a partir dos registros concluídos. |
| Loja e acesso | Atualizar contato e horários. Reservar rascunhos e dados de pedidos a usuários autorizados. A Laís indicou Moisés para apoiar a recuperação de acesso. |

## Escolha técnica recomendada

**React + TypeScript + Vite, HTML semântico e CSS responsivo, com a operação concentrada na Cloudflare.** Essa opção aproveita a interface e as regras em TypeScript que já existem no projeto. O Vite empacota a aplicação, o React organiza as telas e o TypeScript ajuda a conferir as regras que alimentam a sacola, o painel e a API.

A [arquitetura de software](arquitetura-de-software-lais-fit-ja.md) define a estrutura de pastas, a direção das dependências, os princípios SOLID e a transição do código atual.

| Opção | Benefício e custo para este cardápio |
| --- | --- |
| HTML, CSS e TypeScript com Vite, sem React | Pode entregar um catálogo simples com pouco JavaScript. A sacola, as escolhas de produtos e o painel exigiriam reescrever componentes e manter mais interações à mão. |
| React, TypeScript e CSS com Vite | Aproveita o trabalho atual, mantém componentes familiares e permite carregar o painel só quando usado. Recomendo servir uma base estática leve e buscar um catálogo publicado compacto, com cache curto. Se a primeira tela ficar lenta em rede limitada, avaliar pré-renderização da parte pública antes de considerar trocar de framework. [Documentação de renderização do Vite](https://vite.dev/guide/ssr.html) |
| Next.js com TypeScript | Oferece renderização de servidor, geração de páginas e recursos integrados para rotas e imagens. Pode valer a migração se páginas de produtos precisarem chegar em HTML completo para busca ou compartilhamento, ou se a primeira tela medida justificar renderização no servidor. Na Cloudflare, exige escolher e testar uma integração de deploy, além de adaptar o projeto existente. [Next.js na Cloudflare](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) |

### Cloudflare como plataforma inicial

| Serviço | Uso no projeto e referência de custo |
| --- | --- |
| **Workers + Static Assets** | Servir o site e executar a API de preços, catálogo, solicitações e painel. Arquivos estáticos atendidos diretamente são gratuitos e ilimitados segundo a documentação. O plano gratuito inclui 100 mil requisições dinâmicas/dia e 10 ms de CPU por execução. O pago parte de US$ 5/mês. [Preços de Workers](https://developers.cloudflare.com/workers/platform/pricing/) |
| **D1** | Banco para catálogo, horários, preços, pedidos e histórico. Gratuito com 500 MB por banco, 5 GB totais por conta, 5 milhões de linhas lidas/dia e 100 mil linhas gravadas/dia. No pago, o limite é de 10 GB por banco, com 5 GB de armazenamento incluídos na cobrança da conta e excedente a US$ 0,75/GB-mês. [Limites de D1](https://developers.cloudflare.com/d1/platform/limits/) · [Preços de D1](https://developers.cloudflare.com/d1/platform/pricing/) |
| **R2 Standard** | Guardar originais privados e versões otimizadas do cardápio. A franquia mensal inclui 10 GB-mês, 1 milhão de operações de gravação e outras operações de Classe A, e 10 milhões de operações de leitura e outras operações de Classe B. A transferência do R2 para a internet é gratuita. O armazenamento acima da franquia custa US$ 0,015/GB-mês. [Preços de R2](https://developers.cloudflare.com/r2/pricing/) |
| **Cloudflare Access** | Restringir o painel e a API administrativa a e-mails autorizados. Recomendo usar código de acesso por e-mail, com a identidade verificada pela API. O plano gratuito atende uma equipe pequena. [Planos de Access](https://www.cloudflare.com/sase/products/access/) · [Código por e-mail](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) |

O cenário inicial pode ficar **sem mensalidade desses serviços dentro das franquias**, antes do domínio e de eventuais excedentes. Os limites são separados. A capacidade de fotos vem do R2. O D1 guarda os registros em texto e números. Como referência, 100 fotos com originais de 3 MB e 400 KB em versões para o site somam cerca de 340 MB, antes das cópias e versões antigas.

**Supabase fica como alternativa, sem dependência inicial.** O projeto existente já usa PostgreSQL, autenticação e armazenamento do Supabase. Manter essa base seria o caminho de menor mudança no servidor. Centralizar na Cloudflare exige migrar consultas e regras para o D1, substituir o acesso administrativo e mudar o envio de fotos para o R2. A interface e as regras de negócio em TypeScript podem ser reaproveitadas. Rever Supabase se surgir necessidade específica de PostgreSQL ou autenticação de clientes. O plano gratuito consultado inclui 1 GB de arquivos e 500 MB de banco, com pausa após inatividade. O Pro parte de US$ 25/mês. [Preços do Supabase](https://supabase.com/pricing)

### Fotos e resposta no celular

1. A Laís envia a foto uma vez. Reaproveitar o processamento no navegador do painel para gerar versões otimizadas de aproximadamente **320, 640 e 1.280 px**, limitadas à definição disponível no original. Guardar o original separadamente.
2. Exibir no cardápio versões WebP com alternativa compatível, deixando o navegador escolher pelo tamanho da tela. Reservar espaço para as fotos, dar prioridade à imagem principal quando ela estiver na primeira tela e carregar as demais conforme o cliente rola. Baixar a versão grande sob demanda e usar cache para evitar baixar de novo.
3. Como ponto de partida para medição, mirar **até 100 KB por foto de cartão e até 1 MB transferido na primeira tela**, com cache vazio. Antes de fixar os limites, conferir legibilidade e nitidez com fotos da loja em iPhone e Android. O custo de transferência para a Cloudflare e o volume de dados consumido pelo cliente são medidas distintas.
4. Começar com arquivos já otimizados no R2 para evitar dependência de redimensionamento a cada visita. Cloudflare Images pode entrar se o processamento no navegador gerar atrito para a Laís. Atualmente, o plano gratuito inclui até 5 mil transformações únicas por mês para imagens armazenadas fora do serviço. [Preços de Cloudflare Images](https://developers.cloudflare.com/images/pricing/)

Na programação, o Worker deve recalcular preços e disponibilidade no encaminhamento ao WhatsApp. Manter a identidade do painel e as operações administrativas protegidas, com fotos públicas separadas dos originais. Verificar os indicadores de consumo e testar recuperação dos dados e das imagens antes da publicação. O D1 oferece recuperação de sete dias no Free e trinta dias no Paid. Planejar cópias exportáveis dos registros e arquivos importantes. [Recuperação do D1](https://developers.cloudflare.com/d1/reference/time-travel/)

## Validação e passagem para programação

Aprovar o protótipo em um iPhone e um Android reais, incluindo navegador interno do Instagram, rede limitada, teclado aberto e redução de movimento. Na referência de aproximadamente 390 px, verificar nome da marca, acesso a categorias e início dos produtos. Em tamanhos estreitos ou com texto ampliado, preservar leitura e rolagem.

Conferir bolo de 100 g e 200 g a R$ 50/kg, brigadeiro com 9, 10 e 11 unidades, coxinha com 1, 2, 4, 5 e 6, avulsos mais combo, mudanças de preço, esgotamento, sacola mista, horário dividido no mesmo dia, dia fechado e saída para o WhatsApp interrompida. Na operação, a Laís deverá conseguir esgotar um sabor, duplicar um produto, revisar um rascunho e usar a referência de uma solicitação.

A aprovação desta etapa é da base técnica. Uma vez escolhida, a programação pode começar pelo cardápio público, pela gravação de horários e preços no painel e pela sacola até o WhatsApp. As decisões sobre publicação isolada de preço e detalhes dos combos, bem como a comparação visual da vitrine, ficam adiadas nesta rodada.
