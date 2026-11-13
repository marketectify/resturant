# Master Foods & Pakwan Centre (MERN demo)

Online ordering demo for a Karachi restaurant: category menu, cart drawer, checkout (delivery or pickup, cash payment), table booking and an admin panel.

## Run it

1. Install MongoDB locally (or use Atlas). It is optional: without it the server runs on in-memory demo data that resets on restart.
2. Copy `server/.env.example` to `server/.env` and edit it.
3. `npm run install:all` then `npm run dev`
4. Site: http://localhost:5173 | Admin: http://localhost:5173/#/admin (password = `ADMIN_PASSWORD` in `.env`)

## Pages

| Route | What |
| --- | --- |
| `#/` | Menu with sticky category pills, search, cart drawer |
| `#/checkout` | Delivery / Pickup toggle, order form (mobile number format `03xx-xxxxxxx`), cash payment, "remember my details" (stored only in the customer's browser), order confirmation with item list, "Send order on WhatsApp" button |
| `#/track` | Order tracking: order number + the mobile number used for the order, shows a progress timeline |
| `#/book` | Table booking |
| `#/admin` | Orders (with status), bookings and menu management |

## Customise

- Business details (name, phone, hours, map, delivery areas): `client/src/config.js`
- Menu items and categories: `shared/menu.json` (used as the first-run seed and as the offline fallback), or add items from the admin panel. Item pictures: set an image URL in the admin form, otherwise an emoji tile is shown.
- Delivery fee: `DELIVERY_FEE` in `server/.env` (default 180). Prices and totals are always calculated on the server.
- Background: `client/public/bg.svg` (fixed behind the whole site). To use your own photo, copy it to `client/public/bg.jpg` and change `/bg.svg` to `/bg.jpg` in `client/src/style.css` (`body::before`).

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

`npm test` runs the order pricing, order type, order tracking lookup and validation tests.


## Food photos

Drop photos into `client/public/menu/` named after the item (`chicken-biryani.jpg`, `seekh-kabab.jpg`, ...; see `client/public/menu/README.txt`). They show up automatically, and items without a photo keep the emoji tile. An image URL on the item (menu.json / admin form) takes priority.

## Menu page

The home page lists every category in one scrolling page. Clicking a category tab scrolls to that section, and scrolling the page switches the active tab.

## Demo mode (no server)

When the built site is on plain static hosting there is no `/api`, so `client/src/demo.js` answers the calls inside the browser (data kept in that browser's localStorage). Ordering, tracking, booking and the admin panel all work; admin password in demo mode is `master123`. Orders are only visible in the browser that placed them. With the real Express server running, the real API is used instead.

## Real server + MongoDB (Hostinger Node.js app + MongoDB Atlas)

1. **Database**: create a free MongoDB Atlas cluster (M0). Database Access -> add a user (username + password). Network Access -> add `0.0.0.0/0` (Hostinger's IP is not fixed). Connect -> Drivers -> copy the connection string and put the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/masterfoods?retryWrites=true&w=majority`
2. **Hostinger**: Websites -> Add website -> Node.js Apps -> import the GitHub repo `marketectify/resturant`, branch `main`. Settings:
   - Build command: `npm run build` (installs everything and builds the client)
   - Start command: `npm start`, entry file `server/index.js`, Node 20 or newer
   - Environment variables: `MONGO_URI` (the string above), `ADMIN_PASSWORD` (your own), `DELIVERY_FEE` (optional, default 180)
3. Open `https://<your-domain>/api/health`. `{"ok":true,"db":"mongodb"}` means orders are stored in MongoDB; `"db":"memory"` means the connection failed (the Hostinger logs show why).

The Express server serves the built site and the API from the same address, so no extra setup is needed. The first start fills the menu from `shared/menu.json`.

## Admin login

Password is the `ADMIN_PASSWORD` environment variable (default `master123` when it is not set). Stray spaces or quotes around the value are ignored. After changing the variable in Hostinger, redeploy / restart the app. `/api/health` shows `"adminPassword":"custom"` or `"default"` so you can tell which one is active. Login tokens are signed, so a restart does not log you out.

## Adding menu items

New items added to `shared/menu.json` are inserted into MongoDB once on the next start (bump `SEED_VERSION` in `server/index.js`). Items deleted later in the admin panel stay deleted.

Run `node scripts/photos.mjs` to see which items still need a photo. Photos can be .jpg, .webp, .png or .jpeg.

## Photo credits
Menu photos without a local file are hot-linked from Unsplash (map by name/category in `client/src/photos.js`). Photographers: Nathan Dumlao, Mario Raj, Yubraj Timsina, Eugene Krasnaok, tommao wang, Z Grills Australia, Hamid Roshaan, Frank from 5 AM Ramen, joe boshra, Zayed Ahmed Zadu, Durenne Loris, You Le, nrd, ShengGeng Lin. Real restaurant photos placed in `client/public/menu/<slug>.jpg` take priority.
