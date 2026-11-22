# Inicialização do Codex no Laís Fit Já

**22/11/2026 · Concluída.** A configuração e as verificações locais passaram. O repositório Git local foi inicializado em `main` com autorização nesta conversa.

## Base do projeto

| Situação | Escopo e fonte |
| --- | --- |
| Implementado | Clientes da loja em Caruaru consultam o cardápio sem cadastro, montam a sacola, escolhem entrega ou retirada e abrem o WhatsApp com a lista. Laís confirma o pedido pela conversa e usa o painel para catálogo, aparência, solicitações, vendas e relatórios. A abertura do WhatsApp não comprova o envio. [Produto](Planejamento/design-e-arquitetura-front-end-lais-fit-ja.md) · [Respostas da Laís](respostas-lais-fit-ja.md) |
| Implementado | React, TypeScript estrito, CSS e Vite. `src/main.tsx` monta `src/app/App.tsx`, com painel carregado sob demanda. Cardápio, sacola, checkout e painel ficam em `src/features`. Adaptadores em `src/shared/api`, regras puras em `shared/domain` e contratos em `shared/contracts`. [Etapa 1 e contratos](Planejamento/arquitetura-de-software-lais-fit-ja.md#etapa-1-implementada-na-conversa-02--22112026) |
| Implementado | Demonstração local com armazenamento do navegador. A base legada usa Supabase para API, PostgreSQL, identidade e fotos. A migração SQL e a função ficam em `supabase/`. Os scripts de exportação e restauração são da base legada. [README](../README.md) |
| Aprovado para depois | Worker com API e ativos estáticos, D1 para catálogo, horários, pedidos e histórico, R2 para originais privados e derivados públicos e Access para painel e API administrativa. A conversa 03 define os contratos e a integração. A conversa 04 cuida de recursos separados por ambiente, homologação, recuperação e publicação. [Arquitetura](Planejamento/arquitetura-de-software-lais-fit-ja.md) · [Divisão das conversas](prompt-inicializacao-codex.md#conversas-do-projeto) |
| Em proposta ou pendente de contrato | Publicação isolada de preço e detalhes dos combos foram adiados no produto. Horários estruturados, “Em avaliação”, forma de pagamento, esgotamento independente do rascunho e regras completas de personalizadas ainda exigem contratos próprios. O protótipo mantém horários em texto e restauração de catálogo completo. [Produto](Planejamento/design-e-arquitetura-front-end-lais-fit-ja.md#validação-e-passagem-para-programação) · [Limites da etapa 1](Planejamento/arquitetura-de-software-lais-fit-ja.md#contratos-para-a-conversa-03--dados-e-integrações) |

O destino Cloudflare está aprovado no [AGENTS.md](../AGENTS.md). A presença de Supabase, PostgreSQL e instruções de Pages no README é a base documentada da transição. Use as respostas da Laís e as decisões posteriores da arquitetura para validar horários e conteúdo de lançamento. Os horários transcritos no README pertencem ao protótipo.

## Ambiente e verificações

- Raiz local em `G:\Work\LaisFitJa`, PowerShell, Git 2.56.0.windows.4, Node 26.13.0 e npm 11.20.0. O README requer Node 22.12+ e o CI usa a linha 22. O único arquivo de instruções encontrado no projeto foi `AGENTS.md` da raiz. O cliente recebeu essas instruções nesta sessão.
- Lockfile presente e reaproveitado. Versões conferidas no lockfile incluem React 19.3.1, TypeScript 5.7.3, Vite 6.4.6, Vitest 5.1.1, Supabase JS 2.119.2, PGlite 0.5.17 e Sharp 0.35.5.
- No PowerShell deste computador, use `npm.cmd run dev`. O atalho `npm` resolve para um script bloqueado pela política de execução. Execute `npm.cmd ci` quando precisar restaurar as dependências e encerre o Vite antes. Use `npm.cmd run assets` somente para regenerar os recortes.
- `npm.cmd test` passou com 30 testes em quatro arquivos. Os casos de checkout conferiram mudança de preço e retomada com a mesma referência. Os testes de migração rodaram PostgreSQL em PGlite.
- `npm.cmd run build` passou. A inspeção de `src/app/App.tsx` e do build confirmou carregamento sob demanda e arquivos JS e CSS próprios para o painel. Em uma instância temporária do Vite, `/` e `/admin` responderam HTTP 200 e entregaram a entrada esperada. A conversa 02 concluiu depois o aceite visual local a 390 × 844 px e confirmou na rede do Chrome a separação dos arquivos administrativos. [Evidências na arquitetura](Planejamento/arquitetura-de-software-lais-fit-ja.md#aceite-visual-e-rede-na-conversa-02--22112026)
- Roteamento exercitado em leitura e testes. Uma mudança de preço no checkout remete ao domínio, contrato, adaptador e conversa 03. Uma solicitação de publicação remete à conversa 04 e depende de autorização e ambiente escolhidos. A publicação foi usada apenas como cenário fora do escopo desta inicialização.
- O [workflow local](../.github/workflows/checks.yml) define verificações em push e pull request com Node 22, `npm ci`, testes, build e `deno check supabase/functions/api/index.ts`. A linha Node 22 e a checagem Deno ficaram sem execução nesta sessão. Deno não estava disponível e a execução remota do CI depende de hospedagem futura.

## Git e decisões

A pasta chegou sem metadados Git. Após confirmação de que o projeto começaria com histórico novo, `git init -b main` criou o repositório local. `git status --short --branch` confirmou `main` sem commits e os arquivos existentes ainda não rastreados. `git remote` retornou vazio. O primeiro commit e a configuração de um remoto ficam para entregas autorizadas.

Fluxo proposto após o primeiro commit. Usar `main` como base, criar uma branch por entrega e manter commits restritos à mudança. Quando houver hospedagem Git, registrar motivação e aceite em issue ou PR e usar as verificações do workflow local. Uma branch de integração depende de uma necessidade concreta de coordenação. Promover o mesmo código validado em homologação para produção na conversa 04.

## Skill externa para revisão de interface

**Instalada no projeto.** A skill **Web Design Guidelines 1.1.0**, da Vercel Labs, está em [`.agents/skills/web-design-guidelines/`](../.agents/skills/web-design-guidelines/SKILL.md), com a revisão `5a37a6329fbad3666c3207392a6a7c0110e92efb`. O usuário baixou o lote manualmente e o envio da pasta foi seguido pela conferência dos quatro arquivos com as fontes fixadas. `SKILL.md` e `references/command.md` foram copiados sem alterações, junto com a licença MIT das diretrizes. O README da revisão da skill também declara MIT. As instruções leem a referência local e produzem achados por arquivo e linha. A revisão funciona sem runtimes adicionais, hooks, MCP, credenciais ou rede. Aplicar as orientações pertinentes a React e CSS em português. [Skill fixada](https://raw.githubusercontent.com/vercel-labs/agent-skills/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines/SKILL.md) · [README e licença](https://raw.githubusercontent.com/vercel-labs/agent-skills/5a37a6329fbad3666c3207392a6a7c0110e92efb/README.md) · [Licença das diretrizes](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f91364665f2f733b310ec54809bf8f37937/LICENSE)

O lote de download original fica registrado abaixo para reprodução. Ele baixa o material para uma pasta nova em `$env:TEMP`, fora dos caminhos de descoberta do Codex.

```powershell
$loteFitJa = Join-Path $env:TEMP ("laisfitja-skills-" + [guid]::NewGuid().ToString("N"))
$skillFitJa = Join-Path $loteFitJa 'web-design-guidelines'
$refFitJa = Join-Path $skillFitJa 'references'
$null = New-Item -ItemType Directory -Path $refFitJa -Force
$vercelFitJa = 'https://raw.githubusercontent.com/vercel-labs/agent-skills/5a37a6329fbad3666c3207392a6a7c0110e92efb'
$guidelinesFitJa = 'https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/434b7f91364665f2f733b310ec54809bf8f37937'
Invoke-WebRequest -ErrorAction Stop -UseBasicParsing -Uri "$vercelFitJa/skills/web-design-guidelines/SKILL.md" -OutFile (Join-Path $skillFitJa 'SKILL.md')
Invoke-WebRequest -ErrorAction Stop -UseBasicParsing -Uri "$vercelFitJa/skills/web-design-guidelines/references/command.md" -OutFile (Join-Path $refFitJa 'command.md')
Invoke-WebRequest -ErrorAction Stop -UseBasicParsing -Uri "$vercelFitJa/README.md" -OutFile (Join-Path $loteFitJa 'README-vercel.md')
Invoke-WebRequest -ErrorAction Stop -UseBasicParsing -Uri "$guidelinesFitJa/LICENSE" -OutFile (Join-Path $loteFitJa 'LICENSE-guidelines')
$hashFitJa = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $refFitJa 'command.md')).Hash
if ($hashFitJa -ne 'd246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234') {
    throw "Hash inesperado em references/command.md. Confira o lote em $loteFitJa."
}
Get-ChildItem -LiteralPath $loteFitJa -Recurse -File | Select-Object -ExpandProperty FullName
```

A revisão estática de amostra em `src/shared/ui/Modal.tsx` conferiu o nome acessível do botão de fechar, o título associado via `aria-labelledby`, o fechamento pelo Escape e o estilo global de foco. Uma tarefa de exportação D1 ficou fora do gatilho da skill por se tratar de persistência. A descoberta automática pelo cliente deve ser conferida em uma sessão que recarregue as skills do projeto.

O projeto ainda não tem uma função recorrente que exija um agente próprio. As conversas e as ferramentas locais cobrem a próxima etapa. A avaliação de Wrangler, plugin Vite da Cloudflare e ferramentas de recuperação fica para a conversa 03, quando houver escopo de integração autorizado.

## Retomada

### Referência de identidade visual · 22/11/2026

Criado o [guia de identidade visual Fit Já](Material%20de%20designer/identidade-visual-fit-ja.md), vinculado no AGENTS.md e na arquitetura front-end. Registra a prioridade do laranja `#EA5A1C`, a diferença de cor no JPG, o verde amostrado, cores de apoio, contrastes calculados e critérios para a próxima revisão visual. Os arquivos originais foram preservados. Esta entrega altera apenas documentação; não redesenha a aplicação nem instala skills. Conferidos os caminhos locais das referências e os cálculos de contraste; testes e build não se aplicam à alteração documental. Próxima ação visual: implementar a direção do guia e registrar capturas antes/depois e verificações, preservando os fluxos existentes.

Primeiro comando para a próxima etapa local, a partir da raiz, é `npm.cmd run dev`.

> Leia o AGENTS.md e o registro de inicialização. Na conversa 02, use o aceite local já registrado como base e confira o fluxo em iPhone e Android reais, incluindo o navegador interno do Instagram. Registre as evidências na arquitetura de software.

Para uma revisão de interface, use `$web-design-guidelines` e indique os arquivos a revisar. Para iniciar o histórico, revisar os arquivos que entrarão no primeiro commit antes de adicioná-los.
