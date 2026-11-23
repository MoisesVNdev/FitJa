# Laís Fit Já — planejamento funcional do cardápio online

**Versão 0.1 · 20 de novembro de 2026 · Para revisão**

> Este documento consolida as decisões da conversa e identifica os pontos que ainda serão validados com a cliente. Sua criação registra o planejamento para revisão: não autoriza antecipar as etapas de construção, escolha de hospedagem ou criação do formulário HTML. Nenhum código do site foi alterado nesta etapa.

## 1. Objetivo, identidade e experiência do cliente

### Finalidade da primeira versão

O site será um **cardápio online com montagem de uma solicitação de pedido**.

O cliente consultará os produtos, escolherá opções e quantidades, revisará a sacola e abrirá o WhatsApp da Laís com uma mensagem preenchida. Ele precisará enviar essa mensagem.

**Todo o pedido aguardará avaliação da Laís**, incluindo os produtos de composição pronta. Ela confirmará na conversa:

- Quais produtos poderá atender.
- Quais montagens personalizadas poderá preparar.
- Eventuais substituições ou alterações.
- Valor final, pagamento, entrega e prazo.

Nesta fase, o site não receberá pagamentos nem confirmará automaticamente uma venda. Não haverá cadastro obrigatório de clientes.

### Canais

- **WhatsApp:** único canal de avaliação e finalização nesta fase.
- **Instagram:** contato adicional e divulgação do link do cardápio; não terá fluxo próprio de finalização.
- **E-mail:** não faz parte do atendimento de pedidos planejado.

### Produtos do canal online

O cardápio online terá uma seleção própria de **produtos que podem ser entregues**. Não será uma reprodução automática de tudo que existe no cardápio físico.

O café servido em copo ficará fora dessa seleção, conforme orientação recebida. Outros produtos físicos também precisarão ser avaliados antes de entrar no site.

### Identidade visual

A aparência deverá permitir reconhecer a Fit Já imediatamente:

- **Laranja como cor protagonista**, usando como referência o **#EA5A1C — RGB 234, 90, 28**.
- Branco para letras e destaques sobre o laranja quando houver leitura adequada.
- Verde como detalhe associado à folha do logotipo.
- Fundos de apoio e texto ajustados para manter a leitura.

O verde não deverá dominar a interface. A identidade também não dependerá somente do logotipo: cores, botões, etiquetas e composição devem reforçar a marca.

### Prioridade absoluta para o celular

A estrutura será concebida primeiro para smartphones e depois adaptada ao computador.

A tela inicial deverá oferecer acesso rápido aos produtos, evitando um banner institucional grande que empurre o cardápio para baixo.

A composição prevista é:

1. Cabeçalho compacto com a marca.
2. Destaques de produtos em uma área compacta.
3. Busca e acesso às categorias.
4. Lista dos produtos da categoria selecionada.
5. Acesso persistente à sacola quando houver itens.

**Decisão confirmada:** tocar numa categoria trocará a lista apresentada no mesmo espaço, em vez de deslocar o cliente por uma página extensa.

A navegação entre categorias deverá funcionar por toque e arraste. Também deverá existir um acesso explícito a todas as categorias, evitando depender exclusivamente de descobrir um gesto lateral.

O carrossel de destaques é uma proposta para validação. Não poderá bloquear ou atrasar o acesso aos produtos. O comportamento de passagem automática ou manual ainda será discutido.

### Conforto de uso

A futura interface deverá considerar:

- Áreas ocupadas por câmera, recortes e indicadores do aparelho.
- Barras do navegador, navegação do Android e gestos do sistema.
- Margens laterais confortáveis, inclusive em telas curvadas.
- Teclado aberto durante o preenchimento.
- Botões fáceis de alcançar e tocar.
- Transições curtas, fluidas e sem deslocamentos inesperados.
- Preservação da sacola e das escolhas durante a navegação.
- Preferências de redução de movimento do aparelho.

A inspeção com dimensões de um celular será parte da validação, complementada por testes em aparelhos reais.

## 2. Catálogo, marmitas e regras de preço

### Informações dos produtos

Cada produto poderá apresentar:

- Nome, categoria e descrição.
- Foto real.
- Ingredientes e informações alimentares fornecidas pela loja.
- Peso, volume ou quantidade, conforme o produto.
- Opções de tamanho, sabor ou composição.
- Preço correspondente à opção selecionada.
- Informações nutricionais.
- Disponibilidade para solicitação.
- Destaques ou etiquetas cadastrados pela Laís.

Fotos, descrição, preço e nutrição deverão corresponder à opção escolhida. Uma opção maior poderá ter composição diferente, sem obrigação de seguir proporção.

