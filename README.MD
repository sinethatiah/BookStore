# Stori Zetu
 
A full-stack online bookstore built for a real, operating bookshop. It replaces manual Excel-based inventory tracking and disconnected sales channels with a single, reliable system for stock, orders and payments.
 
**Live demo**
- Frontend: https://book-store-livid-beta.vercel.app
- Backend API: https://bookstore-a1ds.onrender.com/api/
The backend runs on a free hosting tier and sleeps when idle, so the first request after a quiet period can take up to a minute.
 
## Problem Statement
 
The shop this project is built for runs on a patchwork of manual processes:
 
- Inventory is tracked in Excel and updated only after a sale, so stock is wrong whenever entry is delayed
- Sales happen across several channels (social media and the website) with no shared source of truth
- Pre-orders exist only as a note in the item description, not as a real system state
- Payments are not verified online, so checkout relies on manual payment instructions
- Deliveries leave the shop with no record of their status
## Solution
 
Stori Zetu gives the shop one authoritative system of record for stock and orders. Stock is decremented automatically inside a database transaction when an order is placed. Pre-orders are a real status on each book. Payments are requested through M-Pesa and confirmed by callback, and deliveries are tracked on the order itself. Checkout prevents overselling even when several customers try to buy the last copy at once.
 
## Features
 
### Customers
- Landing page and a full catalog with search, category and status filters, sorting and pagination
- Book detail pages with in stock, pre-order and out of stock status
- Registration, login and automatic token refresh
- Cart with quantity updates
- Checkout with pickup or delivery
- M-Pesa STK push payment, with a retry option from the order page
- My Orders and order detail pages showing payment and delivery status
- Notify Me on out-of-stock books, with an email sent automatically on restock
### Admin
- Dashboard with Orders, Books and Categories tabs
- Update delivery status (pending, dispatched, delivered)
- Add books by searching Google Books (with an Open Library fallback) so title, author, ISBN, description and cover are filled in automatically
- Edit stock inline, delete books, add categories
- Role-based access control (customer and admin)
### Backend only
- Favorites API (models and endpoints are built; there is no frontend page yet)
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | Django 6, Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL |
| Payments | M-Pesa Daraja API (sandbox), STK push with callback |
| Background jobs | Celery with Redis (Upstash) |
| Email | SMTP (Gmail) |
| Book data | Google Books API, Open Library fallback |
| Hosting | Render (backend and database), Vercel (frontend) |
| Version control | Git and GitHub |
 
## System Design
 
The React frontend talks to the Django REST API over HTTPS using JWT access and refresh tokens. The backend owns the catalog, stock, orders and payment state.
 
- **Checkout** runs in one database transaction. It locks the affected book rows with `select_for_update()`, validates stock, computes the total on the server, creates the order and its items, decrements stock and clears the cart. If any step fails, nothing is saved.
- **Payments** are separate from order creation. An order starts with `payment_status=pending`. The M-Pesa callback endpoint updates the transaction record and the order to `paid` or `failed`.
- **Restock notifications**: when a book's stock goes from zero to positive, `Book.save()` queues one Celery task per subscriber. A worker sends the emails, so saving a book never waits on email delivery.
- **Permissions**: public read access for books and categories, authenticated and owner-scoped access for carts, orders and favorites, and admin-only writes for the catalog.
## Project Structure
 
```
BookStore/
  backend/
    BookStore/       project settings, URLs, Celery app
    BookStoreApp/    books, categories, cart, orders, favorites, notifications
    accounts/        custom user model with roles
    payments/        M-Pesa integration
  frontend/
    src/
      components/    Navbar, route guards, shared UI
      context/       auth state
      pages/         catalog, detail, cart, checkout, orders, admin
      services/      API layer
      styles/
```
 
## API Overview
 
All routes are under `/api/`.
 
| Area | Endpoints |
|---|---|
| Auth | `POST auth/register/`, `POST auth/login/`, `POST auth/refresh/`, `GET auth/me/` |
| Books | `GET books/` (supports `search`, `category`, `status`, `ordering`, `page`), `GET books/:id/`, `POST books/:id/notify_me/` |
| Categories | `GET categories/` |
| Cart | `GET cart/`, `POST cart-items/`, `PATCH cart-items/:id/`, `DELETE cart-items/:id/` |
| Orders | `POST orders/` (checkout), `GET orders/`, `GET orders/:id/` |
| Favorites | `GET favorites/`, `POST favorites/`, `DELETE favorites/:id/` |
| Payments | `POST payments/initiate/`, `POST payments/mpesa-callback/` |
| Admin only | `POST/PATCH/DELETE books/`, `POST categories/`, `PATCH orders/:id/update_delivery_status/` |
 
