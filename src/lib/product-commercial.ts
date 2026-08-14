export type CommercialLine = 'essential' | 'premium';

export const COMMERCIAL_LINES: Array<{
  value: CommercialLine;
  label: string;
  description: string;
}> = [
  {
    value: 'essential',
    label: 'Essencial',
    description: 'Tecidos práticos e confortáveis para o dia a dia.',
  },
  {
    value: 'premium',
    label: 'Premium',
    description: 'Texturas mais macias e acabamento diferenciado.',
  },
];

export const getCommercialLineLabel = (line: string | null | undefined) =>
  COMMERCIAL_LINES.find((option) => option.value === line)?.label ?? line ?? '';

export const makePriceKey = (sizeId: string, line: CommercialLine) => `${sizeId}:${line}`;

export interface CommercialValidationInput {
  categoryId: string;
  status: string;
  sizeIds: string[];
  selectedLines: CommercialLine[];
  availableFabricLines: CommercialLine[];
  prices: Record<string, { price: number; pixPrice: number }>;
}

export function validateCommercialProduct(input: CommercialValidationInput): string[] {
  const issues: string[] = [];

  if (!input.categoryId) issues.push('Selecione uma categoria.');
  if (input.status !== 'active') return issues;

  if (input.sizeIds.length === 0) issues.push('Cadastre pelo menos um tamanho antes de publicar.');
  if (input.selectedLines.length === 0) issues.push('Selecione pelo menos uma linha comercial.');

  input.selectedLines.forEach((line) => {
    const label = getCommercialLineLabel(line);
    if (!input.availableFabricLines.includes(line)) {
      issues.push(`Associe pelo menos um tecido disponível à linha ${label}.`);
    }

    input.sizeIds.forEach((sizeId) => {
      const entry = input.prices[makePriceKey(sizeId, line)];
      if (!entry || entry.price <= 0) {
        issues.push(`Cadastre o preço normal de todos os tamanhos da linha ${label}.`);
      } else if (!entry.pixPrice || entry.pixPrice <= 0) {
        issues.push(`Cadastre o preço Pix de todos os tamanhos da linha ${label}.`);
      } else if (entry.pixPrice > entry.price) {
        issues.push(`O preço Pix da linha ${label} não pode ser maior que o preço normal.`);
      }
    });
  });

  return Array.from(new Set(issues));
}
