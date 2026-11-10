# Master Foods & Pakwan Centre (MERN demo)

Online ordering demo for a Karachi restaurant: category menu, cart drawer, checkout (delivery orders), table booking and an admin panel.

## Run it

1. Install MongoDB locally (or use Atlas). It is optional: without it the server runs on in-memory demo data that resets on restart.
2. Copy `server/.env.example` to `server/.env` and edit it.
3. `npm run install:all` then `npm run dev`
4. Site: http://localhost:5173 | Admin: http://localhost:5173/#/admin (password = `ADMIN_PASSWORD` in `.env`)

## Pages

| Route | What |
| --- | --- |
| `#/` | Menu with sticky category pills, search, cart drawer |
| `#/checkout` | Delivery order form (mobile number format `03xx-xxxxxxx`) |
| `#/book` | Table booking |
| `#/admin` | Orders (with status), bookings and menu management |

## Customise

- Business details (name, phone, hours, map, delivery areas): `client/src/config.js`
- Menu items and categories: `shared/menu.json` (used as the first-run seed and as the offline fallback), or add items from the admin panel. Item pictures: set an image URL in the admin form, otherwise an emoji tile is shown.
- Delivery fee: `DELIVERY_FEE` in `server/.env` (default 180). Prices and totals are always calculated on the server.
- Background: `client/public/bg.svg` (fixed behind the whole site).

## Offline / static demo mode

If the API cannot be reached (for example the client is hosted on a static host), the menu comes from `shared/menu.json` and placing an order shows a clearly marked demo confirmation instead of sending anything. If the API is hosted elsewhere, build the client with `VITE_API_URL=https://your-api.example.com`.

## Deploy as one app

```
npm run install:all
npm run build   # builds client/dist
npm start       # the Express server also serves client/dist
```

Set `ADMIN_PASSWORD` and `MONGO_URI` in the server environment. If your host sets `NODE_ENV=production` during install, make sure dev dependencies (Vite) are installed for the build step.

## Tests

`npm test` runs the order pricing and validation tests.
