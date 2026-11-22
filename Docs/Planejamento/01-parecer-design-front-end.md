# Laís Fit Já — parecer de design e arquitetura front-end

**20 de novembro de 2026 · Revisão do planejamento funcional v0.1**

Este parecer avalia os requisitos do [planejamento funcional v0.1](planejamento-funcional-lais-fit-ja-v0.1.md). A avaliação é documental. As propostas abaixo servem para revisar o escopo e orientar um protótipo que possa ser testado com a Laís e com clientes.

## Diagnóstico

A direção do produto é boa. O cardápio privilegia o celular, mantém a Laís no controle do atendimento e permite avançar com uma sacola sem exigir cadastro. As regras de porção, descontos e combinações já refletem o negócio melhor do que um catálogo genérico. O principal problema é que algumas situações comuns ainda admitem interpretações diferentes: produto que acaba durante o pedido, cliente que abre o WhatsApp sem enviar, marmita impossível de montar e mudança urgente enquanto o cardápio está em edição.

| Prioridade | Trecho do plano | Problema e recomendação |
| --- | --- | --- |
| Essencial | Primeira tela | A área de destaque vem antes das categorias e pode empurrar a lista para baixo. Testar primeiro uma abertura compacta com cabeçalho, busca ou acesso à busca, categorias e início do catálogo. Usar o destaque como oferta real com foto, preço e entrada direta no produto. |
| Essencial | Opções de produto | O texto prevê fotos, preços e nutrição por opção, mas falta definir quais dados podem ser compartilhados. Permitir reutilizar uma foto ou descrição quando representar de fato todas as opções. Exibir preço, peso e disponibilidade da opção escolhida. |
| Essencial | Preço por faixa | Pode haver diferença entre duas inclusões avulsas e uma linha com duas unidades. Recomendo somar unidades avulsas da mesma opção elegível na sacola e mostrar o preço aplicado antes de abrir o WhatsApp. Sabores diferentes só devem compartilhar faixa após decisão explícita da loja. |
| Essencial | Sacola e WhatsApp | “Sua seleção será enviada” dá a impressão de envio automático. Usar “Abrir WhatsApp” no botão e explicar que a pessoa ainda precisa tocar em enviar. Identificar a seleção registrada como “Aguardando envio pelo cliente” apenas se a interface deixar claro que o envio não é observável pelo site. No painel, prefiro “Criada no site · envio não verificado”. |
| Essencial | Publicação e disponibilidade | Pausar um produto no meio do atendimento e publicar um rascunho de aparência são ações diferentes. Recomendo uma atualização imediata e explícita para esgotamento, separada de alterações de conteúdo. Restaurar um tema anterior deve preservar a disponibilidade vigente. |
| Alta | Personalizadas e combos | “Montar marmita” e “montar combo” podem parecer a mesma ação. Usar entradas distintas com exemplos e indicar no início da montagem quando o preço é estimado. Laís deve conseguir desativar a experiência experimental sem esconder os produtos prontos. |
| Alta | Indicadores | Cliques para abrir WhatsApp podem ser interpretados como mensagens recebidas. Dar nomes distintos a solicitações criadas, pedidos confirmados e vendas concluídas. Reservar métricas de tráfego para uma visão secundária. |
| Depois do piloto | Aparência | Muitos controles de densidade, cartões e tipografia ampliam o trabalho de edição e a possibilidade de combinações ruins. Priorizar prévia, ordem, destaques e alguns ajustes de marca. Validar com a Laís a necessidade de controles adicionais antes de incorporá-los. |

## Jornada no celular

### Entrada, busca e categorias

- Dar prioridade a **Marmitas prontas** na primeira visita, como hipótese de protótipo. Validar se haverá produtos suficientes nessa categoria todos os dias. Manter um acesso visível a “Todas as categorias” e uma forma de ver os demais produtos.
- Tocar em uma categoria troca a lista no mesmo lugar. O controle mostra a seleção atual, funciona por toque e teclado e continua utilizável sem gesto lateral. Ao voltar de um produto, manter categoria, busca, posição e foco quando possível.
- Definir o alcance da busca. Recomendo buscar em todo o cardápio, indicar a categoria dos resultados e aceitar termos com ou sem acento. A busca vazia mostra a seleção anterior. Quando não houver resultado, oferecer limpar a busca ou ver as categorias.
- Recomendo testar uma faixa de destaques manual com controles visíveis e alternativa estática. Se a faixa não ajudar a encontrar um produto, retirar do lançamento. A rotação automática adiciona requisitos de pausa e controle e deve depender de validação. [Padrão de carrossel do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/).
- Reduzir banners institucionais grandes, etiquetas repetidas, animações decorativas e campos que pedem trabalho antes de mostrar o cardápio. Conservar identidade e informações úteis como disponibilidade de atendimento e acesso à sacola.

