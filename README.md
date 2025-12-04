# Tile Stock Manager — Frontend (React + Vite)

This repository contains a lightweight React + Vite frontend scaffold for the Tile Stock Manager UI described in the wireframe.

Quick start

1. Install dependencies

```bash
cd /Users/amanmahfuz/Documents/stock
npm install
```

2. Start the dev server (Vite)

```bash
npm run dev
```

Open `http://localhost:5173` (or the URL Vite prints).

Notes

- The frontend expects a backend API at `http://localhost:4000/api` with endpoints such as `POST /api/login`, `GET /api/products`, `POST /api/products`.
- For development you can run the included mock server which implements `POST /api/signup`, `POST /api/login`, and product CRUD in memory.
- Authentication saves `{ token, role }` to `localStorage` under `tsm_user`. Adjust `src/services/api.js` if your backend uses a different shape or port.
- Barcode scanning UIs are placeholders (Scan Barcode buttons) — integrate with a camera/scanner library as needed.

Running the mock server (dev)

1. Install any new dependencies (Express + CORS):

```bash
cd /Users/amanmahfuz/Documents/stock
npm install
```

2. Run the mock server:

```bash
npm run mock
```

The mock server listens on `http://localhost:4000` and will allow you to test signup/login and product CRUD without a real backend.

Next steps you might want me to do:
- Wire up more detailed API endpoints and error handling.
- Add unit tests and E2E tests.
- Integrate a camera barcode scanner (e.g., `@zxing/library`) for product scanning.
# stock
