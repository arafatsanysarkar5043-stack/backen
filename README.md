# ZAFRIVA Backend

Express + MongoDB Atlas API for the ZAFRIVA ecommerce starter.

## Included
- Customer/admin authentication
- Argon2id password hashing and JWT sessions
- Admin/manager/staff roles
- Product, category, image and order APIs
- Manual bKash/Nagad/Rocket payment fields and verification endpoint
- Product variants and combo structure
- HMAC-SHA256 integrity digest using `DB_PEPPER`
- Audit trail and tamper alerts
- Scheduled GitHub Actions integrity check
- Helmet, CORS allowlist, rate limits and Zod validation

## Local setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Fill MongoDB URI and all secrets.
4. Run `npm install`.
5. Run `npm run seed` once.
6. Run `npm run dev`.

API: http://localhost:5000

Never put `.env` or any secret into GitHub.
