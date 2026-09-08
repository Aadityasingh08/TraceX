# TRACE-X Security Architecture & Implementation Status

This document provides a transparent, auditable breakdown of security controls currently implemented and active in TRACE-X versus items planned on the production roadmap.

---

## 1. Implemented & Live Security Controls

| Security Control | Implementation Details | Active Location |
| :--- | :--- | :--- |
| **Authentication (JWT)** | Stateless JSON Web Tokens with HMAC-SHA256 signature verification and expiration check. | `Backend/src/middleware/authMiddleware.js` |
| **Password Hashing** | One-way salted bcrypt hashing (salt rounds: 10). Raw passwords are never persisted. | `Backend/src/controllers/authController.js` |
| **Role-Based Access Control (RBAC)** | Role enforcement (`INVESTIGATOR`, `ANALYST`, `ADMIN`) guarding sensitive admin endpoints. | `Backend/src/middleware/authMiddleware.js` |
| **Rate Limiting (Anti-Brute Force)** | IP-based rate limiting on authentication routes (`30 requests / 15 minutes window`), returning HTTP 429. | `Backend/src/routes/authRoutes.js` (`express-rate-limit`) |
| **Strict Request Body Validation** | Middleware validating schema, required types, and non-empty strings on POST/PATCH endpoints before execution (returning HTTP 400). | `Backend/src/middleware/validateRequest.js` |
| **Immutable Audit Logging** | Action-level governance recording user ID, action type, resource target, client IP, and UTC timestamps on investigative decisions. | `Backend/src/models/AuditLog.js` & `Backend/src/controllers/auditController.js` |
| **Cryptographic Evidence Lineage** | SHA-256 fingerprinting computed over raw payload findings to verify evidence integrity and chain-of-custody. | `Backend/src/services/evidenceService.js` |
| **SQL Injection Defense** | 100% parameterized SQL queries via `pg` pool across all controllers and services. No string concatenation into queries. | `Backend/src/controllers/` |

---

## 2. Production Roadmap (Planned Future Hardening)

| Capability | Current State | Production Roadmap Plan |
| :--- | :--- | :--- |
| **Encryption at Rest** | PostgreSQL default filesystem storage. | Implement column-level encryption via `pgcrypto` / AES-256 for PII indicators. |
| **Distributed Rate Limiting** | In-memory `express-rate-limit`. | Redis-backed token bucket store for multi-instance cluster deployment. |
| **Secret & Key Rotation** | Environment-configured static JWT secret. | Dynamic key rotation via AWS Secrets Manager or HashiCorp Vault. |
| **Multi-Factor Authentication (MFA)** | Email + password analyst login. | WebAuthn / FIDO2 hardware token or TOTP authenticator integration. |
