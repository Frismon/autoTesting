import express from 'express';
import { randomUUID } from 'node:crypto';

type Tier = 'basic' | 'silver' | 'gold';
interface Item {
  sku: string;
  price: number;
  qty: number;
}
interface Order {
  id: string;
  ownerId: string;
  tier: Tier;
  items: Item[];
  subtotal: number;
  total: number;
  createdAt: string;
}

const USERS = [
  { id: 'u1', email: 'alice@example.com', password: 'Secret123', tier: 'gold' as Tier },
  { id: 'u2', email: 'bob@example.com', password: 'Secret123', tier: 'basic' as Tier },
];
const DISCOUNT: Record<Tier, number> = { basic: 0, silver: 0.05, gold: 0.1 };
const round2 = (n: number) => Math.round(n * 100) / 100;

function toPublic({ ownerId, ...rest }: Order) {
  return rest;
}

function calcTotals(items: Item[], tier: Tier) {
  const subtotal = round2(items.reduce((s, i) => s + i.price * i.qty, 0));
  let rate = DISCOUNT[tier];
  if (subtotal >= 2000) rate += 0.05;
  const afterDiscount = round2(subtotal * (1 - Math.min(rate, 0.25)));
  const shipping = afterDiscount >= 1000 ? 0 : 60;
  return {
    subtotal,
    discount: round2(subtotal - afterDiscount),
    shipping,
    total: round2(afterDiscount + shipping),
  };
}

const money = (n: number) => n.toFixed(2);
const RULE = '-'.repeat(40);

/** Варіант 7: чек замовлення в текстовому форматі. */
function formatReceipt(order: Order): string {
  const t = calcTotals(order.items, order.tier);
  return [
    'ЧЕК',
    `Замовлення: ${order.id}`,
    `Дата: ${order.createdAt}`,
    `Рівень: ${order.tier}`,
    RULE,
    ...order.items.map(
      (i) => `${i.sku} ${i.qty} x ${money(i.price)} = ${money(i.price * i.qty)}`,
    ),
    RULE,
    `Сума: ${money(t.subtotal)}`,
    `Знижка: ${money(t.discount)}`,
    `Доставка: ${money(t.shipping)}`,
    `До сплати: ${money(t.total)}`,
    '',
  ].join('\n');
}

export function createApp() {
  const app = express();
  app.use(express.json());
  const tokens = new Map<string, string>();
  const orders = new Map<string, Order>();

  /** Чуже або неіснуюче замовлення — однаково undefined (далі 404). */
  const findOwnOrder = (id: string, userId: string) => {
    const order = orders.get(id);
    return order && order.ownerId === userId ? order : undefined;
  };

  app.post('/auth/login', (req, res) => {
    const user = USERS.find(
      (u) => u.email === req.body?.email && u.password === req.body?.password,
    );
    if (!user) return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    const token = randomUUID();
    tokens.set(token, user.id);
    res.json({ accessToken: token });
  });

  app.use('/orders', (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const userId = token ? tokens.get(token) : undefined;
    if (!userId) return res.status(401).json({ code: 'UNAUTHORIZED' });
    res.locals.user = USERS.find((u) => u.id === userId);
    next();
  });

  app.post('/orders', (req, res) => {
    const items: Item[] = req.body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ code: 'EMPTY_ORDER' });
    }
    for (const i of items) {
      if (typeof i.price !== 'number' || i.price < 0)
        return res.status(400).json({ code: 'INVALID_PRICE' });
      if (!Number.isInteger(i.qty) || i.qty <= 0)
        return res.status(400).json({ code: 'INVALID_QTY' });
    }
    const user = res.locals.user;
    const { subtotal, total } = calcTotals(items, user.tier);

    const order: Order = {
      id: randomUUID(),
      ownerId: user.id,
      tier: user.tier,
      items,
      subtotal,
      total,
      createdAt: new Date().toISOString(),
    };
    orders.set(order.id, order);
    res.status(201).location(`/orders/${order.id}`).json(toPublic(order));
  });

  app.get('/orders', (_req, res) => {
    const mine = [...orders.values()].filter(
      (o) => o.ownerId === res.locals.user.id,
    );
    res.json(mine.map(toPublic));
  });

  app.get('/orders/:id', (req, res) => {
    const order = findOwnOrder(req.params.id, res.locals.user.id);
    if (!order) return res.status(404).json({ code: 'NOT_FOUND' });
    res.json(toPublic(order));
  });

  app.get('/orders/:id/receipt', (req, res) => {
    const order = findOwnOrder(req.params.id, res.locals.user.id);
    if (!order) return res.status(404).json({ code: 'NOT_FOUND' });
    res
      .type('text/plain; charset=utf-8')
      .set('Content-Disposition', `inline; filename="receipt-${order.id}.txt"`)
      .set('Cache-Control', 'no-store')
      .send(formatReceipt(order));
  });

  app.delete('/orders/:id', (req, res) => {
    const order = findOwnOrder(req.params.id, res.locals.user.id);
    if (!order) return res.status(404).json({ code: 'NOT_FOUND' });
    orders.delete(order.id);
    res.status(204).end();
  });

  return app;
}