## Setup Instructions
 
### Prerequisites
Python 3.12 or newer, Node.js 18 or newer, and a local PostgreSQL database.
 
### Backend
 
```bash
git clone https://github.com/sinethatiah/BookStore.git
cd BookStore
 
python -m venv myenv
source myenv/bin/activate        # Windows: myenv\Scripts\activate
 
cd backend
pip install -r requirements.txt
```
 
Create `backend/.env` (no quotes around values):
 
```
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME
 
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
 
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
 
CELERY_BROKER_URL=
 
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=
```
 
Notes:
- If `DATABASE_URL` is missing, Django silently falls back to a local SQLite file. Set it, and confirm the database engine before you create data.
- Settings read every key above at startup, so the app will not start if one is missing.
- `EMAIL_HOST_PASSWORD` must be a Gmail app password, not your normal password.
- `CELERY_BROKER_URL` is a Redis URL. Upstash provides one on its free tier and requires the `rediss://` scheme.
Create the database, then run:
 
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
 
Plain `createsuperuser` gives the account the customer role. To use the admin dashboard, set the role afterwards:
 
```bash
python manage.py shell -c "from accounts.models import User; User.objects.filter(username='YOURUSERNAME').update(role='admin')"
```
 
Start the Celery worker in a second terminal (needed for restock emails):
 
```bash
celery -A BookStore worker --loglevel=info --pool=solo
```
 
The API runs at `http://127.0.0.1:8000/api/` and the Django admin at `http://127.0.0.1:8000/admin/`.
 
### Frontend
 
```bash
cd frontend
npm install
```
 
Create `frontend/.env`:
 
```
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_BOOKS_API_KEY=
```
 
```bash
npm run dev
```
 
The API will be available at `http://127.0.0.1:8000/api/`, and the Django admin at `http://127.0.0.1:8000/admin/`.
 
## Screenshots
 
*(Add once UI is built)*
 
## Challenges & Solutions
 
| Challenge | Solution |
|---|---|
| Inaccurate stock from manual Excel tracking | Stock is decremented automatically inside the checkout transaction |
| Pre-orders indistinguishable from in-stock items | Dedicated status field on each book |
| Overselling during simultaneous checkouts | Row locking with `select_for_update()` inside a database transaction, with all-or-nothing rollback |
| Clients able to tamper with totals and prices | Serializers make `total`, `price_at_purchase` and `user` read-only, and the server computes them |
| Permission checks crashing on anonymous requests | Custom permission classes check `is_authenticated` before reading the role |
| Order placed but payment fails | Order creation and payment are separate steps; the M-Pesa callback updates payment status, and the order page offers a retry |
| Restock emails slowing down admin saves | Emails are queued as Celery tasks and sent by a background worker |
| Browser blocked frontend requests to the deployed API | CORS origins are read from an environment variable instead of a hardcoded list |
| Migration ordering conflict with the custom user model | Reset the database and rebuilt migrations after registering the custom user app before its first migration |
| Manually typing book details for every new title | Admin book search auto-fills title, author, ISBN, description and cover |
 
## Known Limitations
 
- M-Pesa runs against the Daraja sandbox only, so no real money moves
- The free Render web service sleeps when idle
- The free Render PostgreSQL database expires after about 90 days and must be recreated or upgraded
- The Celery worker is not deployed to Render, so restock emails are only sent while a worker is running locally
## Future Improvements
 
### Accounts and Checkout
- Password reset flow
- Guest checkout with delivery contact details captured on the order
### Payments
- Production M-Pesa credentials and a verified paybill or till
### Notifications and Infrastructure
- Deploy the Celery worker as its own Render service
- SMS notifications alongside email
- Automated tests for checkout, permissions and serializers
- CI pipeline and Docker setup
- API rate limiting
### Catalog and Inventory
- Favorites page in the frontend
- Bulk CSV import with ISBN lookup
- Secondhand books with per-copy condition tracking
- Admin tool to log social-media sales against the same stock pool
- Hide exact stock counts from non-admin API responses
- Cloudinary uploads for cover images (covers are currently stored as URLs)
### Discovery
- AI-assisted book recommendations
- Admin analytics dashboard (views, top-selling books)
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