# Core Concepts & Authentication

This document outlines the design decisions and structures for Authentication, User Management, and global core concepts in "Meira".

## WorkOS Auth
- Sessions are validated via the `ValidateSessionWithWorkOS` middleware.

## Users & Friendships
- User relationships (friends) are handled via `UserController::accept_friendship`.
- Searching users uses the `/search-users` endpoint.

**[Add specific design decisions regarding Auth and Users here]**
