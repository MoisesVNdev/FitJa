# Laís Fit Já

Cardápio para celular, sacola com encaminhamento ao WhatsApp e painel de catálogo, aparência, pedidos e métricas. React + TypeScript + CSS + Vite. O protótipo mantém Supabase e demonstração local; o destino aprovado é Cloudflare Workers, D1, R2 e Access. As instruções de Supabase, PostgreSQL e Pages abaixo descrevem a base legada e serão substituídas nas conversas de integração e publicação.

A [arquitetura de software](Docs/Planejamento/arquitetura-de-software-lais-fit-ja.md) registra a separação das telas, os contratos de integração e o aceite local em viewport de 390 × 844 px. O ponto de entrada fica em `src/app`, as funcionalidades em `src/features`, os adaptadores em `src/shared/api` e as regras puras em `shared/domain`. A próxima revisão do layout segue o [guia de identidade visual](Docs/Material%20de%20designer/identidade-visual-fit-ja.md).

## Executar localmente

Requisitos: Node.js 22.12+ e npm.

```powershell
npm.cmd ci
npm.cmd run dev
```

Os comandos acima são para PowerShell no Windows. No Linux e no macOS, use `npm`. Abra o endereço exibido no terminal. O cardápio fica em `/` e o painel em `/admin`.

Sem `.env`, somente `localhost`, `127.0.0.1` e `::1` habilitam a **demonstração local**. Catálogo, pedidos e eventos ficam no armazenamento do navegador. A demonstração não é uma autenticação e não deve ser usada para operar a loja. Num domínio público sem backend, o painel e a finalização ficam desabilitados.

Configure o WhatsApp no painel da demonstração para testar a geração da solicitação. Nenhuma mensagem é enviada automaticamente. Para apagar os dados de demonstração, remova as chaves `fitja:*` no armazenamento do navegador.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

## Conteúdo inicial

O catálogo inicial combina os produtos das artes em `Docs/Fotos do cardapio fisico` com os exemplos mais recentes do questionário da Laís. As fotos são **recortes das artes fornecidas**, com resolução original de aproximadamente 150–185 pixels. Gerar arquivos maiores não recupera detalhes: substitua pelos originais usando o painel. O script `npm run assets` reproduz os recortes sem ampliar artificialmente a resolução.

Na demonstração nova, as marmitas prontas de frango e carne têm variantes de 300, 350, 400 e 500 g. A salada avulsa sem preço e os cafés em copo ficam arquivados. Os catálogos já salvos mantêm suas configurações. Confirme com a Laís itens, preços e fotos definitivos antes de publicar. Combos, adicionais, informações nutricionais conferidas e contatos devem ser cadastrados pela loja.

Horário transcrito: segunda a sexta, 08h–13h e 15h30–20h30. Local: Academia Goldbox. Revise produtos, fotos, preços, horários, nomes e alegações sobre alimentos antes de publicar.

## Conectar o backend

1. Crie um projeto Supabase. Copie `.env.example` para `.env` e preencha a URL e a chave pública. **Nunca** coloque `service_role` em uma variável `VITE_*`.
2. Com a CLI Supabase instalada, execute `supabase link --project-ref SEU_PROJECT_REF` e `supabase db push`. A migração cria tabelas, políticas RLS, auditoria, limites de requisição e bucket de imagens.
3. No painel Auth do Supabase, desabilite inscrição pública. Crie a conta da proprietária e registre seu UUID na tabela `admins` pelo SQL Editor:

```sql
insert into public.admins(user_id) values ('UUID_DA_USUARIA');
```

4. Configure o endereço do site e o redirecionamento `/admin` no Auth; configure um SMTP de produção para recuperação de senha. Não há registro público de administradores.
5. Crie um widget Cloudflare Turnstile para o domínio. Preencha `VITE_TURNSTILE_SITE_KEY` no frontend. No gerenciador de secrets do Supabase, configure `TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGIN` (origem HTTPS exata, sem barra final) e `RATE_LIMIT_SALT` (segredo aleatório longo). URL e chave de serviço do Supabase já são fornecidas ao ambiente das Edge Functions.
6. Execute `supabase functions deploy api`. A função usa `verify_jwt=false` por atender solicitações públicas; **cada operação administrativa valida a sessão e a associação em `admins`**.
7. Abra `/admin`, entre, confira o conteúdo inicial, configure o WhatsApp com `55 + DDD + número`, salve e publique. O catálogo inicial é carregado no painel quando ainda não há publicação. Sem publicação válida, o público verá uma mensagem de indisponibilidade.

O servidor recalcula preços; nunca aceita um total informado pelo cliente. Solicitações usam chave de idempotência e snapshot original imutável. A atualização manual usa concorrência otimista; duas janelas não sobrescrevem o mesmo pedido silenciosamente. Catálogo anterior pode ser restaurado pelo painel.

Imagens enviadas são convertidas no navegador para WebP de 320/640/1280 px e JPEG de compatibilidade, removendo metadados. Sem taxa recorrente por transformação. Foto removida do catálogo não apaga o arquivo físico, preservando versões anteriores; o armazenamento deve ser monitorado e arquivos órfãos só devem ser removidos após verificar os backups e referências.

## Publicar no Cloudflare Pages