### Marmitas de composição pronta

Serão o foco principal do cardápio.

Laís cadastrará os tamanhos que desejar, como 300 g, 350 g ou 450 g, e definirá sabores, composição e preços de cada opção.

A gramagem anunciada será o **peso total da marmita**. Quando a descrição informar “100 g de frango”, essa porção estará incluída no peso total.

Não haverá cálculo automático da composição ou do preço a partir da descrição. Uma marmita maior não implicará automaticamente mais proteína ou aumento proporcional de todos os ingredientes.

**“Pronta” significa composição definida.** Não representa garantia automática de disponibilidade ou entrega: isso será confirmado pela Laís no WhatsApp.

### Marmitas personalizadas

Serão uma funcionalidade **secundária e experimental**, com acesso menos destacado que o catálogo principal.

O cliente escolherá entre as alternativas cadastradas pela Laís, como:

- Tamanho.
- Proteína.
- Acompanhamentos.
- Outras opções que a proprietária decidir disponibilizar.

Laís poderá definir escolhas obrigatórias, limites de seleção, repetições permitidas e acréscimos de preço. As porções e condições serão explicadas nas respectivas descrições.

O sistema mostrará um **preço estimado**, calculado a partir das regras cadastradas. Composição, disponibilidade, valor final e prazo dependerão da avaliação na conversa.

Cada montagem diferente aparecerá separadamente no resumo. Será possível solicitar, por exemplo, dez marmitas com combinações e quantidades diferentes.

### Modelos de precificação

O cadastro deverá facilitar a escolha da regra adequada ao produto, sem exigir um cadastro independente para cada quantidade.

| Modelo | Funcionamento |
| --- | --- |
| Preço por opção | Laís informa preços próprios por tamanho, sabor ou composição. |
| Preço proporcional por peso | Laís informa o preço por quilo e cadastra as porções vendidas. |
| Preço por faixa de quantidade | O preço unitário muda quando a quantidade atinge uma faixa cadastrada. |
| Combo | A oferta segue composição, escolhas e preço próprios. |

#### Preço proporcional por peso

O cliente escolherá **porções previamente cadastradas**, sem digitar um peso livre.

Exemplo: com preço de R$ 50/kg:

- 100 g custam R$ 5.
- 200 g custam R$ 10.
- 1 kg custa R$ 50.

Esse modelo será habilitado somente para produtos apropriados. **Não será aplicado automaticamente às marmitas.**

Decisão pendente com a Laís: como arredondar uma porção cujo cálculo resulta em fração de centavo. Até definir a regra, o editor aceita somente combinações de preço por quilo e peso que resultem em centavos inteiros. O catálogo é validado novamente ao publicar e o checkout recusa porções com preço inválido.

#### Desconto por faixa de quantidade

A faixa atingida definirá o preço unitário de todas as unidades elegíveis.

Exemplos acordados:

| Produto | Quantidade | Total |
| --- | ---: | ---: |
| Brigadeiro de 20 g | 1 | R$ 3,00 |
| Brigadeiro de 20 g | 10 | R$ 25,00 |
| Brigadeiro de 20 g | 11 | R$ 27,50 |
| Coxinha de 120 g | 1 | R$ 9,50 |
| Coxinha de 120 g | 2 | R$ 18,00 |
| Coxinha de 120 g | 5 | R$ 42,00 |
| Coxinha de 120 g | 6 | R$ 50,40 |

O peso correspondente poderá acompanhar a quantidade: cinco coxinhas de 120 g representam 600 g.

Ainda será validado com a cliente se sabores ou opções diferentes poderão compartilhar uma mesma faixa de desconto. Isso não deverá ser presumido pelo sistema.

### Combos

Haverá dois tipos:

- **Fixos:** composição definida pela proprietária.
- **Montáveis:** escolhas entre alternativas permitidas, respeitando as regras cadastradas.

**Decisão confirmada: não acumular automaticamente descontos.**

- Componentes de um combo seguem o preço e as regras do combo.
- Unidades avulsas seguem suas próprias faixas de quantidade.
- Componentes internos de combos não contam para atingir a faixa dos avulsos.

### Informações nutricionais

Na primeira versão, o preenchimento será **manual**.

Laís fornecerá os valores correspondentes ao produto ou à opção. Quando não houver dados, o site informará essa ausência, sem preencher números estimados como se fossem dados aprovados.

Não haverá cálculo nutricional automático a partir de fotos, descrição ou gramagem da proteína.

Uma futura função de cálculo por receita dependerá de planejamento próprio: ingredientes, quantidades, fonte dos dados, rendimento e revisão dos resultados.

A forma visual de apresentar a tabela — expandida, recolhida ou em outra apresentação — será validada com a cliente.

