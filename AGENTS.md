# AGENTS.md

> Convenção de colaboração para humanos e agentes de IA neste repositório.

## Stack

- **Frontend**: Vite + React 18 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS + Lucide Icons
- **Backend**: Supabase (Auth + Postgres + Edge Functions)
- **Runtime de package manager**: Bun (`bun.lockb` é a fonte da verdade — **NÃO usar `package-lock.json`**)

## Workflow obrigatório: Issue → PR → Merge

**Toda mudança** neste projeto segue este fluxo. Commit direto em `main` é proibido.

### 1. Issue primeiro

Antes de codar, abrir uma **Issue** com uma das 5 labels:

| Label | Quando usar |
|---|---|
| `correcao` | Bug, defeito, regressão |
| `melhoria` | Refatoração, ajuste de UI, performance |
| `nova-funcao` | Feature nova, endpoint novo |
| `deploy` | Mudança só de infra/CI/deploy |
| `docs` | Só documentação |

Título no formato: `[tipo] descrição curta` (ex: `[melhoria] Reduzir altura do banner do catálogo`).

### 2. Branch

Formato: `tipo/N-descrição-curta-kebab-case`, onde `N` é o número da Issue e `tipo` casa com a label.

Exemplos:
- `melhoria/3-banner-compacto`
- `correcao/7-falha-login-mobile`
- `nova-funcao/12-filtro-preco`

### 3. Commit

**Conventional Commits** com o tipo em português (casa com a label):

```
melhoria: reduzir banner do catálogo (#3)
correcao: ajustar auth em mobile (#7)
nova-funcao: adicionar filtro de preço (#12)
```

### 4. Pull Request

- Abrir PR com `Closes #N` no corpo (N = número da Issue)
- Usar o template em `.github/PULL_REQUEST_TEMPLATE.md`
- **Comando**: `gh pr create --body-file .github/PR_BODY.md` (NÃO inline — escaping PowerShell quebra com body inline)
- PR description vive num arquivo `.github/PR_BODY.md` (temporário, deletar após merge)

### 5. Merge = Deploy

Merge na `main` = deploy automático (configurar CI depois).

## Regras duras

- ❌ **Proibido commit direto em `main`**
- ❌ **Proibido PR sem Issue** referenciada
- ❌ **Proibido commitar `.env*`** ou service_role keys
- ❌ **Proibido `package-lock.json`** (projeto usa Bun)
- ❌ **Proibido body inline no `gh pr create`** (usar `--body-file`)

## Comandos úteis

```bash
# Setup
bun install

# Dev
bun run dev          # http://localhost:8080

# Build
bun run build

# Lint
bun run lint
```

## Estrutura

```
src/
├── components/
│   ├── auth/         # AuthContext
│   ├── layout/       # Header, Footer
│   └── ui/           # shadcn/ui primitives
├── pages/            # Rotas (Catalog, Admin*, etc.)
├── hooks/            # Custom hooks
└── integrations/
    └── supabase/     # Cliente Supabase

supabase/
├── functions/        # Edge Functions
└── migrations/       # SQL migrations
```

## Variáveis de ambiente

Vite expõe `VITE_*` ao client. Use `.env.example` versionado com placeholders, `.env.local` pra valores reais. Valores em `.env` (com VITE_*) são intencionais e OK de commitar — são públicos por design.