### Produto e montagem

- O cartão deve permitir responder rapidamente “o que é?”, “quanto custa?” e “posso solicitar?”. Mostrar a foto real, o nome, um resumo curto e preço. Usar “A partir de” quando a opção elegível mais barata for uma referência real e explicar descontos por quantidade de forma explícita.
- Em uma marmita pronta, destacar o peso **total** associado à opção, seguido da composição. Para “300 g com 100 g de frango”, o segundo número descreve uma parte do primeiro. O preço de 450 g e a quantidade de proteína são definidos no cadastro desta opção.
- Em montagem personalizada, agrupar escolhas por tamanho, proteína e acompanhamentos. Mostrar quais escolhas são obrigatórias, quantas faltam e quais têm acréscimo. Recomendo que a Laís determine quais alternativas ficam disponíveis por tamanho. Se uma opção esgotar, o cliente deve entender o motivo e conseguir trocar somente a escolha afetada.
- Permitir editar e duplicar uma montagem existente para montar várias marmitas parecidas. Duas montagens diferentes precisam continuar distinguíveis na sacola e na mensagem. Validar a necessidade de uma observação por marmita além da observação geral.
- Nutrição manual deve indicar a porção de referência, com unidade legível. Se não houver informação aprovada para a opção, comunicar a indisponibilidade do dado. Para personalizadas e combos variáveis, definir quando existe uma ficha válida e evitar somar ou reaproveitar valores de uma composição diferente. Separar ingredientes e informações alimentares da promoção.

### Preço, revisão e encaminhamento

