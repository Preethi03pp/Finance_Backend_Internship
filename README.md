# Finance Backend API

A RESTful backend for a finance dashboard system with role-based access control, built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
   npm install
```
3. Create a `.env` file in the root directory (see `.env.example`):
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_db
JWT_SECRET=your_secret_key_here
4. Start the server:
```bash
   # production
   npm start

   # development (auto-reload)
   npm run dev
```

The API will run at `http://localhost:5000`

---

## Roles & Permissions

| Role | Read Transactions | Summary & Stats | Create/Edit/Delete | Manage Users |
|---------|:-:|:-:|:-:|:-:|
| viewer | ✅ | ❌ | ❌ | ❌ |
| analyst | ✅ | ✅ | ❌ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ |

> New users registered via `/api/auth/register` are always assigned the `viewer` role by default. Only admins can create users with elevated roles.

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user (always viewer) |
| POST | `/api/auth/login` | Public | Login and receive JWT token |

### Transactions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/transactions` | viewer+ | Get all transactions (paginated) |
| POST | `/api/transactions` | admin | Create a transaction |
| GET | `/api/transactions/summary` | analyst+ | Dashboard summary |
| GET | `/api/transactions/stats` | analyst+ | Expense statistics |
| GET | `/api/transactions/:id` | viewer+ | Get single transaction |
| PUT | `/api/transactions/:id` | admin | Full update |
| PATCH | `/api/transactions/:id` | admin | Partial update |
| DELETE | `/api/transactions/:id` | admin | Delete transaction |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users` | admin | List all users |
| POST | `/api/users` | admin | Create user with any role |
| PATCH | `/api/users/:id` | admin | Update role or active status |
| DELETE | `/api/users/:id` | admin | Delete user |

---

## Query Parameters (GET /api/transactions)

| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by `income` or `expense` |
| `category` | string | Filter by category name |
| `startDate` | date | Filter from date (YYYY-MM-DD) |
| `endDate` | date | Filter to date (YYYY-MM-DD) |
| `search` | string | Search in description |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 5) |

---

## Example Requests

### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Transaction (Admin)
```json
POST /api/transactions
Authorization: Bearer <token>
{
  "amount": 5000,
  "type": "income",
  "category": "Salary",
  "description": "Monthly salary",
  "date": "2024-01-15"
}
```

### Dashboard Summary (Analyst+)
GET /api/transactions/summary
Authorization: Bearer <token>
---

## Assumptions & Design Decisions

- Non-admin users can only view their own transactions; admins see all transactions
- Registration is always `viewer` role — elevated roles must be assigned by an admin
- Transactions are hard deleted; users are also hard deleted (audit trail can be added as a future enhancement)
- JWT tokens expire after 1 day
- Stats (min/max/avg) are computed using MongoDB aggregation for performance

---

## Project Structure
├── app.js                  # Express app setup
├── server.js               # Entry point
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js   # Register, login
│   ├── transactionController.js
│   └── userController.js
├── middleware/
│   ├── authMiddleware.js   # JWT protect + role guard
│   ├── errorMiddleware.js  # Global error handler
│   └── validate.js         # express-validator runner
├── models/
│   ├── Transaction.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── transactionRoutes.js
│   └── userRoutes.js
└── validators/
└── transactionValidator.js