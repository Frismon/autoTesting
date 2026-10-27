const RULE = /^-{40}$/;
const LINE = /^(\S+) (\d+) x (\d+\.\d{2}) = (\d+\.\d{2})$/;

/**
 * Розбирає текст чека на структуру для перевірки за JSON Schema.
 * Кидає помилку, якщо текст не відповідає очікуваному формату:
 * заголовок, три поля, роздільник, позиції, роздільник, чотири підсумки.
 */
export function parseReceipt(text: string) {
  const rows = text.trimEnd().split('\n');
  const field = (row: string | undefined, label: string) => {
    const prefix = `${label}: `;
    if (!row?.startsWith(prefix)) {
      throw new Error(`очікувалося «${label}», отримано «${row}»`);
    }
    return row.slice(prefix.length);
  };
  const amount = (row: string | undefined, label: string) => {
    const value = field(row, label);
    if (!/^\d+\.\d{2}$/.test(value)) throw new Error(`сума «${value}»`);
    return Number(value);
  };

  if (rows[0] !== 'ЧЕК') throw new Error('немає заголовка ЧЕК');
  const rules = rows.flatMap((r, i) => (RULE.test(r) ? [i] : []));
  if (rules.length !== 2 || rules[0] !== 4) throw new Error('роздільники');
  if (rows.length !== rules[1] + 5) throw new Error('кількість рядків');

  return {
    orderId: field(rows[1], 'Замовлення'),
    date: field(rows[2], 'Дата'),
    tier: field(rows[3], 'Рівень'),
    lines: rows.slice(rules[0] + 1, rules[1]).map((row) => {
      const m = LINE.exec(row);
      if (!m) throw new Error(`позиція «${row}»`);
      return {
        sku: m[1],
        qty: Number(m[2]),
        price: Number(m[3]),
        sum: Number(m[4]),
      };
    }),
    subtotal: amount(rows[rules[1] + 1], 'Сума'),
    discount: amount(rows[rules[1] + 2], 'Знижка'),
    shipping: amount(rows[rules[1] + 3], 'Доставка'),
    total: amount(rows[rules[1] + 4], 'До сплати'),
  };
}
