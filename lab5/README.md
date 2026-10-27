# Лабораторна робота № 5 — Автоматизація тестування REST API

**Виконавець:** Бурдай Василь Миколайович, 4 курс, спеціальність «Інженерія програмного забезпечення»
**Варіант:** 7 — `GET /orders/:id/receipt`: чек у текстовому форматі; перевірка Content-Type і вмісту.

## Запуск

```bash
npm ci              # залежності
npm test            # Vitest + Supertest
npm start           # сервер на http://127.0.0.1:3000 (для Postman)
npm run newman      # колекція postman/orders.postman_collection.json, звіт results/newman.xml
```

Колекція використовує `baseUrl = http://127.0.0.1:3000`, щоб запити не потрапляли до іншого
процесу, який може слухати `[::1]:3000` (на Windows `localhost` спершу резолвиться в IPv6).
