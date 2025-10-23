export interface ProductConfig {
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  active: boolean;
}

export const PRODUCTS: ProductConfig[] = [
  {
    sku: 'TIRZE-2-5MG',
    name: 'Tirzepatida 2.5mg',
    description: 'Tirzepatida 2.5mg - Dose inicial recomendada. Auxilia no controle glicêmico e perda de peso.',
    priceCents: 89900, // R$ 899,00
    currency: 'BRL',
    active: true,
  },
  {
    sku: 'TIRZE-5MG',
    name: 'Tirzepatida 5mg',
    description: 'Tirzepatida 5mg - Dose intermediária. Indicada após adaptação com 2.5mg.',
    priceCents: 119900, // R$ 1.199,00
    currency: 'BRL',
    active: true,
  },
  {
    sku: 'TIRZE-7-5MG',
    name: 'Tirzepatida 7.5mg',
    description: 'Tirzepatida 7.5mg - Dose avançada. Para controle glicêmico otimizado.',
    priceCents: 149900, // R$ 1.499,00
    currency: 'BRL',
    active: true,
  },
  {
    sku: 'TIRZE-10MG',
    name: 'Tirzepatida 10mg',
    description: 'Tirzepatida 10mg - Dose máxima. Para resultados mais intensos sob orientação médica.',
    priceCents: 179900, // R$ 1.799,00
    currency: 'BRL',
    active: true,
  },
];
