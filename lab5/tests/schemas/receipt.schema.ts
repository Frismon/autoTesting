/** Структура чека після розбору тексту функцією parseReceipt. */
export const receiptSchema = {
  type: 'object',
  properties: {
    orderId: { type: 'string', format: 'uuid' },
    date: { type: 'string', format: 'date-time' },
    tier: { type: 'string', enum: ['basic', 'silver', 'gold'] },
    lines: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          sku: { type: 'string', minLength: 1 },
          qty: { type: 'integer', minimum: 1 },
          price: { type: 'number', minimum: 0 },
          sum: { type: 'number', minimum: 0 },
        },
        required: ['sku', 'qty', 'price', 'sum'],
        additionalProperties: false,
      },
    },
    subtotal: { type: 'number', minimum: 0 },
    discount: { type: 'number', minimum: 0 },
    shipping: { type: 'number', enum: [0, 60] },
    total: { type: 'number', minimum: 0 },
  },
  required: [
    'orderId',
    'date',
    'tier',
    'lines',
    'subtotal',
    'discount',
    'shipping',
    'total',
  ],
  additionalProperties: false,
} as const;

/** Тіло відповіді з помилкою: лише код, без внутрішніх подробиць. */
export const errorSchema = {
  type: 'object',
  properties: { code: { type: 'string', minLength: 1 } },
  required: ['code'],
  additionalProperties: false,
} as const;