### Fotos e consumo de dados

Serão usadas fotografias reais dos produtos. As imagens atuais retiradas das artes servem como referência; os arquivos originais serão necessários para melhorar a definição.

A solução futura deverá:

- Preparar versões de tamanhos diferentes.
- Comprimir as fotos preservando sua aparência.
- Carregar imagens conforme a navegação.
- Disponibilizar uma versão maior quando o cliente solicitar ampliação.
- Ser econômica por padrão, sem depender de detectar dados móveis.
- Oferecer uma preferência de economia de dados.

Formato, processamento e armazenamento serão decididos na fase técnica.

## 3. Sacola, WhatsApp e gestão dos pedidos

### Uma sacola, dois blocos

A sacola será única, separando:

1. **Produtos prontos**, de composição definida.
2. **Marmitas personalizadas**, identificadas como experimentais e sujeitas à avaliação.

A revisão mostrará:

- Itens, opções e quantidades.
- Composição das personalizadas.
- Preços e descontos aplicados.
- Subtotal dos produtos prontos.
- Subtotal estimado das personalizadas.
- Total previsto dos produtos.
- Campo de observações.

O total não deverá ser apresentado como incluindo frete. Entrega, retirada eventualmente combinada, pagamento e prazo serão tratados na conversa.

### Avaliação do pedido inteiro

Quando a sacola combinar prontas e personalizadas, **todo o pedido aguardará avaliação**. Não haverá encaminhamento automático das prontas para atendimento separado.

Aviso previsto:

> Sua seleção será enviada para avaliação. Laís confirmará pelo WhatsApp a disponibilidade dos produtos, as marmitas personalizadas, o valor final e o prazo.
### Mensagem para o WhatsApp

O site gerará uma referência para identificar a solicitação. A mensagem preenchida incluirá:

- Referência.
- Produtos prontos em um bloco.
- Personalizadas em outro bloco.
- Opções, composições e quantidades.
- Valores e total previsto.
- Observações.
- Indicação de que o pedido depende de confirmação.

O cliente poderá conferir a mensagem e precisará tocar em enviar no WhatsApp.

Registrar uma solicitação ou abrir a conversa não deverá gerar um aviso de “pedido confirmado”.

Deverá existir uma alternativa para copiar o resumo quando o encaminhamento não funcionar.

### Gestão manual pela proprietária

O painel permitirá acompanhar solicitações e registrar o resultado da conversa.

O fluxo básico será:

- Solicitação criada.
- Pedido confirmado.
- Pedido concluído.
- Solicitação ou pedido cancelado.

A necessidade de um estado específico “em avaliação” será validada com a cliente.

Laís poderá corrigir itens, quantidades e valores negociados, mantendo o resumo original e o registro das alterações.

Também poderá cadastrar vendas que começaram no balcão ou diretamente no WhatsApp, identificando sua origem.

### Dashboard

O painel distinguirá interesse, solicitação e venda.

Indicadores previstos:

- Acessos aproximados.
- Produtos consultados.
- Solicitações criadas.
- Cliques para abrir o WhatsApp.
- Pedidos confirmados e concluídos.
- Quantidades solicitadas e vendidas.
- Valores registrados e ticket médio.
- Produtos mais vendidos.
- Comparação por período e origem.
- Exportação dos registros.

Somente pedidos registrados como concluídos entrarão nos indicadores de vendas concluídas. Isso não representa confirmação bancária de pagamento.

Nos combos, a receita será contada uma única vez. Os componentes poderão aparecer separadamente como informação para planejamento da produção.

A confiabilidade das vendas registradas dependerá da atualização manual feita pela proprietária.

## 4. Painel e personalização

### Administração do catálogo

O painel deverá permitir:

- Criar, editar, duplicar, ordenar e arquivar produtos.
- Organizar categorias.
- Cadastrar opções, adicionais e composições.
- Definir modelos de preço e faixas de quantidade.
- Criar combos fixos e montáveis.
- Preencher informações nutricionais.
- Substituir fotografias.
- Marcar produtos ou opções como disponíveis ou esgotados.
- Atualizar informações da loja e contatos.

A primeira versão não terá controle numérico de estoque.

A disponibilidade informada no cardápio auxiliará o cliente, mas a confirmação final continuará no WhatsApp.

### Personalização por seções

**Decisão confirmada:** editor por seções, com liberdade organizada. Não está aprovado um editor de posicionamento livre como o Canva.

Controles já previstos:

- Cores gerais e por seção.
- Fontes e tamanhos de texto.
- Ordem das categorias e produtos.
- Destaques e banners.
- Prévia antes de publicar.
- Possibilidade de desfazer ou restaurar uma publicação anterior.

