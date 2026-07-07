# Authentication & Identity Management Integration Guide
## JCCAD Company Intelligence Platform (CIP)

---

## 1. Authentication Flow (Refresh Token Rotation)

CIP implements a **Refresh Token Rotation (RTR)** flow to protect user sessions. The token loop functions as follows:

```
[User Login] ---------------------> Returns Access Token (JWT - memory) 
                                     & Refresh Token (Secure HttpOnly Cookie)
                                     
[API Request (15 min)] ------------> Uses Access Token (Authorization: Bearer)

[Access Token Expired] ------------> Client POSTs to /api/v1/auth/refresh
                                     (Uses Refresh Token cookie)
                                     
[Refresh Token Valid] -------------> Session invalidated. Replaced with NEW session.
                                     Returns NEXT Access Token & Refresh Token.
                                     
[Refresh Token Reused/Stale] ------> Fraud flag triggered. Revokes ALL active 
                                     sessions for user. Forces logout.
```

---

## 2. Role-Based Access Control (RBAC) Matrix

Permissions are structured using hierarchy matrices. Roles inherit permissions downward:

| Permission Tag | Guest | Student | Professional | Employee | Manager | Administrator | Super Administrator |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`knowledge:read`** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **`chat:send`** | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **`chat:history`** | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **`image:analyze`** | - | - | ✓ | - | - | ✓ | ✓ |
| **`knowledge:upload`** | - | - | - | ✓ | ✓ | ✓ | ✓ |
| **`knowledge:approve`**| - | - | - | - | ✓ | ✓ | ✓ |
| **`analytics:read`** | - | - | - | - | ✓ | ✓ | ✓ |
| **`knowledge:delete`** | - | - | - | - | - | ✓ | ✓ |
| **`knowledge:sync`** | - | - | - | - | - | ✓ | ✓ |
| **`system:config`** | - | - | - | - | - | ✓ | ✓ |
| **`audit:read`** | - | - | - | - | - | - | ✓ |

---

## 3. Core API Documentation

### 3.1 Register User
* **Endpoint:** `POST /api/v1/auth/register`
* **Authentication:** None.
* **Request Payload:**
  ```json
  {
    "email": "student@jccad.edu",
    "password": "SecurePassword123!",
    "name": "Jane Doe",
    "role": "Student"
  }
  ```
* **Validation Rules:**
  * `email`: Valid email format. Unique in system.
  * `password`: Minimum 14 characters, containing at least one uppercase, lowercase, number, and special character.
  * `name`: Trimmed string, min length 2 characters.
  * `role`: Optional. Must map to approved JCCAD roles.
* **Success Response (201 Created):**
  ```json
  {
    "message": "Registration successful. Verification token generated.",
    "user": {
      "id": "64a2f8b5c9e2b1001a1c9001",
      "email": "student@jccad.edu",
      "name": "Jane Doe",
      "role": "Student"
    },
    "dev_verification_url": "/api/v1/auth/verify-email?token=8a2f3..."
  }
  ```
* **Error Response (400 Bad Request):**
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Provided request parameters failed validation",
      "details": [
        { "field": "password", "issue": "Password must be at least 14 characters long" }
      ]
    }
  }
  ```

### 3.2 Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Authentication:** None.
* **Request Payload:**
  ```json
  {
    "email": "student@jccad.edu",
    "password": "SecurePassword123!"
  }
  ```
* **Success Response (200 OK):**
  * *Sets cookie:* `refreshToken` (httpOnly, secure, sameSite=strict).
  * *Body:*
    ```json
    {
      "user": {
        "id": "64a2f8b5c9e2b1001a1c9001",
        "email": "student@jccad.edu",
        "name": "Jane Doe",
        "role": "Student",
        "isEmailVerified": false
      },
      "accessToken": "eyJhb..."
    }
    ```
* **Error Response (401 Unauthorized):**
  ```json
  {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Invalid email or password parameters"
    }
  }
  ```

### 3.3 Refresh Session
* **Endpoint:** `POST /api/v1/auth/refresh`
* **Authentication:** Requires `refreshToken` Cookie.
* **Success Response (200 OK):**
  * *Rotates cookie:* Overwrites `refreshToken` with next token.
  * *Body:*
    ```json
    {
      "accessToken": "eyJhb..."
    }
    ```

---

## 4. Troubleshooting & Recovery
* **Token Expired Error (401):** The frontend interceptor automatically executes a `POST /auth/refresh`. If this returns 401, the refresh token has expired, forcing a logout redirect to `/login`.
* **Database Out of Sync:** If sessions are modified or revoked unexpectedly, trigger a manual user logout to clear secure cookies.
