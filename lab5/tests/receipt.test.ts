import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { login, makeOrderPayload } from './helpers';
import { expectSchema } from './schema';
import { parseReceipt } from './receipt-parser';
import { receiptSchema, errorSchema } from './schemas/receipt.schema';

type App = ReturnType<typeof createApp>;

async function createOrder(app: App, token: string, items?: unknown) {
  const res = await request(app)
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
    .send(items === undefined ? makeOrderPayload() : { items });
  if (res.status !== 201) throw new Error(`create failed: ${res.status}`);
  return res.body as { id: string; createdAt: string; total: number };
}

const getReceipt = (app: App, id: string, token?: string) => {
  const req = request(app).get(`/orders/${id}/receipt`);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('GET /orders/:id/receipt', () => {
  let app: App;
  let bob: string;

  beforeEach(async () => {
    app = createApp(); // власний застосунок і власні дані
    bob = await login(app, 'bob@example.com'); // basic
  });

  it('повертає чек: 200, text/plain, вміст з позиціями й сумами', async () => {
    const order = await createOrder(app, bob);

    const res = await getReceipt(app, order.id, bob);

    expect(res.status).toBe(200); // рівень 1
    expect(res.text).toBe(
      [
        'ЧЕК',
        `Замовлення: ${order.id}`,
        `Дата: ${order.createdAt}`,
        'Рівень: basic',
        '-'.repeat(40),
        'SKU-A 1 x 500.00 = 500.00',
        '-'.repeat(40),
        'Сума: 500.00',
        'Знижка: 0.00',
        'Доставка: 60.00',
        'До сплати: 560.00',
        '',
      ].join('\n'),
    ); // рівень 3
  });

  it('заголовки: Content-Type, Content-Disposition, Cache-Control', async () => {
    const order = await createOrder(app, bob);

    const res = await getReceipt(app, order.id, bob);

    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.headers['content-disposition']).toBe(
      `inline; filename="receipt-${order.id}.txt"`,
    );
    expect(res.headers['cache-control']).toBe('no-store'); // рівень 4
  });

  it('структура чека відповідає схемі', async () => {
    const order = await createOrder(app, bob, [
      { sku: 'SKU-A', price: 250.5, qty: 2 },
      { sku: 'SKU-B', price: 10, qty: 3 },
    ]);

    const res = await getReceipt(app, order.id, bob);

    expectSchema(parseReceipt(res.text), receiptSchema); // рівень 2
  });

  it.each([
    {
      user: 'bob@example.com',
      items: [{ sku: 'SKU-A', price: 500, qty: 1 }],
      expected: { subtotal: 500, discount: 0, shipping: 60, total: 560 },
    },
    {
      user: 'bob@example.com',
      items: [{ sku: 'SKU-A', price: 999.99, qty: 1 }],
      expected: { subtotal: 999.99, discount: 0, shipping: 60, total: 1059.99 },
    },
    {
      user: 'bob@example.com',
      items: [{ sku: 'SKU-A', price: 1000, qty: 1 }],
      expected: { subtotal: 1000, discount: 0, shipping: 0, total: 1000 },
    },
    {
      user: 'alice@example.com',
      items: [{ sku: 'SKU-A', price: 1200, qty: 1 }],
      expected: { subtotal: 1200, discount: 120, shipping: 0, total: 1080 },
    },
    {
      user: 'alice@example.com',
      items: [{ sku: 'SKU-A', price: 1050, qty: 1 }],
      expected: { subtotal: 1050, discount: 105, shipping: 60, total: 1005 },
    },
    {
      user: 'bob@example.com',
      items: [{ sku: 'SKU-B', price: 1000, qty: 2 }],
      expected: { subtotal: 2000, discount: 100, shipping: 0, total: 1900 },
    },
    {
      user: 'alice@example.com',
      items: [
        { sku: 'SKU-A', price: 250.5, qty: 2 },
        { sku: 'SKU-B', price: 10, qty: 3 },
      ],
      expected: { subtotal: 531, discount: 53.1, shipping: 60, total: 537.9 },
    },
  ])(
    'підсумки чека: $user, сума $expected.subtotal → $expected.total',
    async ({ user, items, expected }) => {
      const token = await login(app, user);
      const order = await createOrder(app, token, items);

      const receipt = parseReceipt((await getReceipt(app, order.id, token)).text);

      expect(receipt).toMatchObject(expected);
      expect(receipt.total).toBe(order.total); // узгоджено з POST /orders
    },
  );

  it('позиції чека: кількість, ціна й сума рядка', async () => {
    const order = await createOrder(app, bob, [
      { sku: 'SKU-A', price: 250.5, qty: 2 },
      { sku: 'SKU-B', price: 10, qty: 3 },
    ]);

    const receipt = parseReceipt((await getReceipt(app, order.id, bob)).text);

    expect(receipt.lines).toEqual([
      { sku: 'SKU-A', qty: 2, price: 250.5, sum: 501 },
      { sku: 'SKU-B', qty: 3, price: 10, sum: 30 },
    ]);
  });

  it('чек не розкриває внутрішній ідентифікатор власника', async () => {
    const order = await createOrder(app, bob);

    const res = await getReceipt(app, order.id, bob);

    expect(res.text).not.toContain('u2');
    expect(res.text).not.toMatch(/owner/i);
  });

  it('отримання чека не змінює замовлення (безпечний метод)', async () => {
    const order = await createOrder(app, bob);
    const auth = { Authorization: `Bearer ${bob}` };
    const before = await request(app).get(`/orders/${order.id}`).set(auth);

    await getReceipt(app, order.id, bob);
    await getReceipt(app, order.id, bob);
    const after = await request(app).get(`/orders/${order.id}`).set(auth);

    expect(after.body).toEqual(before.body); // рівень 5
  });

  it('після видалення замовлення чек недоступний', async () => {
    const order = await createOrder(app, bob);
    expect((await getReceipt(app, order.id, bob)).status).toBe(200);

    await request(app)
      .delete(`/orders/${order.id}`)
      .set('Authorization', `Bearer ${bob}`);

    const res = await getReceipt(app, order.id, bob);
    expect(res.status).toBe(404); // рівень 5: побічний ефект DELETE
  });

  describe('доступ', () => {
    it.each([
      { name: 'без токена', header: undefined },
      { name: 'підроблений токен', header: 'Bearer invalid-token' },
      { name: 'без префікса Bearer', header: 'some-token' },
    ])('$name → 401 UNAUTHORIZED', async ({ header }) => {
      const order = await createOrder(app, bob);

      const req = request(app).get(`/orders/${order.id}/receipt`);
      if (header) req.set('Authorization', header);
      const res = await req;

      expect(res.status).toBe(401);
      expect(res.headers['content-type']).toMatch(/^application\/json/);
      expectSchema(res.body, errorSchema);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('чек чужого замовлення → 404, а не 403', async () => {
      const alice = await login(app, 'alice@example.com');
      const order = await createOrder(app, alice);

      const res = await getReceipt(app, order.id, bob);

      expect(res.status).toBe(404);
      expectSchema(res.body, errorSchema);
      expect(res.body.code).toBe('NOT_FOUND');
    });

    it.each([
      { name: 'неіснуючий UUID', id: '00000000-0000-4000-8000-000000000000' },
      { name: 'довільний рядок', id: 'not-an-id' },
    ])('чек для ідентифікатора «$name» → 404', async ({ id }) => {
      const res = await getReceipt(app, id, bob);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ code: 'NOT_FOUND' });
    });
  });
});