Para ampliar o painel, serão apresentados à cliente controles adicionais sobre:

- Cabeçalho e apresentação da marca.
- Formato e enquadramento das fotos.
- Apresentação dos cartões.
- Etiquetas de destaque e indisponibilidade.
- Aparência dos botões.
- Espaçamentos e densidade da lista.
- Apresentação de preços, descontos e informações nutricionais.
- Conteúdo e comportamento da área de destaques.

Esses controles adicionais são **propostas para validação**, não requisitos já aprovados.

A personalização deverá preservar leitura, acesso aos botões e funcionamento no celular.

### Publicação e acesso

Alterações no catálogo e na aparência deverão poder ser preparadas e visualizadas antes de aparecer para o público.

O painel será exclusivo de pessoas autorizadas, com proteção de acesso e recuperação de conta.

Pedidos e informações administrativas não deverão ficar disponíveis a visitantes.

## 5. Evolução, decisões pendentes e próximas entregas

### Possibilidades futuras

A evolução desejada é acostumar os clientes a iniciar os pedidos pelo site e, posteriormente, ampliar a operação para:

- Recebimento e acompanhamento dos pedidos dentro do sistema.
- Controle de estoque.
- Pagamentos online.
- Redução da dependência do atendimento manual por WhatsApp.

Essas funções não fazem parte da primeira versão.

Antes dessa evolução, será necessário definir se o estoque representa produtos prontos, ingredientes ou ambos, além de reposições, perdas e ajustes.

### Construção e hospedagem

A ordem de decisão será:

1. Revisar e aprovar o funcionamento.
2. Validar as preferências e regras da cliente.
3. Definir como construir.
4. Escolher serviços e hospedagem.
5. Planejar implementação, testes e lançamento.

**Cloudflare e Supabase são possibilidades em avaliação.** A escolha anterior não deverá ser tratada como uma decisão definitiva.

Na fase técnica, serão considerados custo inicial, uso comercial, manutenção, armazenamento de fotos, segurança, backups, recuperação e capacidade de evolução.

O domínio pretendido é **Laís Fit Já**, com endereço mencionado como `laisfitjá.com.br`. O registro e a escolha entre versões com ou sem acento serão confirmados antes da publicação.

### Pontos para validar com a cliente

O questionário posterior deverá esclarecer, entre outros:

- Quais produtos entram no canal online.
- Categorias e ordem de apresentação.
- Fotografias disponíveis e necessidade de novas fotos.
- Tamanhos, composições e preços reais.
- Regras das personalizadas e seus acréscimos.
- Descontos compartilhados ou separados entre sabores.
- Composição e preços dos combos.
- Disponibilidade e atualização durante o atendimento.
- Forma de apresentar a tabela nutricional.
- Ingredientes e informações alimentares.
- Carrossel e destaques.
- Controles desejados de personalização.
- Tratamento de pedidos fora do horário ou com atendimento pausado.
- Rotina de atualização dos pedidos no painel.
- Dados oficiais de contato e funcionamento.

### Documento e formulário da próxima fase

Este documento será revisado primeiro com o responsável pelo projeto. Depois das correções, servirá de base para um questionário separado do site.

O material será um **arquivo HTML único**, com apresentação e funcionamento no próprio arquivo, para a cliente preencher no notebook.

Cada assunto deverá conter:

- Explicação simples do funcionamento planejado.
- Alternativas claras, quando houver uma decisão.
- Campo para descrever outra preferência.
- Perguntas complementares pertinentes à escolha.

O formulário deverá distinguir decisões já acordadas de sugestões e perguntas em aberto.

Ao finalizar, a cliente poderá gerar um arquivo **`.md` com suas respostas**, salvá-lo no notebook e enviá-lo ao responsável pelo projeto.

O formulário não publicará o site nem enviará respostas automaticamente. Ele será criado somente depois da revisão e consolidação deste planejamento.

### Critérios para a futura aprovação

A validação deverá demonstrar que:

- A marca é reconhecível pelo uso do laranja.
- O celular oferece acesso rápido aos produtos.
- Todas as categorias são encontráveis e acessíveis.
- Escolhas e quantidades permanecem corretas durante a navegação.
- Preços por peso, faixas e combos seguem as regras aprovadas.
- Prontas e personalizadas são claramente separadas.
- O pedido inteiro é apresentado como sujeito à avaliação.
- A mensagem do WhatsApp contém a seleção correta.
- O painel permite manter o catálogo com facilidade.
- As métricas distinguem solicitações e vendas.
- Imagens e transições funcionam bem em conexão móvel.
- A experiência considera as áreas ocupadas pela interface do aparelho.
