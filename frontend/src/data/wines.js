export const WINE_TYPES = {
  tinto: 'Tinto',
  blanco: 'Blanco',
  espumante: 'Espumante'
}

export const wines = [
  {
    id: 'malbec-reserva-001',
    name: 'Malbec Reserva',
    model: 'RK-MAL-RES-001',
    type: 'tinto',
    varietal: 'Malbec',
    winery: 'Bodega RK',
    region: 'Mendoza',
    year: 2022,
    volumeMl: 750,
    price: 18900,
    stock: 12,
    description:
      'Tinto de gran carácter, con frutas negras maduras, notas de cacao y final persistente.',
    notes: ['Fruta negra', 'Especias', 'Cacao'],
    pairing: ['Carnes rojas', 'Pastas', 'Quesos duros'],
    featured: true
  },
  {
    id: 'cabernet-franc-002',
    name: 'Cabernet Franc',
    model: 'RK-CF-002',
    type: 'tinto',
    varietal: 'Cabernet Franc',
    winery: 'Bodega RK',
    region: 'Valle de Uco',
    year: 2021,
    volumeMl: 750,
    price: 21400,
    stock: 7,
    description:
      'Aromático y elegante, con pimiento asado sutil, ciruelas y taninos finos.',
    notes: ['Ciruela', 'Hierbas', 'Taninos finos'],
    pairing: ['Carnes blancas', 'Vegetales grillados', 'Quesos semiduros'],
    featured: false
  },
  {
    id: 'pinot-noir-003',
    name: 'Pinot Noir',
    model: 'RK-PN-003',
    type: 'tinto',
    varietal: 'Pinot Noir',
    winery: 'Bodega RK',
    region: 'Patagonia',
    year: 2023,
    volumeMl: 750,
    price: 17200,
    stock: 9,
    description:
      'Fresco y delicado, con cereza roja, flores secas y textura sedosa.',
    notes: ['Cereza', 'Floral', 'Sutil'],
    pairing: ['Aves', 'Salmón', 'Quesos suaves'],
    featured: true
  },
  {
    id: 'chardonnay-barrica-004',
    name: 'Chardonnay Barrica',
    model: 'RK-CH-BAR-004',
    type: 'blanco',
    varietal: 'Chardonnay',
    winery: 'Bodega RK',
    region: 'Mendoza',
    year: 2023,
    volumeMl: 750,
    price: 16500,
    stock: 14,
    description:
      'Blanco cremoso, con pera, vainilla y un toque de manteca. Acidez equilibrada.',
    notes: ['Pera', 'Vainilla', 'Cremoso'],
    pairing: ['Pescados', 'Pastas con crema', 'Pollo'],
    featured: true
  },
  {
    id: 'sauvignon-blanc-005',
    name: 'Sauvignon Blanc',
    model: 'RK-SB-005',
    type: 'blanco',
    varietal: 'Sauvignon Blanc',
    winery: 'Bodega RK',
    region: 'San Juan',
    year: 2024,
    volumeMl: 750,
    price: 13800,
    stock: 5,
    description:
      'Vibrante y cítrico, con pomelo, lima y notas herbales.',
    notes: ['Cítrico', 'Herbal', 'Fresco'],
    pairing: ['Ensaladas', 'Mariscos', 'Sushi'],
    featured: false
  },
  {
    id: 'torrontes-006',
    name: 'Torrontés',
    model: 'RK-TOR-006',
    type: 'blanco',
    varietal: 'Torrontés',
    winery: 'Bodega RK',
    region: 'Salta',
    year: 2024,
    volumeMl: 750,
    price: 12900,
    stock: 11,
    description:
      'Aromático, con jazmín y durazno blanco. Ligero, ideal para tardes cálidas.',
    notes: ['Jazmín', 'Durazno', 'Aromático'],
    pairing: ['Picadas', 'Comida asiática', 'Postres frutales'],
    featured: true
  },
  {
    id: 'brut-nature-007',
    name: 'Espumante Brut Nature',
    model: 'RK-BN-007',
    type: 'espumante',
    varietal: 'Chardonnay / Pinot Noir',
    winery: 'Bodega RK',
    region: 'Mendoza',
    year: 2022,
    volumeMl: 750,
    price: 24900,
    stock: 8,
    description:
      'Seco y gastronómico, burbuja fina, pan tostado y final mineral.',
    notes: ['Pan tostado', 'Fino', 'Mineral'],
    pairing: ['Mariscos', 'Entradas', 'Tabla de quesos'],
    featured: true
  },
  {
    id: 'extra-brut-008',
    name: 'Espumante Extra Brut',
    model: 'RK-EB-008',
    type: 'espumante',
    varietal: 'Blend',
    winery: 'Bodega RK',
    region: 'Mendoza',
    year: 2023,
    volumeMl: 750,
    price: 21900,
    stock: 6,
    description:
      'Equilibrado y amable, con manzana verde, cítricos y espuma persistente.',
    notes: ['Manzana', 'Cítrico', 'Equilibrado'],
    pairing: ['Aperitivos', 'Sushi', 'Comida ligera'],
    featured: false
  },
  {
    id: 'rose-009',
    name: 'Espumante Rosé',
    type: 'espumante',
    varietal: 'Pinot Noir',
    region: 'Patagonia',
    year: 2023,
    volumeMl: 750,
    price: 23400,
    description:
      'Frutado y elegante, con frutilla, granada y final delicado.',
    notes: ['Frutilla', 'Granada', 'Elegante'],
    featured: true
  }
]

export function formatPriceARS(value) {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  } catch {
    return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}
