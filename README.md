# Finance Backend API

A RESTful backend API for a finance dashboard application, featuring role-based access control (RBAC), JWT authentication, transaction management, and analytics endpoints.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [API Reference](#api-reference)
  - [Auth Routes](#auth-routes)
  - [User Routes](#user-routes)
  - [Transaction Routes](#transaction-routes)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Data Models](#data-models)
- [Testing](#testing)
- [Postman Collection](#postman-collection)
- [Deployment](#deployment)
  - [Pre-Deployment Checklist](#pre-deployment-checklist)
  - [Deploy to Render](#deploy-to-render)
  - [Setting Environment Variables](#setting-environment-variables-on-render)
  - [MongoDB Atlas Setup](#mongodb-atlas-setup)
  - [Verifying the Deployment](#verifying-the-deployment)

---

## Overview

The Finance Backend API serves as the server-side foundation for a finance dashboard. It provides endpoints to manage users and financial transactions, with a granular permission system (Admin / Analyst / Viewer), JWT-secured routes, soft deletion, bulk operations, and aggregated analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
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
├── app.js                      # Express app setup, middleware, route mounting
├── server.js                   # Entry point — starts HTTP server
├── .env                        # Local environment variables (not committed)
├── .env.example                # Template for required environment variables
├── config/
│   └── db.js                   # MongoDB connection logic
├── controllers/
│   ├── authController.js       # Login, get current user
│   ├── userController.js       # CRUD + bulk ops for users
│   └── transactionController.js# CRUD + bulk ops + analytics for transactions
├── middleware/
│   ├── authMiddleware.js       # JWT protect + role authorization
│   ├── errorMiddleware.js      # Global error handler
│   └── validate.js             # Request validation middleware
├── models/
│   ├── User.js                 # User schema (name, email, password, role)
│   └── Transaction.js          # Transaction schema (amount, type, category, date)
├── routes/
│   ├── authRoutes.js           # /api/auth
│   ├── userRoutes.js           # /api/users
│   ├── transactionRoutes.js    # /api/transactions
│   └── protectedRoutes.js      # /api/protected (demo auth check)
├── services/
│   └── transactionService.js   # Business logic for bulk ops and analytics
├── utils/
│   └── validators.js           # Shared validators (email, ObjectId, password)
└── tests/
    └── setup.js                # Jest test setup
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

All protected routes require a valid JWT token in the `Authorization` header.

```
Authorization: Bearer <your_token>
```

Tokens are obtained by logging in via `POST /api/auth/login`. Tokens expire after **1 day**.

**Token payload contains:**
- `id` — MongoDB ObjectId of the user
- `role` — User role (`admin`, `analyst`, or `viewer`)

---

## Role-Based Access Control

The API uses three roles. Permissions are cumulative — higher roles include all permissions of lower ones.

| Role | Description |
|---|---|
| `viewer` | Read-only access to transactions |
| `analyst` | Can view and manage their own transactions |
| `admin` | Full access — user management, bulk operations, analytics |

Route-level access is enforced via the `authorizeRoles` middleware.

---

## API Reference

All routes are prefixed with `/api`. All responses follow this envelope:

```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... }
}
```

Paginated responses additionally include `total`, `page`, and `pages`.

---

### Auth Routes

Base path: `/api/auth`

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

Get the authenticated user's own profile.

> Requires: `protect`

**Success Response** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "admin",
    "isActive": true
  }
}
```

---

### User Routes

Base path: `/api/users`

> All user routes require authentication (`protect`). Most require `admin` role.

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

---

#### `GET /api/users`

Get all users with pagination and filtering. **Admin only.**

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |
| `search` | string | Search by name or email |
| `role` | string | Filter by role |
| `isActive` | boolean | Filter by active status |

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

Get a user by ID. Admins can view any user; non-admins can only view themselves.

---

#### `PUT /api/users/:id`

Full update of a user. **Admin only.** Admins cannot modify their own account.

**Updatable Fields:** `name`, `password`, `role`, `isActive`

---

#### `PATCH /api/users/:id`

Partial update of a user. **Admin only.** Same restrictions as PUT.

---

#### `DELETE /api/users/:id`

Soft-delete a user (sets `isDeleted: true`, `isActive: false`). **Admin only.** Admins cannot delete their own account.

---

#### `POST /api/users/bulk`

Bulk create up to **50 users** in a single request. **Admin only.**

**Request Body**

```json
{
  "users": [
    { "name": "Alice", "email": "alice@example.com", "password": "pass1", "role": "viewer" },
    { "name": "Bob", "email": "bob@example.com", "password": "pass2" }
  ]
}
```

Returns `201` if all succeed, `207 Multi-Status` if some fail.

---

#### `PATCH /api/users/bulk/deactivate`

Bulk deactivate up to **50 users** by ID. **Admin only.** Cannot include the requesting admin's own ID.

**Request Body**

```json
{
  "ids": ["userId1", "userId2"]
}
```

---

### Transaction Routes

Base path: `/api/transactions`

> All transaction routes require authentication (`protect`).

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
| `description` | No | Optional notes |
| `date` | No | ISO date string (defaults to now) |

---

#### `GET /api/transactions`

Get all transactions with pagination and filtering.

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 5) |
| `type` | string | `income` or `expense` |
| `category` | string | Filter by category |
| `startDate` | date | Start of date range (ISO) |
| `endDate` | date | End of date range (ISO) |
| `search` | string | Search by description |

---

#### `GET /api/transactions/:id`

Get a single transaction. Admins can view any; non-admins can only view their own.

---

#### `PUT /api/transactions/:id`

Full update of a transaction. Admins can update any; non-admins can only update their own.

---

#### `PATCH /api/transactions/:id`

Partial update of a transaction. Same access rules as PUT.

---

#### `DELETE /api/transactions/:id`

Soft-delete a transaction (sets `isDeleted: true`, records `deletedAt`). Admins can delete any; non-admins can only delete their own.

---

#### `POST /api/transactions/bulk`

Bulk create up to **100 transactions**. **Admin only.**

**Request Body**

```json
{
  "transactions": [
    { "amount": 500, "type": "expense", "category": "Food" },
    { "amount": 3000, "type": "income", "category": "Freelance" }
  ]
}
```

---

#### `DELETE /api/transactions/bulk`

Bulk delete up to **100 transactions** by ID. **Admin only.**

**Request Body**

```json
{
  "ids": ["txnId1", "txnId2"]
}
```

---

#### `PATCH /api/transactions/bulk`

Bulk update up to **100 transactions**. **Admin only.**

Only `category`, `type`, and `description` can be bulk-updated. Fields like `amount` and `date` must be updated individually for data integrity.

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

Get total income, total expense, and net balance for an optional date range. **Admin only.**

**Query Parameters:** `startDate`, `endDate` (both optional)

---

#### `GET /api/transactions/stats`

Get aggregate statistics across all transactions. **Admin only.**

---

#### `GET /api/transactions/weekly-trends`

Get income and expense totals grouped by week. **Admin only.**

---

#### `GET /api/transactions/top-categories`

Get the most-used transaction categories by total amount.

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `limit` | number | Number of categories to return (default: 5) |

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

**Standard Error Codes**

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Input failed validation |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_INACTIVE` | 403 | Account is deactivated |
| `ACCOUNT_DELETED` | 403 | Account is soft-deleted |
| `NOT_FOUND` | 404 | Resource not found |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `DUPLICATE_ERROR` | 409 | Resource already exists |
| `INVALID_ID` | 400 | Malformed MongoDB ObjectId |
| `INVALID_INPUT` | 400 | Missing or invalid request body |
| `LIMIT_EXCEEDED` | 400 | Bulk operation exceeds allowed count |
| `ALREADY_DELETED` | 400 | Resource already soft-deleted |
| `SERVER_ERROR` | 500 | Unhandled server exception |

Unhandled errors are caught by the global `errorHandler` middleware in `middleware/errorMiddleware.js`.

---

## Data Models

### User

| Field | Type | Description |
|---|---|---|
| `name` | String | Full name (required) |
| `email` | String | Unique email (required) |
| `password` | String | Bcrypt hashed (required) |
| `role` | String | `viewer` \| `analyst` \| `admin` (default: `viewer`) |
| `isActive` | Boolean | Whether the account is active (default: `true`) |
| `isDeleted` | Boolean | Soft delete flag (default: `false`) |
| `createdAt` | Date | Auto-managed by Mongoose |
| `updatedAt` | Date | Auto-managed by Mongoose |

### Transaction

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId | Reference to the User who created it |
| `amount` | Number | Transaction amount (required) |
| `type` | String | `income` or `expense` (required) |
| `category` | String | Category label (required) |
| `description` | String | Optional notes |
| `date` | Date | Transaction date (defaults to now) |
| `isDeleted` | Boolean | Soft delete flag (default: `false`) |
| `deletedAt` | Date | Timestamp set on soft delete |
| `createdAt` | Date | Auto-managed by Mongoose |
| `updatedAt` | Date | Auto-managed by Mongoose |

**Indexes:** `user`, `category`, `date` (descending), `type` — for query performance.

---

## Testing

Tests use Jest and Supertest.

```bash
npm test
```

Test configuration is in `package.json` under the `jest` key. The test setup file is at `tests/setup.js`, which handles test DB setup and teardown.

---

## Postman Collection

A full Postman collection is included at the root of the project:

```
Finance_Backend_APIs_postman_collection.json
```

Import it into Postman to test all endpoints immediately. Remember to set the `token` environment variable after logging in.

---

## Deployment

This guide covers deploying the API to **Render** or **Railway** — both offer free tiers suitable for internship and portfolio projects. The database will be hosted on **MongoDB Atlas** (free tier).

---

### Pre-Deployment Checklist

Before pushing to a PaaS, make sure these are in order:

- [ ] `.env` is listed in `.gitignore` — never commit secrets
- [ ] `.env.example` is committed with placeholder values
- [ ] `package.json` has a `"start"` script pointing to your entry file (`server.js`)
- [ ] Your app reads `PORT` from `process.env.PORT` — PaaS platforms inject their own port at runtime
- [ ] MongoDB Atlas cluster is created and your connection string is ready
- [ ] All local `localhost` MongoDB URIs are replaced with the Atlas URI in environment config

Verify your start script in `package.json`:

```json
"scripts": {
  "start": "node server.js"
}
```

---

### MongoDB Atlas Setup

Your deployed app cannot connect to a local MongoDB instance. You need a cloud database.

**Step 1 — Create a free cluster**

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up or log in
2. Create a new **free (M0)** cluster — choose any region close to where you'll deploy

**Step 2 — Create a database user**

1. In Atlas, go to **Database Access → Add New Database User**
2. Choose **Password** authentication
3. Set a username and a strong password — save these, you'll need them in your connection string
4. Grant the user **Read and Write to any database**

**Step 3 — Allow network access**

1. Go to **Network Access → Add IP Address**
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`) — required for PaaS platforms since their outbound IPs change dynamically

**Step 4 — Get your connection string**

1. Go to **Database → Connect → Drivers**
2. Copy the connection string. It will look like:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

3. Replace `<username>`, `<password>`, and `<dbname>` with your actual values. Use `finance_db` (or any name you prefer) as the database name.

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
3. Connect your GitHub account and select this repository
4. Fill in the service settings:

| Setting | Value |
|---|---|
| **Name** | `finance-backend` (or any name) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Click **Create Web Service** — Render will begin the first deployment

**Step 3 — Add environment variables** (see [Setting Environment Variables](#setting-environment-variables-on-paas) below)

Once deployed, Render gives you a public URL. This project is live at:
```
https://finance-backend-internship.onrender.com
```

> **Note:** Free tier Render services spin down after 15 minutes of inactivity. The first request after idle may take 30–60 seconds to respond. This is normal for free plans.

---

### Setting Environment Variables on Render

**Do not hardcode these values in your code.** Go to your Render service → **Environment** tab → **Add Environment Variable**.

| Variable | Value |
|---|---|
| `PORT` | Leave unset — Render injects this automatically |
| `MONGO_URI` | Your full MongoDB Atlas connection string |
| `JWT_SECRET` | A long, random secret string (minimum 32 characters) |

To generate a strong `JWT_SECRET` locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Verifying the Deployment

Once deployed, confirm the API is live by hitting the root endpoint:

```bash
curl https://finance-backend-internship.onrender.com/
# Expected response: API Running
```

Then test the login endpoint:

```bash
curl -X POST https://finance-backend-internship.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

You can also update the **base URL** in your Postman collection from `http://localhost:5000` to `https://finance-backend-internship.onrender.com` and run the full collection against production.