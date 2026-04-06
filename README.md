# Finance Backend API

A RESTful backend API for a finance dashboard application, featuring role-based access control (RBAC), JWT authentication, transaction management, and aggregated analytics endpoints.

🔗 **Live API:** [https://finance-backend-internship.onrender.com](https://finance-backend-internship.onrender.com)

---

## 📌 Highlights

- Designed with scalability and maintainability in mind through a clean layered architecture
- Implements real-world RBAC patterns with three distinct roles enforced at the route level
- Demonstrates both CRUD and analytical backend capabilities — not just basic data management
- Goes beyond the core requirements with bulk operations, soft delete, rate limiting, and a full test suite

---

## ⚡ Quick Start

```bash
git clone <repo-url>
cd finance-backend-internship
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run dev
```

The API will be available at `http://localhost:5000`.

---

## Table of Contents

- [Overview](#overview)
- [Example Use Case](#example-use-case)
- [Key Features](#key-features)
- [Architecture Design](#architecture-design)
- [Assignment Requirements Mapping](#assignment-requirements-mapping)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Creating the First Admin User](#creating-the-first-admin-user)
  - [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [API Reference](#api-reference)
  - [Auth Routes](#auth-routes)
  - [User Routes](#user-routes)
  - [Financial Records API](#financial-records-api)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Performance Considerations](#performance-considerations)
- [Data Models](#data-models)
- [Testing](#testing)
- [Postman Collection](#postman-collection)
- [Assumptions and Design Decisions](#assumptions-and-design-decisions)
- [Deployment](#deployment)
  - [Pre-Deployment Checklist](#pre-deployment-checklist)
  - [MongoDB Atlas Setup](#mongodb-atlas-setup)
  - [Deploy to Render](#deploy-to-render)
  - [Setting Environment Variables on Render](#setting-environment-variables-on-render)
  - [Verifying the Deployment](#verifying-the-deployment)

---

## Overview

This project is designed to demonstrate backend engineering skills including API design, role-based access control, data modeling, and analytics processing in a real-world finance dashboard scenario.

The Finance Backend API serves as the server-side foundation for a finance dashboard. It provides endpoints to manage users and financial transactions, with a granular permission system (Admin / Analyst / Viewer), JWT-secured routes, soft deletion, bulk operations, and aggregated analytics including category breakdowns, monthly trends, weekly trends, and financial health indicators.

> **Note:** The free tier on Render spins down after 15 minutes of inactivity. The first request after idle may take 30–60 seconds. This is expected behaviour.

---

## Example Use Case

An **Admin** logs in and creates financial transactions, manages users, and runs bulk operations. An **Analyst** reviews all transactions, filters by date and category, and accesses dashboard analytics to identify spending trends. A **Viewer** accesses only the summary and analytics endpoints — they can see totals, trends, and category breakdowns without ever touching raw transaction data.

---

## Key Features

- **Role-Based Access Control** — Three roles (Admin / Analyst / Viewer) with distinct permissions enforced at the route level
- **JWT Authentication** — Stateless auth with token expiry and per-request account status verification
- **Financial Records CRUD** — Full create, read, update, delete with filtering and pagination
- **Advanced Analytics** — Dashboard summary, category breakdown, monthly trends, weekly trends, top spending categories, and financial health indicators
- **Bulk Operations** — Create, update, and delete up to 100 transactions or 50 users in a single request
- **Soft Delete** — Records are never permanently removed; deleted data is flagged and excluded from queries
- **Rate Limiting** — Global and login-specific rate limits to prevent abuse
- **Input Validation** — Field-level validation with structured error responses
- **Unit and Integration Testing** — Jest + Supertest test suite covering auth and transaction flows

---

## Architecture Design

The project follows a **layered architecture** with clear separation of concerns:

```
Request → Routes → Middleware → Controllers → Services → Models → MongoDB
```

| Layer | Responsibility |
|---|---|
| **Routes** | Define endpoints and apply middleware chains |
| **Middleware** | Handle authentication (`protect`), authorization (`authorizeRoles`), validation (`validate`), and error catching (`errorHandler`) |
| **Controllers** | Handle HTTP request/response — parse input, call services or models, return responses |
| **Services** | Contain complex business logic and aggregation queries (e.g. analytics, bulk operations) |
| **Models** | Define MongoDB schemas, indexes, and data constraints via Mongoose |

This separation improves maintainability, testability, and scalability. Controllers stay thin — they do not contain business logic directly. The `transactionService.js` handles all aggregation pipelines so the controller remains clean and the logic is reusable and independently testable.

---

## Assignment Requirements Mapping

| Requirement | Implementation |
|---|---|
| User and Role Management | `POST/GET/PUT/PATCH/DELETE /api/users` + `authorizeRoles` middleware |
| Financial Records Management | Full CRUD on `/api/transactions` with filtering, pagination, and soft delete |
| Dashboard Summary APIs | `/summary`, `/stats`, `/weekly-trends`, `/top-categories` endpoints |
| Access Control Logic | `protect` + `authorizeRoles` middleware applied per route |
| Validation and Error Handling | `express-validator` + global `errorHandler` middleware with structured error codes |
| Data Persistence | MongoDB via Mongoose with indexes on frequently queried fields |
| Bulk Operations (optional) | Bulk create/update/delete for both users and transactions |
| Soft Delete (optional) | `isDeleted` flag on both User and Transaction models |
| Rate Limiting (optional) | `express-rate-limit` — global 100 req/15 min, login 10 req/15 min |
| Testing (optional) | Jest + Supertest covering auth and role-based transaction access |
| API Documentation (optional) | This README + Postman collection included |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express.js v5 |
| Database | MongoDB (via Mongoose) |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
| Testing | Jest + Supertest |
| Dev Server | Nodemon |

---

## Project Structure

```
finance-backend-internship/
├── app.js                        # Express app setup, middleware, route mounting
├── server.js                     # Entry point — starts HTTP server
├── .env                          # Local environment variables (not committed)
├── .env.example                  # Template for required environment variables
├── config/
│   └── db.js                     # MongoDB connection logic
├── controllers/
│   ├── authController.js         # Login, get current user
│   ├── userController.js         # CRUD + bulk ops for users
│   └── transactionController.js  # CRUD + bulk ops + analytics for transactions
├── middleware/
│   ├── authMiddleware.js         # JWT protect + role authorization
│   ├── errorMiddleware.js        # Global error handler
│   └── validate.js               # Request validation runner middleware
├── models/
│   ├── User.js                   # User schema (name, email, password, role)
│   └── Transaction.js            # Transaction schema (amount, type, category, date)
├── routes/
│   ├── authRoutes.js             # /api/auth
│   ├── userRoutes.js             # /api/users
│   ├── transactionRoutes.js      # /api/transactions
│   └── protectedRoutes.js        # /api/protected (demo routes for auth verification)
├── services/
│   └── transactionService.js     # Business logic for bulk ops and analytics
├── utils/
│   └── validators.js             # Shared validators (email format, ObjectId, password)
├── validators/
│   ├── userValidator.js          # express-validator rules for user endpoints
│   └── transactionValidator.js   # express-validator rules for transaction endpoints
└── tests/
    ├── setup.js                  # Jest setup — creates test users, tears down after
    ├── auth.test.js              # Auth endpoint tests
    └── transactions.test.js      # Transaction endpoint tests
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local instance or MongoDB Atlas URI)
- npm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd finance-backend-internship

# 2. Install dependencies
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/finance_db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `a_long_random_secret_string` |

### Creating the First Admin User

There is no registration endpoint — users are created by an admin. To bootstrap the system, you need to create the first admin user directly in MongoDB.

**Option 1 — Using mongosh:**

```bash
mongosh "your_mongo_uri"
```

```js
use finance_db

db.users.insertOne({
  name: "Admin",
  email: "admin@example.com",
  password: "$2a$10$<bcrypt_hash_of_your_password>",
  role: "admin",
  isActive: true,
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Option 2 — Using a one-time Node.js script:**

Create a file `seed.js` in the project root:

```js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const hashed = await bcrypt.hash('yourpassword', 10);
  await User.create({
    name: 'Admin',
    email: 'admin@example.com',
    password: hashed,
    role: 'admin',
    isActive: true
  });
  console.log('Admin created');
  await mongoose.connection.close();
}

seed();
```

```bash
node seed.js
```

Once the admin is created, use `POST /api/auth/login` to get a JWT token and create additional users via the API.

### Running the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start

# Run tests
npm test
```

The API will be available at `http://localhost:5000`.

---

## Authentication

All protected routes require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

Tokens are obtained by logging in via `POST /api/auth/login`. Tokens expire after **1 day**.

**Token payload contains:**
- `id` — MongoDB ObjectId of the user
- `role` — User role (`admin`, `analyst`, or `viewer`)

On every protected request, the `protect` middleware also re-fetches the user from the database to verify the account is still active and not soft-deleted. A valid token for a deactivated account will be rejected with `403`.

---

## Role-Based Access Control

The API uses three roles. Access is **not** cumulative — each role has its own specific set of permissions.

| Role | Permissions |
|---|---|
| `viewer` | Access to analytics endpoints only (summary, stats, weekly trends, top categories) |
| `analyst` | Everything a viewer can do, plus: read all transactions, read user list |
| `admin` | Full access — create/update/delete transactions and users, all bulk operations, all analytics |

Access control is enforced at the route level via the `authorizeRoles` middleware. Each route explicitly declares which roles are permitted.

---

## API Reference

All routes are prefixed with `/api`. All responses follow this envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

Paginated responses additionally include `total`, `page`, and `pages`.

---

### Auth Routes

Base path: `/api/auth`

---

#### `POST /api/auth/login`

Authenticate a user and receive a JWT token.

> Rate limited: 10 attempts per 15 minutes.

**Request Body**

```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "admin"
  }
}
```

**Error Codes**

| Status | Code | Reason |
|---|---|---|
| 422 | `VALIDATION_ERROR` | Missing or invalid email/password format |
| 401 | `INVALID_CREDENTIALS` | Email not found or password mismatch |
| 403 | `ACCOUNT_INACTIVE` | Account has been deactivated |
| 403 | `ACCOUNT_DELETED` | Account has been soft-deleted |

---

#### `GET /api/auth/me`

Get the authenticated user's own profile. Password is excluded from the response.

> Requires: any authenticated user

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "admin",
    "isActive": true,
    "isDeleted": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### User Routes

Base path: `/api/users`

> All user routes require authentication. Role requirements are listed per endpoint.

---

#### `POST /api/users`

Create a new user. **Admin only.**

**Request Body**

```json
{
  "name": "Bob",
  "email": "bob@example.com",
  "password": "securepassword",
  "role": "analyst"
}
```

`role` defaults to `viewer` if omitted. Valid values: `viewer`, `analyst`, `admin`.

**Success Response** `201 Created`

Password is never returned in any user response.

---

#### `GET /api/users`

Get all users with pagination and filtering. **Admin only.**

Soft-deleted users (`isDeleted: true`) are excluded from results.

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |
| `search` | string | Search by name or email (case-insensitive) |
| `role` | string | Filter by role (`viewer`, `analyst`, `admin`) |
| `isActive` | boolean | Filter by active status (`true` or `false`) |

**Success Response** `200 OK`

```json
{
  "success": true,
  "total": 42,
  "page": 1,
  "pages": 5,
  "data": [ ... ]
}
```

---

#### `GET /api/users/:id`

Get a single user by ID.

- Admins can view any user.
- Non-admins can only view their own profile (returns `403` otherwise).

---

#### `PUT /api/users/:id`

Full update of a user. **Admin only.**

Admins cannot modify their own account via this endpoint.

**Updatable Fields:** `name`, `password`, `role`, `isActive`

If `password` is provided, it is automatically hashed before saving.

---

#### `PATCH /api/users/:id`

Partial update of a user. **Admin only.** Same rules as PUT — only the fields provided are updated.

---

#### `DELETE /api/users/:id`

Soft-delete a user. **Admin only.**

Sets `isDeleted: true` and `isActive: false`. The user record is retained in the database but excluded from all queries. Admins cannot delete their own account.

Returns `400 ALREADY_DELETED` if the user is already soft-deleted.

---

#### `POST /api/users/bulk`

Bulk create up to **50 users** in a single request. **Admin only.**

Each user is validated individually. If some fail, the rest are still created and the response uses `207 Multi-Status`.

**Request Body**

```json
{
  "users": [
    { "name": "Alice", "email": "alice@example.com", "password": "pass1", "role": "viewer" },
    { "name": "Bob", "email": "bob@example.com", "password": "pass2" }
  ]
}
```

**Success Response** `201 Created` (or `207` if partial failures)

```json
{
  "success": true,
  "message": "All users created successfully",
  "data": {
    "created_count": 2,
    "error_count": 0,
    "created": [ ... ],
    "errors": []
  }
}
```

---

#### `PATCH /api/users/bulk/deactivate`

Bulk deactivate up to **50 users** by ID. **Admin only.**

Sets `isActive: false` without soft-deleting. Admin cannot include their own ID.

**Request Body**

```json
{
  "ids": ["userId1", "userId2"]
}
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Bulk deactivation completed",
  "data": {
    "matched": 2,
    "deactivated": 2
  }
}
```

---

#### `DELETE /api/users/bulk`

Bulk soft-delete up to **50 users** by ID. **Admin only.**

Sets `isDeleted: true` and `isActive: false` for all matched users. Admin cannot include their own ID.

**Request Body**

```json
{
  "ids": ["userId1", "userId2"]
}
```

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Bulk delete completed",
  "data": {
    "matched": 2,
    "deleted": 2
  }
}
```

---

#### `PATCH /api/users/bulk`

Bulk update up to **50 users** by ID. **Admin only.**

Only `role` and `isActive` can be bulk updated. Fields like `name`, `email`, and `password` must be updated individually for security and data integrity reasons. Admin cannot include their own ID.

**Request Body**

```json
{
  "ids": ["userId1", "userId2"],
  "updates": {
    "role": "analyst"
  }
}
```

| Field | Type | Description |
|---|---|---|
| `role` | string | `viewer`, `analyst`, or `admin` |
| `isActive` | boolean | Activate (`true`) or deactivate (`false`) users |

**Success Response** `200 OK`

```json
{
  "success": true,
  "message": "Bulk update completed",
  "data": {
    "matched": 2,
    "updated": 2
  }
}
```

---

### Financial Records API

Base path: `/api/transactions`

> All financial record routes require authentication.

---

#### `POST /api/transactions`

Create a new transaction. **Admin only.**

**Request Body**

```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "description": "Monthly salary",
  "date": "2025-04-01"
}
```

| Field | Required | Description |
|---|---|---|
| `amount` | Yes | Positive number |
| `type` | Yes | `income` or `expense` |
| `category` | Yes | Free-text category label |
| `description` | No | Optional notes (defaults to empty string) |
| `date` | No | ISO date string (defaults to current date/time) |

**Success Response** `201 Created`

---

#### `GET /api/transactions`

Get all transactions with pagination and filtering. **Analyst and Admin only.**

Soft-deleted transactions are excluded from results.

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 5) |
| `type` | string | `income` or `expense` |
| `category` | string | Filter by exact category |
| `startDate` | date | Start of date range (ISO format) |
| `endDate` | date | End of date range (ISO format) |
| `search` | string | Search within description (case-insensitive) |

**Success Response** `200 OK`

```json
{
  "success": true,
  "total": 100,
  "page": 1,
  "pages": 20,
  "data": [ ... ]
}
```

---

#### `GET /api/transactions/:id`

Get a single transaction by ID. **Analyst and Admin only.**

---

#### `PUT /api/transactions/:id`

Full update of a transaction. **Admin only.**

**Updatable Fields:** `amount`, `type`, `category`, `description`, `date`

---

#### `PATCH /api/transactions/:id`

Partial update of a transaction. **Admin only.** Only the fields provided are updated.

---

#### `DELETE /api/transactions/:id`

Soft-delete a transaction. **Admin only.**

Sets `isDeleted: true` and records `deletedAt` timestamp. The record is retained in the database but excluded from all standard queries.

---

#### `POST /api/transactions/bulk`

Bulk create up to **100 transactions**. **Admin only.**

Each transaction is validated individually. Failures are reported per-item and do not stop the rest from being created.

**Request Body**

```json
{
  "transactions": [
    { "amount": 500, "type": "expense", "category": "Food" },
    { "amount": 3000, "type": "income", "category": "Freelance" }
  ]
}
```

Returns `201` if all succeed, `207 Multi-Status` if some fail.

---

#### `DELETE /api/transactions/bulk`

Bulk soft-delete up to **100 transactions** by ID. **Admin only.**

**Request Body**

```json
{
  "ids": ["txnId1", "txnId2"]
}
```

---

#### `PATCH /api/transactions/bulk`

Bulk update up to **100 transactions** by ID. **Admin only.**

Only `category`, `type`, and `description` can be bulk updated. Fields like `amount` and `date` must be updated individually.

**Request Body**

```json
{
  "ids": ["txnId1", "txnId2"],
  "updates": {
    "category": "Utilities"
  }
}
```

---

#### `GET /api/transactions/summary`

Get a full financial summary. **All roles (Viewer, Analyst, Admin).**

Returns total income, total expenses, net balance, category breakdown, monthly trends, weekly trends, recent transactions, top spending categories, and financial health indicators (income-to-expense ratio, daily average spending).

**Query Parameters:** `startDate`, `endDate` (both optional — if omitted, covers all time)

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "totalIncome": 50000,
    "totalExpenses": 30000,
    "netBalance": 20000,
    "incomeToExpenseRatio": 1.67,
    "dailyAverageSpending": 1000,
    "categoryBreakdown": [ ... ],
    "topSpendingCategories": [ ... ],
    "monthlyTrends": [ ... ],
    "weeklyTrends": [ ... ],
    "recentTransactions": [ ... ]
  }
}
```

---

#### `GET /api/transactions/stats`

Get aggregate expense statistics. **All roles (Viewer, Analyst, Admin).**

Returns highest expense, lowest expense, average expense, total expenses, and count.

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "highestExpense": 5000,
    "lowestExpense": 50,
    "averageExpense": 750.50,
    "totalExpenses": 30000,
    "count": 40
  }
}
```

---

#### `GET /api/transactions/weekly-trends`

Get income and expense totals grouped by day of the week for the last 7 days. **All roles (Viewer, Analyst, Admin).**

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": [
    { "day": "Monday", "income": 1000, "expenses": 500, "count": 3 },
    ...
  ]
}
```

---

#### `GET /api/transactions/top-categories`

Get the top expense categories by total amount spent. **All roles (Viewer, Analyst, Admin).**

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `limit` | number | Number of categories to return (default: 5) |

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": [
    { "category": "Food", "totalSpent": 8000, "transactionCount": 20 },
    ...
  ]
}
```

---

## Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| All routes (global) | 100 requests | 15 minutes |
| `POST /api/auth/login` | 10 requests | 15 minutes |

Exceeding the limit returns `429 Too Many Requests`.

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "errors": { }
}
```

The `errors` field is only present for validation failures and contains field-level details.

**Standard Error Codes**

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Input failed validation |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_INACTIVE` | 403 | Account is deactivated |
| `ACCOUNT_DELETED` | 403 | Account is soft-deleted |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `DUPLICATE_ERROR` | 409 | Resource already exists (e.g. duplicate email) |
| `INVALID_ID` | 400 | Malformed MongoDB ObjectId |
| `INVALID_INPUT` | 400 | Missing or invalid request body |
| `INVALID_FIELDS` | 400 | Attempt to update fields not allowed in bulk ops |
| `LIMIT_EXCEEDED` | 400 | Bulk operation exceeds allowed count |
| `ALREADY_DELETED` | 400 | Resource is already soft-deleted |
| `INVALID_TOKEN` | 401 | JWT signature is invalid |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `SERVER_ERROR` | 500 | Unhandled server exception |

Unhandled errors are caught by the global `errorHandler` middleware in `middleware/errorMiddleware.js`, which also handles Mongoose validation errors, duplicate key errors, CastErrors, and JWT errors automatically.

---

## Security Considerations

- Passwords are hashed using **bcrypt** (salt rounds: 10) and are never returned in any API response
- JWT tokens are signed with a secret key and verified on every protected request
- The `protect` middleware re-fetches the user from the database on each request to catch deactivated or deleted accounts even if their token is still valid
- Rate limiting on the login endpoint prevents brute-force attacks
- Admins are blocked from modifying or deleting their own account to prevent accidental self-lockout
- Bulk update operations restrict which fields can be changed to prevent mass data corruption
- MongoDB ObjectIds are validated before any database query to avoid `CastError` leakage

---

## Performance Considerations

- **Database indexes** are defined on `user`, `category`, `date` (descending), and `type` fields on the Transaction model for fast filtering and sorting
- **Aggregation pipelines** are used for all analytics endpoints instead of fetching and processing records in application memory
- **Pagination** is implemented on all list endpoints to avoid loading unbounded datasets
- **Bulk operations** allow up to 100 transactions or 50 users to be processed in a single request, significantly reducing database round-trips compared to individual calls

---

## Data Models

### User

| Field | Type | Description |
|---|---|---|
| `name` | String | Full name (required) |
| `email` | String | Unique email address (required) |
| `password` | String | Bcrypt hashed — never returned in responses |
| `role` | String | `viewer` \| `analyst` \| `admin` (default: `viewer`) |
| `isActive` | Boolean | Whether the account can log in (default: `true`) |
| `isDeleted` | Boolean | Soft delete flag (default: `false`) |
| `createdAt` | Date | Auto-managed by Mongoose |
| `updatedAt` | Date | Auto-managed by Mongoose |

### Transaction

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the User who created it |
| `amount` | Number | Transaction amount (required, must be positive) |
| `type` | String | `income` or `expense` (required) |
| `category` | String | Category label (required, free-text) |
| `description` | String | Optional notes (defaults to empty string) |
| `date` | Date | Transaction date (defaults to current date/time) |
| `isDeleted` | Boolean | Soft delete flag (default: `false`) |
| `deletedAt` | Date | Timestamp set on soft delete (default: `null`) |
| `createdAt` | Date | Auto-managed by Mongoose |
| `updatedAt` | Date | Auto-managed by Mongoose |

**Indexes** on `user`, `category`, `date` (descending), and `type` are defined for query performance.

---

## Testing

Tests use **Jest** and **Supertest** and run against a real MongoDB database (the same one defined in your `.env`).

```bash
npm test
```

**How the test setup works:**

The file `tests/setup.js` runs before all tests. It automatically creates three test users in your database:

| Email | Password | Role |
|---|---|---|
| `testadmin@gmail.com` | `password123` | `admin` |
| `testanalyst@gmail.com` | `password123` | `analyst` |
| `testviewer@gmail.com` | `password123` | `viewer` |

These users are cleaned up automatically after the test suite finishes. You do not need to create them manually — the setup file handles it.

**Requirements before running tests:**
- `MONGO_URI` must be set in your `.env` file pointing to a running MongoDB instance
- Run `npm install` before `npm test` to ensure Jest is installed

**What is tested:**
- Auth: login success, wrong credentials, missing fields
- Transactions: role-based access (admin/analyst/viewer), create, delete, validation errors

Tests cover authentication flows, role-based access enforcement, and transaction operations across all three user roles.

---

## Postman Collection

A full Postman collection is included at the root of the project:

```
Finance_Backend_APIs_Collection.postman_collection.json
```

Import it into Postman to test all endpoints immediately. After importing:

1. Run `POST /api/auth/login` with valid credentials
2. Copy the `token` from the response
3. Set it as the `token` variable in your Postman environment
4. All other requests will use it automatically via the `Authorization: Bearer {{token}}` header

---

## Assumptions and Design Decisions

The following assumptions were made during development:

**Who can create transactions?**
Only admins can create, update, and delete transactions. Analysts can read all transactions but cannot modify them. This was chosen to reflect a real finance system where data entry is a privileged operation.

**Who can read transactions?**
Analysts and admins can read all transactions (not filtered by ownership). Viewers cannot read the transaction list — they are limited to the analytics/summary endpoints which show aggregate data only.

**Soft delete over hard delete**
Both users and transactions use soft deletion (`isDeleted: true`) rather than being permanently removed. This preserves audit history and allows potential recovery. Hard-deleted records cannot be restored.

**Admins cannot modify their own account**
To prevent accidental self-lockout (e.g. removing admin role or deactivating themselves), admins are blocked from updating or deleting their own account via the API.

**No self-registration**
There is no public registration endpoint. All users are created by an admin. The first admin must be seeded directly into the database (see [Creating the First Admin User](#creating-the-first-admin-user)).

**Bulk update field restrictions**
Bulk updates on users allow only `role` and `isActive`. Fields like `name`, `email`, and `password` require individual updates to maintain data integrity and audit clarity. Similarly, bulk transaction updates allow only `category`, `type`, and `description` — not `amount` or `date`.

**Token expiry**
JWT tokens expire after 1 day. There is no refresh token mechanism in this implementation.

---

## Deployment

This guide covers deploying to **Render** with **MongoDB Atlas** as the database.

---

### Pre-Deployment Checklist

- [ ] `.env` is listed in `.gitignore` — never commit secrets
- [ ] `.env.example` is committed with placeholder values
- [ ] `package.json` has a `"start"` script pointing to `server.js`
- [ ] The app reads `PORT` from `process.env.PORT` — Render injects this at runtime
- [ ] MongoDB Atlas cluster is created and the connection string is ready

---

### MongoDB Atlas Setup

**Step 1 — Create a free cluster**

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up or log in
2. Create a new **free (M0)** cluster in any region

**Step 2 — Create a database user**

1. Go to **Database Access → Add New Database User**
2. Choose **Password** authentication
3. Grant **Read and Write to any database**

**Step 3 — Allow network access**

1. Go to **Network Access → Add IP Address**
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`) — required because Render's outbound IPs change

**Step 4 — Get your connection string**

1. Go to **Database → Connect → Drivers**
2. Copy the string and replace `<username>`, `<password>`, and `<dbname>`:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/finance_db?retryWrites=true&w=majority
```

---

### Deploy to Render

**Step 1 — Push your code to GitHub**

```bash
git add .
git commit -m "ready for deployment"
git push origin main
```

**Step 2 — Create a new Web Service on Render**

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub account and select the repository
4. Fill in the settings:

| Setting | Value |
|---|---|
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Click **Create Web Service**

---

### Setting Environment Variables on Render

Go to your Render service → **Environment** tab → **Add Environment Variable**:

| Variable | Value |
|---|---|
| `PORT` | Leave unset — Render injects this automatically |
| `MONGO_URI` | Your full MongoDB Atlas connection string |
| `JWT_SECRET` | A long, random secret string (minimum 32 characters) |

To generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Verifying the Deployment

```bash
curl https://finance-backend-internship.onrender.com/
# Expected: API Running
```

```bash
curl -X POST https://finance-backend-internship.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

You can also update the base URL in the Postman collection from `http://localhost:5000` to the Render URL and run all endpoints against the live deployment.