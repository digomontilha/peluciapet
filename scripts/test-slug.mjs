// scripts/test-slug.mjs
// Teste de regressao para src/lib/slug.ts (espelha logica SQL).
// Implementacao duplicada em JS puro para evitar dependencia de TS runner.
// OBS: comportamento documentado = acentos viram '-' (mesmo padrao da
// migration 20260813160000_schema_base_commercial.sql, regex
// '[^a-zA-Z0-9]+' do PostgreSQL). Caracteres acentuados NAO sao
// preservados — o slug resultante e ASCII puro.
function slugifyProductName(name) {
  const base = (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'produto';
}

const cases = [
  // [input, expected]
  ['Caminha Premium para Caes', 'caminha-premium-para-caes'],
  ['Caminha Coracao para Gato', 'caminha-coracao-para-gato'],
  // Acentos viram '-' (mesmo comportamento da SQL)
  ['Caminha com acentuação ção!@#', 'caminha-com-acentua-o-o'],
  ['Pet Café Premium', 'pet-caf-premium'],
  ['Caminha "Mãe" do Pet', 'caminha-m-e-do-pet'],
  // Especiais
  ['!!! @@@ ###', 'produto'],
  ['', 'produto'],
  ['   ', 'produto'],
  [null, 'produto'],
  [undefined, 'produto'],
  // Borda
  ['A', 'a'],
  ['---abc---', 'abc'],
  ['Multiple   Internal   Spaces', 'multiple-internal-spaces'],
  ['123 Number Product', '123-number-product'],
  ['Caminha Acolchoada - 60x50cm', 'caminha-acolchoada-60x50cm'],
  ['Caminha🐶Pet', 'caminha-pet'],
  ['PRODUTO  EM  CAIXA ALTA', 'produto-em-caixa-alta'],
  ['Caminha "Premium" Edition', 'caminha-premium-edition'],
  // PT-BR comuns
  ['Caminha Acolchoada para Gato - Bege', 'caminha-acolchoada-para-gato-bege'],
];

let pass = 0;
let fail = 0;
for (const [input, expected] of cases) {
  const got = slugifyProductName(input);
  const ok = got === expected;
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✓' : '✗'}  slugify(${JSON.stringify(input)}) = ${JSON.stringify(got)} ${ok ? '' : `(expected ${JSON.stringify(expected)})`}`);
}

console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
