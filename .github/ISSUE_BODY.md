## Contexto

O banner do catálogo (`/` — `Catalog.tsx`) ocupa ~70vh em viewports pequenos, empurrando as caminhas pra fora da dobra. User precisa ver os produtos sem scrollar.

## Mudanças

### Banner (`src/pages/Catalog.tsx`)
- `min-h-[40vh] sm:min-h-[45vh] lg:min-h-[55vh]` → `min-h-[120px] sm:min-h-[170px] lg:min-h-[210px]`
- Título reduzido: `text-xl/xl:text-5xl` → `text-base/xl:text-3xl`
- Subtítulo: `hidden sm:block` (some no mobile pra economizar altura)
- Botões lado a lado em todas as larguras (`flex-row flex-wrap`)
- Botões menores: `h-7 sm:h-8`, texto encurtado "Fale Conosco" no mobile
- Removido `background-attachment: fixed` (quebra em iOS Safari)

### Workflow files (bootstrap)
- `AGENTS.md` — convenção Issue→PR→Merge + regras (Conventional Commits em PT, sem `package-lock.json`, sem `.env*`)
- `.github/PULL_REQUEST_TEMPLATE.md` — template com checkboxes pra tipo + checklist

### GitHub labels criadas
- `correcao`, `melhoria`, `nova-funcao`, `deploy`, `docs` (5 labels do padrão `digomontilha/*`)

## Validação (Playwright)

| Viewport | Hero height | % viewport |
|---|---|---|
| 360x500 | 120px | 24% |
| iPhone SE 375 | 120px | 18% |
| iPhone 12 390 | 120px | 18% |
| iPad 768 | 170px | 17% |
| Desktop 1280 | 210px | 29% |

Resultado: 4 caminhas visíveis acima da dobra no desktop (era 0).

## Como testar

1. `bun install` (NÃO `npm install` — usa Bun)
2. `bun run dev` → http://localhost:8080
3. Verificar banner compacto em mobile e desktop
4. Confirmar que as caminhas aparecem acima da dobra