- Por peso, o cliente escolhe porções cadastradas. Mostrar o preço de cada porção. Definir arredondamento em centavos com exemplos antes da construção, inclusive quando a multiplicação por gramas gera fração de centavo. Marmitas seguem preços próprios. A V2 deve dizer se cada oferta pode usar um único modelo de preço ou combinar regras.
- Por faixa, informar a próxima faixa quando fizer sentido e recalcular ao aumentar ou diminuir a quantidade. Usar apenas as unidades avulsas elegíveis. Uma coxinha que faz parte de um combo continua sob as regras do combo. Verificar também se uma faixa mal configurada pode produzir um total menor ao adicionar uma unidade e apresentar essa situação para revisão da Laís.
- Manter uma sacola com o bloco de prontos e o bloco de personalizadas, subtotal de prontos, subtotal estimado de personalizadas e total previsto dos produtos. O aviso deve informar que a Laís confirmará valor, composições, entrega e prazo para a solicitação inteira.
- Se preço ou disponibilidade mudar durante a montagem, identificar a linha alterada, mostrar o novo valor e voltar à revisão. Conservar itens e observações válidos. Diferenciar falha temporária do cadastro de um item que a loja efetivamente esgotou.
- A saída para o WhatsApp deve incluir referência, opções, quantidades, totais e observações. Mostrar “Copiar resumo” como alternativa, inclusive em computador. Para dez montagens longas, validar com a Laís a legibilidade e testar o encaminhamento. Se a mensagem precisar ser condensada, combinar previamente quais detalhes podem ficar disponíveis no painel. Se o cliente voltar sem enviar, manter a sacola e permitir retomar a mesma solicitação quando o conteúdo estiver igual. [WhatsApp — Abrir conversa com mensagem preenchida](https://faq.whatsapp.com/5913398998672934).
- Fora do horário e quando houver pausa no atendimento, apresentar o estado antes da montagem e na revisão. A V2 precisa definir se o cliente pode encaminhar para atendimento posterior e em quais situações a sacola vira apenas consulta.

## Painel da Laís

| Tarefa cotidiana | Comportamento proposto para validar |
| --- | --- |
| Alterar disponibilidade | Buscar produto ou sabor, mudar estado, confirmar visualmente o que o público verá e oferecer recuperação de um toque acidental. Diferenciar esgotado, oculto e pausado. |
| Manter o catálogo | Duplicar um item semelhante, reutilizar dados válidos, trocar foto, revisar preço, composição e canal antes de publicar. Café em copo permanece fora da seleção online. |
| Alterar identidade | Exibir prévia do cardápio no celular antes da publicação. Explicar o impacto das alterações e quais informações voltam ao restaurar uma versão. |
| Confirmar uma solicitação | Localizar pela referência, conferir o que foi solicitado, registrar as substituições combinadas com o cliente e marcar o desfecho. Revisar se compensa a Laís registrar no painel cada conversa ou apenas os pedidos efetivamente atendidos. |
| Registrar outras vendas | Identificar venda de balcão ou WhatsApp direto. Definir como evitar duplicação ao registrar manualmente uma solicitação que já veio do site. |
| Acompanhar o negócio | Abrir com pedidos que precisam de ação, vendas concluídas e produtos mais vendidos, com período e origem. Exibir componentes de combo para produção sem contá-los de novo como receita. Verificar a utilidade do ticket médio e da exportação com a Laís. |

## Direção visual e critérios de aprovação

O laranja **#EA5A1C** pode aparecer no cabeçalho, nos destaques e nos elementos da marca, mantendo o verde como detalhe. Branco puro sobre esse laranja tem contraste aproximado de **3,51:1**. Serve para texto grande que atinja os critérios aplicáveis. Para texto comum e rótulos de botões, usar texto escuro ou um laranja mais escuro quando a opção precisar de letras brancas. Estados como “esgotado” e “sob avaliação” devem carregar rótulos, além da cor. [WCAG 2.2 — Contraste mínimo e uso de cor](https://www.w3.org/TR/WCAG22/#contrast-minimum).

| Área | O que comprovar |
| --- | --- |
| Primeira tela | Em celular de referência com largura próxima a 390 px e tamanho padrão de texto, mostrar nome da loja, acesso às categorias e início do conteúdo de produtos sem exigir atravessar uma tela de apresentação. Em telas estreitas e com texto ampliado, priorizar leitura e acesso com rolagem normal. |
| Navegação | Chegar às categorias sem gesto obrigatório, trocar a lista sem salto inesperado, voltar do produto com o contexto preservado e revisar a sacola com teclado aberto. Testar com iPhone e Android reais, incluindo visualização dentro do Instagram. |
| Acessibilidade | Usar WCAG 2.2 AA como referência de projeto. Verificar foco visível e sem obstrução, leitor de tela, rótulos, contraste e tamanho das áreas de toque. Adotar 44 px como alvo de projeto para controles primários. Respeitar redução de movimento. Garantir uma alternativa simples ao arraste. [WCAG 2.2](https://www.w3.org/TR/WCAG22/). |
| Fotografia | Usar arquivos originais sempre que possível. Prever enquadramento e dimensões reservadas, carregar a imagem principal conforme sua importância e adiar imagens fora da tela. Buscar tamanhos proporcionais ao espaço ocupado e permitir ampliação sob demanda. O modo econômico é complementar. [Guia de imagens responsivas](https://web.dev/learn/images/responsive-images). |
| Velocidade e estabilidade | Medir abertura, resposta ao toque e estabilidade visual. Usar LCP até 2,5 s, INP até 200 ms e CLS até 0,1 como referência no percentil 75 quando houver volume de dados reais. Antes do lançamento, medir em laboratório com rede limitada e aparelho de referência. Concordar um orçamento para o que a primeira tela transfere depois de receber fotos reais. [Core Web Vitals](https://web.dev/articles/vitals). |
| Regras comerciais | Conferir bolo de 100 g e 200 g a R$ 50/kg, brigadeiro com 9, 10 e 11 unidades, coxinha com 1, 2, 4, 5 e 6, e avulsos junto com combo. Simular preço alterado, produto esgotado, solicitação mista e envio interrompido. |
| Operação | Laís marca um sabor como esgotado, duplica um produto, revisa um rascunho e confirma uma solicitação a partir da referência. A prova é a tarefa realizada por ela com o mínimo de ajuda. |

## O que entra em cada documento seguinte

**Planejamento funcional V2.** Descrever as jornadas públicas e administrativas do início ao fim. Para cada etapa, documentar quem age, o que vê, quais dados preenche, o que pode mudar e como recuperar um erro. Anexar exemplos aprovados de cardápio, montagem, arredondamento, descontos, esgotamento, estados da solicitação e registros de venda. Manter as decisões pendentes identificadas com responsável pela validação.

**Design e arquitetura técnica.** Mapear telas, estados, componentes, identidade, protótipo, acessibilidade e orçamento de desempenho. Comparar HTML/CSS/JavaScript com uma abordagem incremental, React com Vite como alternativa próxima à base existente e Next.js se houver demanda por páginas públicas renderizadas no servidor ou estrutura que justifique sua operação. Avaliar Cloudflare para entrega e execução, e Supabase para autenticação, dados e fotos, como papéis diferentes que podem coexistir. Comparar o custo de manter o painel, a publicação do catálogo, os backups e as transformações de imagens. Validar condições de uso, preços e compatibilidade na data da escolha.

A preferência por celular deve ser testada com o mesmo fluxo e os mesmos produtos em cada abordagem que chegar à comparação. O critério é a sacola responder com rapidez, o cardápio carregar pouco e a Laís manter o catálogo com facilidade. O nome do framework por si só não garante esses resultados.
