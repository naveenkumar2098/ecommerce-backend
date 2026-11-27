# Ohm Supply frontend

A React and Vite app for the ecommerce API in the parent folder. It has two parts:

- **A storefront** where customers can:
  - browse by category and search
  - keep a cart and place orders
  - follow their orders and report a problem with one
- **A workspace for staff**, where each role sees only its own tools:
  - suppliers: their products
  - support: the issue queue
  - admins: products, orders, issues and people

## Run it locally

You need Node 20.19 or newer and a running API.

1. Start the API from the repository root:

   ```bash
   npm start
   ```

   Set `CLIENT_URL=http://localhost:5173` in the API's `.env`, so password-reset emails link to this app's reset page.

2. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open http://localhost:5173.

The dev server forwards every `/api` request to `http://localhost:8000`, so the API needs no CORS setup. If the API runs somewhere else, start the dev server with `API_TARGET=http://host:port npm run dev`.

## Staff accounts

Everyone signs up as a customer. To create the first admin, sign up in the app, then change that account's role in MongoDB:

```bash
mongosh "$MONGO_URI" --eval 'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })'
```

Sign out and back in. From then on, admins can change anyone's role under **Workspace → People**.

## Build for production

```bash
npm run build
```

This writes static files to `frontend/dist/`. Serve them from any static host, and route `/api` on the same domain to the API. Also send unknown paths to `index.html`, because the app uses client-side routing.

## Design notes

- **Palette:** anodized aluminium (`#E4E8EB`), panel (`#F6F7F8`), graphite text (`#1E252B`), slate (`#56616B`), rules (`#C3CAD0`), and one indicator amber (`#FFB000`).
- **Amber:** used only for the main action on each page, selected states, and lit stock segments. It is never used as text colour.
- **Type:** one family, Archivo. Its width axis is used at 125% for product names and the category index, and at normal width for reading text.
- **Stock meter:** stock is shown as a 10-segment level meter. This is the one ornament in the design; everything else stays quiet.
- **Accessibility:** both light and dark modes follow the system setting. Keyboard focus is always visible, and the toast respects reduced-motion settings.
