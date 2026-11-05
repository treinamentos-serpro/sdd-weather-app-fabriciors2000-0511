# Solução de referência — Delivery

O workflow de deploy publica o site do workshop e o Weather App no GitHub Pages.

## Como funciona

O workflow [`.github/workflows/pages.yml`](../../.github/workflows/pages.yml)
dispara em push para `main` e também pode ser iniciado manualmente:

1. **Build do app** com `VITE_BASE=/${{ github.event.repository.name }}/app/` —
   garante que os assets apontem para o subcaminho correto do Pages.
2. **Montagem do `_site`:**
   - `docs/*` → raiz (site do workshop),
   - `dist/*` → `/app/` (app buildado),
   - `workshop/*` → `/workshop/` (markdown que o site renderiza).
3. **Publicação** via `actions/upload-pages-artifact` + `actions/deploy-pages`.
   O passo `actions/configure-pages` prepara os metadados do Pages.

## O `base` configurável

Em [`vite.config.ts`](../../vite.config.ts):

```ts
base: process.env.VITE_BASE ?? '/',
```

- **Local/dev:** `base = '/'`.
- **Pages:** `base = '/<repo>/app/'` (injetado pelo workflow).

Sem isso, os assets seriam buscados na raiz do domínio e dariam 404. O nome do
repositório é obtido do contexto do GitHub Actions, então o mesmo workflow serve
para repositórios criados a partir deste template.

## Validação local

```bash
VITE_BASE=/sdd-weather-app/app/ pnpm build
pnpm preview
```

## Configuração do repositório

Antes do primeiro deploy, configure **Settings → Pages → Build and deployment
→ Source: GitHub Actions**. Essa configuração é necessária uma vez; o
`GITHUB_TOKEN` padrão do workflow não tem permissão para habilitar o Pages. As
permissões de publicação (`pages: write` e `id-token: write`) estão declaradas
no job de deploy.

## URLs finais

- Workshop: `https://<user>.github.io/<repo>/`
- App: `https://<user>.github.io/<repo>/app/`

Ciclo SDD completo: **Brief → Spec → Plan → Tasks → Code → Test → Review →
Ship**. Após o deploy, o resumo do workflow mostra as URLs publicadas.
