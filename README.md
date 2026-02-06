# 🚀 NexuS API V2 - Advanced Response & Error Management
**The Evolution of Enterprise-Grade NestJS Observability.**

### 🇹🇷 TANRI TÜRK'Ü KORUSUN VE YÜCELTSİN 🐺

NexuS API V2 (Response System) is a high-performance, security-focused backend submodule. It is the evolved version of the original [NexusAPI (V1)](https://github.com/MertcanMert/nexus-api), specifically rebuilt to provide the most robust **Error Management** and **Response Standardization** in the NestJS ecosystem.

<br/>

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

**⭐ Star the Repository! [github.com/MertcanMert/nexus-api-v2-response-system](https://github.com/MertcanMert/nexus-api-v2-response-system)**

---

## 💎 The Evolution: From V1 to V2
While [NexusAPI V1](https://github.com/MertcanMert/nexus-api) set the standard for modular NestJS architecture, multi-tenancy, and security foundation, **V2 Response System** deepens the developer experience by solving the "Silent Failure" and "Data Inconsistency" problems. 

In V2, every byte returned by your API is standardized, every error is categorized, and every request is traceable.

---

## 🏗️ Technical Architecture: The Response Lifecycle

NexuS V2 intercepts every interaction via a Global Interceptor and a Global Exception Filter.

### 1. Standard Success Response (`IGenericResponse`)
All successful requests are intercepted by `TransformInterceptor`. This ensures a predictable JSON structure for your frontend or client consumers.

#### 📝 Structure
```json
{
  "success": true,
  "statusCode": 200,
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000",
    "path": "/api/v1/users/profile",
    "method": "GET",
    "lang": "en",
    "ipv4": "127.0.0.1",
    "ipv6": "::1",
    "duration": "15ms",
    "message": "Request successful",
    "timestamp": "2024-02-06T12:00:00.000Z"
  },
  "data": {
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

---

### 2. Standard Error Response (`IErrorResponse`)
Errors are captured by the `AllExceptionsFilter`, which translates raw exceptions into developer-friendly objects.

#### 📝 Error Structure
```json
{
  "success": false,
  "statusCode": 400,
  "meta": {
    "requestId": "...",
    "correlationId": "...",
    "errorCategory": "VALIDATION",
    "message": "Field validation failed",
    "errors": {
      "email": ["MSG EMAIL ERROR"],
      "password": ["MSG PASSWORD ERROR"]
    },
    "path": "/api/v1/auth/register",
    "method": "POST",
    "lang": "tr",
    "timestamp": "..."
  }
}
```

#### 📊 Error Categories:
- **`VALIDATION`**: 400 Bad Request, structured by field.
- **`AUTHENTICATION`**: 401 Unauthorized.
- **`AUTHORIZATION`**: 403 Forbidden.
- **`NOT_FOUND`**: 404 resource issues.
- **`RATE_LIMIT`**: 429 flood protection.
- **`INTERNAL`**: 5xx server-side failures (with masked stack traces in production).

---

## �️ Console Observability (DX)
NexuS V2 provides a premium developer experience with structured console logging. No more messy, unreadable logs.

### ✅ Success Log Example
When a request succeeds, the console displays a beautiful, boxed summary:
```text
╔══════════════════════════════════════════════════════════════╗
║ ✅ GET /api/v1/app/hello
╠══════════════════════════════════════════════════════════════╣
║ Request ID    : 5c78a0f1-4389-4b61-9c86-13d4924ea156
║ Correlation ID: 5c78a0f1-4389-4b61-9c86-13d4924ea156
║ Status        : 200
║ Duration      : 12ms
║ IPv4          : 127.0.0.1
║ IPv6          : ::1
║ User Agent    : Mozilla/5.0...
╚══════════════════════════════════════════════════════════════╝
```

### 🆘 Error Log Example
When an error occurs, the log becomes more detailed, helping you debug faster:
```text
╔══════════════════════════════════════════════════════════════╗
║ 🆘 POST /api/v1/auth/login
╠══════════════════════════════════════════════════════════════╣
║ Request ID    : a1b2c3d4-e5f6-g7h8-i9j0
║ Correlation ID: a1b2c3d4-e5f6-g7h8-i9j0
║ Category      : AUTHENTICATION
║ Status        : 401 (UnauthorizedException)
║ Duration      : 4ms
║ IPv4          : 127.0.0.1
║ User Agent    : Insomnia/2023.5.8
║ Message       : Invalid credentials
╚══════════════════════════════════════════════════════════════╝
```

> [!TIP]
> **Production Logging:** In production (`NODE_ENV=production`), these boxed logs are automatically converted to **Lean JSON** for efficient indexing in ELK or Datadog.

---

## �🔐 Enterprise-Grade Security Features

### 🛡️ Automated PII & Sensitive Data Masking
Our security engine (`mask.util.ts`) runs recursively on every log entry to prevent PR (Personal Record) exposure.
- **Masked Fields**: `password`, `token`, `secret`, `apiKey`, `creditCard`, `cvv`, `authorization`.
- **Method**: Redacts values to `***MASKED***`.

### 🕵️‍♂️ Enriched Metadata
Every log entry is enriched with:
- **System Stats**: CPU load, Memory availability, Uptime.
- **Client Intel**: Masked IP, User-Agent, Origin, Referer.

---

## 🌍 World-Class Internationalization (i18n)
Full integration with `nestjs-i18n`.
- **Detection**: Headers, Cookies, or Query strings.
- **Validation**: Automatic DTO message translation.

---

## ⚡ Performance Monitoring
Any request exceeding **3.0s** automatically triggers a `warn` alert in the logs, enabling you to optimize your most critical endpoints instantly.

---

## 🏢 Business Logic & Licensing
This module is a part of the premium **NexuS API V2 Enterprise Boilerplate**. While the core Response & Error Management system is released here under **MIT License**, the full version (Multi-tenancy, AI-Integration, etc.) will be available as a paid product soon.

We believe in sharing high-quality code. Use this response system to level up your existing NestJS projects.

---

## 🚀 Installation
```bash
# Clone the repository
git clone https://github.com/MertcanMert/nexus-api-v2-response-system.git
cd nexus-api-v2-response-system

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run in Development
npm run start:dev
```

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---\n<p align="center">Made with ❤️ for Professional Backend Teams</p>