- Repositório Git com comando de build `npm run build` e saída `dist`.
- Configure as três variáveis públicas de `.env.example` no ambiente de produção e refaça o build.
- Associe o domínio comprado e habilite HTTPS. Use a versão sem acento como principal, se adquirida; redirecione os outros nomes para a mesma origem.
- `public/_redirects` atende `/admin`; `public/_headers` fornece as proteções e cache. Se usar um domínio personalizado para o Supabase, ajuste `connect-src` no CSP.
- Configure Auth, Turnstile e `ALLOWED_ORIGIN` para a origem definitiva. Não permita origens arbitrárias para liberar previews. Use projeto Supabase separado para homologação.

Não há conta conectada, domínio comprado, credencial ou publicação automática nesta entrega. A pasta `dist` é o pacote estático compilado; backend precisa da migração e da função acima.

## Operação e relatórios

- **Solicitação criada** significa registrada no site, sem comprovar envio da mensagem.
- A proprietária marca **confirmado**, **concluído** ou **cancelado** e pode corrigir os produtos antes de concluir.
- Só concluídos entram em vendas e ticket médio, pela data de conclusão. Origem e resumo original são preservados; descontos e acréscimos precisam de motivo. Frete não entra na receita de produtos.
- Combo aparece como oferta vendida; componentes aparecem separadamente como unidades para produção, sem receita duplicada.
- Pedidos externos podem ser cadastrados pelo painel. CSV inclui os registros filtrados e protege células contra interpretação como fórmulas.
- Eventos anônimos de navegação têm sessão por aba e janela de 90 dias. Não são um instrumento contábil; bloqueadores e tráfego automatizado podem afetá-los.
- O arquivo `order_history` no banco registra alterações. Para exclusão de dados a pedido de cliente, a operação administrativa autenticada `delete-order` remove o pedido e seu histórico em cascata. Execute-a somente após identificar a referência correta e confirmar a solicitação com a proprietária.

## Backup e recuperação

Instale `pg_dump` e `pg_restore` compatíveis com a versão do banco. Configure `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente protegido do executor. A conexão deve usar usuário com permissão de leitura dos schemas `public`, `auth` e `storage`; prefira a conexão direta ou pooler de sessão compatível com pg_dump.

```powershell
npm run backup
node scripts/backup.mjs --verify backups/PASTA_DO_BACKUP
```

O script copia banco (`public`, `auth` e `storage`), todas as imagens do bucket e manifesto SHA-256, sem expor credenciais no comando. Contém dados de pedidos e autenticação: mantenha privado e criptografado. Cópias ficam em `backups/`, ignorada pelo Git. Use um agendador externo protegido para executar diariamente, copiar para armazenamento privado fora do computador e reter 30 dias. Não há agendamento criado nesta entrega.

Para testar restauração: crie um **projeto isolado**, da mesma versão e com as mesmas migrações/políticas de Storage; configure suas credenciais no ambiente e execute:

```powershell
$env:RESTORE_TO_ISOLATED_PROJECT = 'yes'
node scripts/restore.mjs backups/PASTA_DO_BACKUP
```

O comando substitui objetos `public`/`auth`/`storage` do alvo em transação e repõe as imagens. Exige permissões de restauração nos três schemas, inclusive nos objetos gerenciados; provedores podem exigir restauração pelo suporte. Ajuste as URLs de imagens ao novo projeto, SMTP, redirecionamentos e secrets. Confira contagens, login, catálogo, pedidos, original e histórico. **A restauração real não foi executada sem um projeto e credenciais; verificar hashes não substitui esse ensaio.** Não use o alvo de produção para ensaiar.

O plano gratuito Supabase pode pausar por baixa atividade e tem cotas. Monitore disponibilidade, armazenamento, transferência e funções; trate pausa ou aproximação das cotas como gatilho para avaliar plano pago. Backup bem-sucedido limpa apenas eventos com mais de 90 dias e contadores antigos, nunca pedidos.

## Checklist de lançamento

- Revisar conteúdo e fotografias originais; cadastrar combos reais e informações nutricionais.
- Validar um fluxo completo Android/iOS, WhatsApp Web e navegador interno do Instagram.
- Testar indisponibilidade, preços alterados, clique repetido, falha de rede e retorno à sacola.
- Confirmar que visitante não lê pedidos, rascunhos, auditoria ou dados de autenticação.
- Conferir recuperação de senha e que uma conta sem `admins` é rejeitada.
- Testar backup/restauração em projeto isolado e configurar cópia diária fora do servidor.
- Medir a primeira tela numa conexão móvel: alvo até 1 MB transferido e fotos de cartões geralmente abaixo de 100 KB. Conferir contraste, foco, escala de texto e redução de movimento.

Build e testes de domínio não validam, por si, a configuração remota de Auth, SQL, Storage, WhatsApp ou SMTP. Essas etapas exigem as contas da loja e o ensaio de homologação antes de receber pedidos reais.

## Licença

O código original do projeto é disponibilizado sob a [licença MIT](LICENSE). O nome e o logotipo Fit Já, as fotos e as artes da loja seguem os direitos de seus titulares. Dependências e materiais de terceiros, incluindo a skill de revisão de interface, seguem suas respectivas licenças.
