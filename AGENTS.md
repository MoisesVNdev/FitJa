# Laís Fit Já

## Ponto de partida

- Leia a [arquitetura e os fluxos do produto](Docs/Planejamento/design-e-arquitetura-front-end-lais-fit-ja.md) e a [estrutura de implementação](Docs/Planejamento/arquitetura-de-software-lais-fit-ja.md).
- Antes de criar ou revisar telas, leia o [guia de identidade visual Fit Já](Docs/Material%20de%20designer/identidade-visual-fit-ja.md), inclusive ao usar skills de front-end, design e UX. O laranja `#EA5A1C` é a assinatura principal e deve ter presença marcante já na primeira tela; o verde é secundário. Siga o guia para fontes das cores, uso do logotipo, contraste e critérios de aceite visual.
- Consulte o [prompt de inicialização](Docs/prompt-inicializacao-codex.md) para comandos, critérios de entrada e divisão entre conversas. Para detalhes comerciais, use as [respostas da Laís](Docs/respostas-lais-fit-ja.md) e as decisões posteriores registradas na arquitetura.
- Use o [registro de inicialização](Docs/codex-setup.md) para retomar a etapa atual e conferir as verificações já executadas.
- Reprodução local atual usa React, TypeScript, CSS e Vite. Supabase ainda está no código. O destino aprovado é Cloudflare Workers, D1, R2 e Access.
- Trabalhe no escopo solicitado. Registre mudanças de arquitetura, contratos e limitações no documento responsável quando afetarem outra área. Use dados fictícios nos testes.

## Implementação e verificação

- Mantenha o ponto de entrada pequeno. Separe tela pública, sacola e painel por responsabilidade. Carregue a área administrativa separadamente do cardápio público.
- Guarde regras de preços, quantidade, disponibilidade e horários em TypeScript puro. Execute a validação definitiva no servidor. Mantenha banco, armazenamento e identidade atrás de adaptadores da API.
- Respeite o TypeScript estrito e o estilo dos arquivos vizinhos. Use nomes por responsabilidade, HTML semântico e CSS responsivo. Refatore em etapas que preservem o comportamento já usado.
- Use os comandos do `package.json`. Execute `npm test` e `npm run build` quando a mudança afetar código, regras, dependências ou integração. Em Windows, encerre o Vite antes de rodar `npm ci`.
- Consulte o README para o protótipo atual. As instruções de Supabase e PostgreSQL ali documentam a base existente até a substituição pelo ambiente Cloudflare.
- Comece por `src/main.tsx` e `src/app/App.tsx`. Use `src/features` para telas, `src/shared/api` para os adaptadores, `shared/domain` para regras puras e `shared/contracts` para contratos compartilhados.
- Use `npm run dev` para a prévia local. No PowerShell, use `npm.cmd` se o script `npm.ps1` estiver bloqueado. Execute `npm ci` quando precisar restaurar as dependências travadas.
