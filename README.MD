# Stori Zetu 

An online bookstore platform built for a real, operating bookshop — replacing manual Excel-based inventory tracking and disconnected sales channels with a single, reliable system for stock and orders.

## Problem Statement

The shop this project is built for currently runs on a patchwork of manual processes:

- Inventory is tracked in Excel, updated only after a sale — leading to inaccurate stock when entry is delayed
- Sales happen across multiple channels (social media + website) with no shared source of truth
- Pre-orders exist only as a note in the item description, not a real system state
- No online payment verification — checkout relies on manual payment instructions

Stori Zetu addresses these by centralizing stock and order data, so it's accurate regardless of which channel a sale comes through.

## Solution

Stori Zetu solves this by giving the shop a single, authoritative system of record for stock and orders — automatically updated the moment a sale is confirmed, whether it happens through the website checkout or is logged manually from a social media sale. Pre-orders are tracked as a real status rather than free text, deliveries are tracked alongside orders instead of being invisible once dispatched, and checkout is built to prevent overselling even when multiple customers try to buy the last copy at once.

## Features

### User-Facing
- Browse and filter books by category
- Cart and checkout
- Real-time stock status (in stock / pre-order / out of stock)
- Notify-me alerts for restocks
- Favorites
- Choice of pickup or delivery at checkout, with delivery address and fee

### Admin-Facing
- Stock management (add, edit, adjust)
- Manual sale logging (for social-media-driven sales, kept in sync with website stock)
- Book listing and categorization
- Book traffic / basic analytics
- Delivery status tracking (mark orders as dispatched / delivered)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Django (REST API) |
| Database | PostgreSQL |
| Image hosting/CDN | Cloudinary |
| Payments | M-Pesa |
| Version control | Git / GitHub |

## System Design

The frontend (React) handles browsing, cart, and checkout UI. The backend (Django) owns the stock record, order state, and catalog data, exposing REST endpoints consumed by the frontend. Stock changes are applied as atomic database operations so concurrent checkouts and manual sale entries can't push stock below zero, regardless of which channel triggered the sale.

## API Endpoints

### Auth
```
POST   /api/auth/register/
POST   /api/auth/login/
POST   /api/auth/logout/
GET    /api/auth/me/
```

### Books & Categories
```
GET    /api/books/
GET    /api/books/:id/
GET    /api/categories/
```

### Cart
```
GET    /api/cart/
POST   /api/cart/items/
PATCH  /api/cart/items/:id/
DELETE /api/cart/items/:id/
```

### Orders
```
POST   /api/orders/
GET    /api/orders/
GET    /api/orders/:id/
```

### Favorites & Notifications
```
GET    /api/favorites/
POST   /api/favorites/
DELETE /api/favorites/:id/
POST   /api/books/:id/notify-me/
```

### Admin
```
GET    /api/admin/books/
POST   /api/admin/books/
PATCH  /api/admin/books/:id/
DELETE /api/admin/books/:id/
POST   /api/admin/books/import/
POST   /api/admin/sales/
POST   /api/admin/categories/
PATCH  /api/admin/categories/:id/
DELETE /api/admin/categories/:id/
GET    /api/admin/analytics/
PATCH  /api/admin/orders/:id/delivery-status/
```

## Setup Instructions

### Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

### Environment Variables
Create a `.env` file in the backend directory with:
```
SECRET_KEY=
DATABASE_URL=
CLOUDINARY_URL=
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
```

## Screenshots

*(Add once UI is built)*

## Challenges & Solutions

| Challenge | Solution |
|---|---|
| Inaccurate stock from manual Excel tracking | Automatic stock decrement on every confirmed sale |
| Sales split across social media and website | Admin manual-sale-logging tool feeding the same stock pool |
| Pre-orders indistinguishable from in-stock items | Dedicated status field on each book |
| Overselling risk during simultaneous checkouts | Atomic stock decrement at the database level |
| Deliveries handled via courier with no visibility on the platform | In-house delivery tracking — order carries delivery method, address, fee, and status (pending / dispatched / delivered), managed by admin |

## Future Improvements

*(To be added)*

## Contributing
 
Contributions are welcome. If you'd like to contribute or suggest something, feel free to open an issue first so it can be discussed.
 
1. Fork the repository
2. Clone your fork locally:
```bash
   git clone https://github.com/<your-username>/BookStore.git
```
3. Install dependencies (see Setup Instructions above)
4. Create a new branch for your feature:
```bash
   git checkout -b feature/your-feature
```
5. Make your changes and commit:
```bash
   git commit -m "Add your feature"
```
6. Push to your branch:
```bash
   git push origin feature/your-feature
```
7. Open a pull request on the original repository


Original repo:
```bash
git clone https://github.com/sinethatiah/BookStore.git
```

## Licensing

This project is licensed under the [MIT License](https://github.com/sinethatiah/BookStore/blob/main/LICENSE) - see the [LICENSE](https://github.com/sinethatiah/BookStore/blob/main/LICENSE) file for details.