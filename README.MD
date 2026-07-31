# Stori Zetu
 
An online bookstore backend built for a real, operating bookshop — replacing manual Excel-based inventory tracking and disconnected sales channels with a single, reliable system for stock and orders.
 
## Problem Statement
 
The shop this project is built for currently runs on a patchwork of manual processes:
 
- Inventory is tracked in Excel, updated only after a sale — leading to inaccurate stock when entry is delayed
- Sales happen across multiple channels (social media + website) with no shared source of truth
- Pre-orders exist only as a note in the item description, not a real system state
- No online payment verification — checkout relies on manual payment instructions
Stori Zetu addresses these by centralizing stock and order data, so it's accurate regardless of which channel a sale comes through.
 
## Solution
 
Stori Zetu solves this by giving the shop a single, authoritative system of record for stock and orders — automatically updated the moment a sale is confirmed. Pre-orders are tracked as a real status rather than free text, deliveries are tracked alongside orders instead of being invisible once dispatched, and checkout is built to prevent overselling even when multiple customers try to buy the last copy at once.
 
## Features
 
### User-Facing
- Browse and filter books by category
- Cart and checkout
- Real-time stock status (in stock / pre-order / out of stock)
- Notify-me subscription for restock alerts (records interest; sending notifications is a future improvement)
- Favorites
### Admin-Facing
- Stock management (add, edit, adjust)
- Book listing and categorization
- Role-based access control (customer vs. admin)
- Delivery status tracking (mark orders as dispatched / delivered)
## Tech Stack
 
| Layer | Technology |
|---|---|
| Backend | Django (REST API) |
| Database | PostgreSQL |
| Auth | JWT (djangorestframework-simplejwt) |
| Version control | Git / GitHub |
 
## System Design
 
The backend (Django) owns the stock record, order state, and catalog data, exposing REST endpoints. Stock changes are applied as atomic database operations using `select_for_update()` inside a transaction, so concurrent checkouts can't push stock below zero. Order totals and item prices are computed server-side, never trusted from client input.
 
## Setup Instructions
 
Clone the repository:
```bash
git clone https://github.com/sinethatiah/BookStore.git
cd BookStore
```
 
Create and activate a virtual environment:
```bash
python -m venv myenv
source myenv/bin/activate   # Windows: myenv\Scripts\activate
```
 
Install dependencies:
```bash
pip install -r requirements.txt
```
 
Create a `.env` file in the project root with:
```
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_NAME=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_HOST=localhost
DATABASE_PORT=5432
```
 
Make sure a PostgreSQL database matching `DATABASE_NAME` exists locally before running migrations.
 
Run migrations:
```bash
python manage.py migrate
```
 
Create a superuser (for admin access):
```bash
python manage.py createsuperuser
```
 
Start the development server:
```bash
python manage.py runserver
```
 
The API will be available at `http://127.0.0.1:8000/api/`, and the Django admin at `http://127.0.0.1:8000/admin/`.
 
## Screenshots
 
*(Add once UI is built)*
 
## Challenges & Solutions
 
| Challenge | Solution |
|---|---|
| Inaccurate stock from manual Excel tracking | Automatic stock decrement on every confirmed sale |
| Pre-orders indistinguishable from in-stock items | Dedicated status field on each book |
| Overselling risk during simultaneous checkouts | Atomic stock decrement with row locking (`select_for_update`) inside a database transaction |
| Permission checks crashing on anonymous requests | Hardened custom permission classes to check `is_authenticated` before checking role |
| Clients able to tamper with order totals and prices | Locked down serializers so `total`, `price_at_purchase`, and `user` fields are computed server-side and read-only |
| Migration ordering conflict between custom user app and Django's admin app | Reset database and rebuilt migrations after correctly registering the custom user app before its first migration |
 
## Future Improvements
 
### Frontend
- React frontend to consume this API
### Notifications
- Actually send notifications (email/SMS) when a book comes back in stock, rather than just recording subscriber interest via `StockNotification`
- Trigger detection on restock (e.g. override `Book.save()` to detect the `out_of_stock` → `in_stock` transition)
### Payments
- M-Pesa (Daraja API) integration for automatic payment verification, replacing manual payment instructions
### Delivery
- Full end-to-end testing of the delivery status workflow (pending → dispatched → delivered)
- Real courier API integration for live tracking
- Zone-based delivery fee calculation instead of a flat rate
### Inventory & Catalog
- Bulk CSV import for adding books in bulk, with ISBN lookup (Google Books/Open Library API) to auto-fill title, author, and cover image
- Secondhand book support with per-copy condition tracking
- Admin tool for logging social-media-driven sales directly against the same stock pool
### Checkout & Accounts
- Guest checkout (order without creating an account), with delivery contact fields captured directly on the order
- Password reset / forgot password flow
### Media
- Cloudinary integration for book cover uploads (currently a plain URL field)
### Testing & Infrastructure
- Automated tests for checkout logic, permissions, and serializer validation
- CI pipeline and Docker setup for consistent local development
- API rate limiting / throttling
### Discovery
- Full-text search across the book catalog
- Basic analytics dashboard for admin (views, top-selling books)
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