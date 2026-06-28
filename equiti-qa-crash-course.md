# Equiti QA Engineer Interview — 1-Day Crash Course
> **Target:** Junior-to-Mid QA Engineer @ Equiti Brokerage (Seychelles, FSA-regulated FinTech)
> **Time to complete:** 4–8 hours of focused reading + practice
> **Format:** Read section by section. Bolded items = memorize. "SAY THIS" boxes = practice out loud.

---

# ═══════════════════════════════════
# CHEAT SHEET — Morning Of Interview
# ═══════════════════════════════════

## Top 20 Must-Know Terms (Memorize Definitions)
| # | Term | One-Line Definition |
|---|------|---------------------|
| 1 | **STP/ECN Broker** | Straight-through processing; orders go directly to liquidity providers |
| 2 | **Pip** | Price interest point — 4th decimal in FX pairs (0.0001), basis of profit/loss |
| 3 | **Spread** | Difference between bid and ask price — broker's main revenue |
| 4 | **Leverage/Margin** | Borrowed capital to increase position size; margin = collateral |
| 5 | **Lot Size** | Standard unit of trade — 1 lot = 100,000 units of base currency |
| 6 | **Market Order** | Execute immediately at current market price |
| 7 | **Limit Order** | Execute only at specified price or better |
| 8 | **Stop Loss** | Auto-close position when price hits threshold — limits losses |
| 9 | **Margin Call** | Broker demands more funds when losses approach margin threshold |
| 10 | **KYC/AML** | Know Your Customer / Anti-Money Laundering — regulatory compliance |
| 11 | **MT4/MT5** | MetaTrader platforms — industry standard trading terminals |
| 12 | **WebSocket** | Real-time bidirectional communication for live price feeds |
| 13 | **Rate Limiting** | API protection: cap requests per user per time window |
| 14 | **Slippage** | Difference between expected and actual execution price |
| 15 | **Audit Trail** | Immutable log of every action — required by financial regulators |
| 16 | **PCI-DSS** | Payment Card Industry Data Security Standard |
| 17 | **OWASP Top 10** | 10 most critical web security risks (updated every 2–3 years) |
| 18 | **Load Testing** | Simulate concurrent users to measure system capacity |
| 19 | **Smoke Testing** | Quick sanity check — does the critical path work at all? |
| 20 | **Regression Testing** | Re-test existing features to ensure new changes don't break them |

---

## 5 Opening Lines That Impress (Use in First 2 Minutes)
> *Say these naturally — don't memorize word-for-word.*

1. **"I know Equiti is FSA-regulated, which means every feature I test has a compliance dimension — particularly around audit trails, session security, and transaction integrity."**

2. **"For a trading platform, I'd categorize risk into three buckets: financial risk (wrong prices/executions), operational risk (downtime during market hours), and data risk (KYC/PII exposure). Each changes how I approach testing."**

3. **"When I test a trading API, I'm thinking about three performance axes — latency (speed of response), throughput (volume handled), and consistency (does it behave the same under load as at rest)."**

4. **"In FinTech, a bug isn't just a UX problem — it can be a regulatory violation. That's why I always verify that error states produce proper audit logs, not just user-facing messages."**

5. **"I approach security testing as a malicious user with good intentions. My job is to find the holes before someone with bad intentions does."**

---

## Quick Test-Case Templates

### Template A — "Test a Login Flow"
```
1. Valid credentials → success + redirect to dashboard
2. Invalid password → error message, no redirect
3. Unregistered email → error message
4. Empty fields → client-side validation fires
5. SQL injection in email field → sanitized, no DB access
6. XSS in password field → script not executed
7. Session timeout during login → proper redirect
8. Concurrent login from 2 devices → both sessions active (or，后者登出前者)
9. "Forgot password" → email received, token expires correctly
10. Account locked after 5 failed attempts → manual unlock required
```

### Template B — "Test an API Endpoint"
```
Functional: Valid request → 200 + correct data shape
Functional: Invalid param → 400 + error message
Functional: Unauthorized → 401
Functional: Forbidden (wrong role) → 403
Security: Missing rate limit header → flag it
Security: SQL injection in param → sanitized
Security: XSS in string param → sanitized
Performance: 100 concurrent requests → response time < X ms
Performance: 1000 concurrent → graceful degradation or 503
Performance: Large payload → truncated at limit
Edge case: Negative values → rejected or sanitized
Edge case: Unicode/emoji in string → handled correctly
Edge case: Expired auth token → 401 not 500
```

### Template C — "Design a Load Test for Price Feed API"
```
1. Baseline: 1 user → record response time (target < 200ms)
2. Ramp: 100 → 1000 → 10000 concurrent users, measure latency at each step
3. Spike: Jump from 1000 to 5000 users in 10 seconds → system recovers gracefully
4. Soak: Hold 5000 users for 30 minutes → no memory leaks, no slowdown
5. Circuit break: Disable a downstream service → price feed degrades to last-known vs crashing
6. WebSocket: Verify real-time push still fires at max load
7. Metric to measure: p50, p95, p99 response time — not just average
```

---

# ═══════════════════════════════════
# SECTION 1 — Equiti Context (30 min)
# ═══════════════════════════════════

## 1.1 How Equiti Makes Money

```
Revenue Sources (you test all of them):
├── Spread: Buy price - Sell price = broker's cut on every trade
├── Commission: Fixed fee per lot traded (especially on ECN accounts)
├── Swap/Overnight: Interest charged for holding positions past daily close
├── Deposit/Withdrawal fees: Small margins on payment processing
└── Premium services: VPS hosting, signals, advanced charts
```

**Why this matters for QA:**
- Every number on the platform represents real money
- A bug in spread calculation = direct financial loss to the company or client
- Testing isn't just "does it work" — it's "are the numbers correct"

---

## 1.2 Trading Platform Architecture (What You'll Test)

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                        │
│  Web Portal | MT4/MT5 Terminal | Mobile App | API       │
└────────────────────┬────────────────────────────────────┘
                     │ (WebSocket / REST / VPN)
┌────────────────────▼────────────────────────────────────┐
│                 GATEWAY / BRIDGE                        │
│  MT4 Bridge (connects MT4 to core)                      │
│  MT5 Bridge (connects MT5 to core)                      │
│  API Gateway (REST for mobile/web)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               TRADING ENGINE (CORE)                     │
│  Order Manager: validates, routes, matches orders         │
│  Risk Engine: checks margin, calculates exposure          │
│  Price Engine: aggregates prices from liquidity providers │
│  Account Manager: balance, equity, margin calculation    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│            EXTERNAL INTEGRATIONS                        │
│  Liquidity Providers (banks, other brokers)              │
│  Payment Gateways (Visa, Mastercard, Skrill, Neteller)  │
│  Trading Platforms (MT4/MT5 servers)                     │
│  Regulatory Reporting Systems (FSA audit logs)          │
└─────────────────────────────────────────────────────────┘
```

**Key insight for testing:**
- Every trading action flows through ALL layers
- A bug in the Risk Engine can bypass margin checks → unlimited losses
- The MT4/MT5 bridge is a single point of failure — if it goes down, clients can't trade

---

## 1.3 Critical Flows Every QA Must Know

### Flow 1: Placing a Trade
```
Client clicks "Buy" 
  → Order sent to API Gateway 
    → Trading Engine validates (balance, margin, price)
      → Risk Engine checks exposure limits
        → Price Engine fetches current price from liquidity provider
          → Order matched or placed in book
            → Confirmation sent back to client
              → Account balance updated
                → Audit log written (mandatory for FSA)
```

**QA checkpoints at each step:**
- Does the client see the correct current price BEFORE confirming?
- Does the order confirmation show the correct lot size, price, and timestamp?
- Does the balance update immediately or with a delay?
- Does the audit log capture the full chain (request ID, timestamp, IP, user ID, action, result)?

### Flow 2: Deposit via Credit Card
```
Client enters card details on portal
  → Card data sent to payment gateway (tokenized, never touches Equiti's servers directly)
    → Payment processor contacts issuing bank
      → Authorization: funds available? → YES
        → Capture: funds transferred
          → Equiti credits account balance
            → Confirmation email sent
              → Audit log with transaction ID, amount, currency, timestamp
```

**QA checkpoints:**
- What if the bank declines? → User-friendly error, no balance change
- What if capture succeeds but Equiti's server crashes before crediting? → Idempotency key must prevent double-crediting
- What if the same card is used simultaneously from two devices? → Must queue or reject one

### Flow 3: KYC Account Opening
```
Client submits documents (passport, utility bill, selfie)
  → Documents uploaded to secure storage (encrypted at rest)
    → KYC system flags for manual review OR automated verification
      → Approve → Client can trade
        → Reject → Client notified with reason
          → All document access is logged (FSA requirement)
```

**QA checkpoints:**
- Can you access another user's documents by changing an ID in the URL? (Broken Access Control)
- Are documents encrypted at rest?
- Is there an audit log for who accessed which document and when?
- Does the system handle blurry/expired documents gracefully?

---

## 1.4 Regulatory Context (FSA Seychelles)

**What FSA regulation means for testing:**

| Requirement | QA Implication |
|------------|----------------|
| Audit trails for ALL transactions | Every action = logged with timestamp, user ID, IP, action, result |
| Data retention (min 5–7 years) | Test that old records are not deleted; test data export |
| KYC/AML compliance | Test blocked countries, PEP screening, transaction monitoring |
| Capital adequacy reporting | Test margin calculations — must be mathematically precise |
| Incident reporting | Test that system failures generate alerts, not silent drops |
| Session management | Test timeout, concurrent session limits, remote logout |

**Key phrase to use in interview:**
> *"FSA compliance means I'm not just testing functionality — I'm testing evidence. Every test I run generates a log that could be audited. That changes how I think about edge cases."*

---

# ═══════════════════════════════════
# SECTION 2 — Security Testing (90 min)
# ═══════════════════════════════════

## 2.1 OWASP Top 10 — FinTech Relevance

### A01:2021 — Broken Access Control
**What it is:** Users accessing resources they shouldn't.
**Equiti example:**
- Client A changes `account_id=123456` in the URL → sees Client B's trading history
- Admin endpoint `/admin/close-position` accessible to regular trading client
- API returns data for `user_id=X` even when `Authorization: token of user Y` is sent

**Test cases:**
```
1. As User A, intercept request with User B's account_id → verify 403, not 200
2. Try accessing /admin/* endpoints with a non-admin token → verify 403
3. Try changing another user's password via API without being admin → verify rejection
4. Check API responses: does /my/orders return ONLY my orders, or all orders?
```

### A02:2021 — Cryptographic Failures
**What it is:** Sensitive data (PII, financial data) not properly encrypted.
**Equiti example:**
- Credit card numbers returned in API responses (should be masked: ****1234)
- Passwords in plain text in logs or database
- Session tokens in URL query parameters (not headers or cookies)

**Test cases:**
```
1. Login → check response: is password returned anywhere? (should not be)
2. Profile API → does it return full card number? (should be masked)
3. Check cookies: HttpOnly? Secure? SameSite? (critical for session cookies)
4. Inspect network tab during deposit: is card data sent over HTTPS only?
```

### A03:2021 — Injection
**What it is:** Untrusted data interpreted as commands.
**Equiti example:**
- Search field for trade history: `' OR 1=1 --` in date range or symbol field
- Deposit amount field: `100; DROP TABLE transactions; --`
- Username field in login: `admin'--`

**Test cases:**
```
1. Enter ' OR 1=1 -- in every text field → no SQL error in response
2. Enter <script>alert(1)</script> in any field → script not executed in page
3. Enter ${7*7} or {{7*7}} in any field → expression not evaluated (SSTI)
4. Try CR-LF injection in headers: user-agent ending with \r\nContent-Length: 0
5. Check API request: does it use parameterized queries or string concatenation?
```

### A04:2021 — Insecure Design
**What it is:** Missing rate limiting, no brute-force protection, weak password policies.
**Equiti example:**
- No rate limit on login → attacker automates password guessing
- No account lockout → unlimited login attempts
- Password policy: 3 characters minimum → easily brute-forced

**Test cases:**
```
1. Attempt 20 rapid logins with wrong password → account locked or captcha triggered
2. Attempt login with 1000 common passwords → none succeed, IP flagged
3. Check password policy: min 8 chars, uppercase, lowercase, number, special char
4. Verify: does forgot-password rate limit prevent enumeration attacks?
```

### A05:2021 — Security Misconfiguration
**What it is:** Default credentials, unnecessary features enabled, verbose errors.
**Equiti example:**
- `/admin` directory listing enabled → exposes internal paths
- Debug mode enabled in production → stack traces leak internal info
- Default API credentials for third-party services

**Test cases:**
```
1. Check for /admin, /debug, /status endpoints → should require auth or not exist
2. Trigger a 500 error → does it show a stack trace or a generic "Something went wrong"?
3. Check HTTP headers: X-Frame-Options, CSP, X-Content-Type-Options present?
4. Check for TRACE method enabled → can leak cookies via Cross-Site Tracing
```

### A06:2021 — Vulnerable & Outdated Components
**What it is:** Using libraries with known CVEs.
**Equiti example:**
- Old jQuery version with XSS vulnerability in `.html()` method
- Outdated payment library with CVEs in its dependencies

**Test cases:**
```
1. Check what third-party libraries are loaded (Wappalyzer, built-with.com)
2. Run npm audit or dependency check on the project
3. Check if any library has a known CVE (cve.mitre.org search)
4. Verify: is there a software bill of materials (SBOM) maintained?
```

### A07:2021 — Identification & Authentication Failures
**What it is:** Weak auth, session fixation, improper session handling.
**Equiti example:**
- Session ID doesn't change after login (session fixation)
- Session doesn't expire after logout (session persists)
- Multiple concurrent sessions allowed without notification

**Test cases:**
```
1. Login → logout → reuse old session token → should be invalid
2. Login → check session cookie before and after → ID should change
3. Login on Device A → login on Device B → check if Device A is invalidated
4. Session idle for 30 min → try to trade → should require re-login
5. Set cookie domain incorrectly → token sent to subdomains it shouldn't reach
```

### A08:2021 — Software & Data Integrity Failures
**What it is:** Untrusted CDNs, no code signing, auto-update vulnerabilities.
**Equiti example:**
- Trading platform loads a script from an untrusted CDN
- Mobile app auto-updates without signature verification

**Test cases:**
```
1. Check if critical JS files are loaded from CDN with SRI (Subresource Integrity) hash
2. Check if mobile app verifies code signatures before installing updates
3. Check if any API response can be modified mid-flight (MITM with Burp Suite)
```

### A09:2021 — Security Logging & Monitoring Failures
**What it is:** No logs for security events, no alerting, breaches go undetected.
**Equiti example:**
- Failed login attempts not logged
- Admin actions not logged
- No alert when 1000 trades fail in 1 minute

**Test cases:**
```
1. Trigger a failed login → check logs: is it recorded with IP, timestamp, user?
2. Trigger 50 failed logins from same IP → check if alert fires
3. As admin, perform a user balance adjustment → check audit log entry exists
4. Disable logging service → does the trading engine keep working or halt?
```

### A10:2021 — Server-Side Request Forgery (SSRF)
**What it is:** Attacker forces server to make unintended requests.
**Equiti example:**
- Image upload URL field: `https://internal-admin.local/settings`
- PDF statement download URL: user-controlled URL parameter
- Webhook callback URL: user can specify internal IPs

**Test cases:**
```
1. In image URL field, enter http://169.254.169.254/ (AWS metadata)
2. In webhook URL field, enter http://localhost:22 (SSH)
3. In document fetch URL, enter file:///etc/passwd
4. Check: do server-side requests follow redirects? Can you chain them?
```

---

## 2.2 FinTech-Specific Security Scenarios

### Scenario S1: Session Hijacking on Trading Platform
**Attack:** Attacker steals a trader's session token → executes trades without authorization.
**Test your understanding:**
```
Prevention:
- Session tokens in HttpOnly, Secure cookies
- Session token rotated after login
- HTTPS required for all requests
- IP binding (optional but good): session token only valid from same IP

Test cases to write:
1. Steal session cookie via XSS → verify attacker cannot use it (HttpOnly prevents JS access)
2. Intercept request over HTTP → verify session cookie is not sent (Secure flag)
3. Login twice in a row → verify session token changes (no fixation)
4. As admin, change user's password → verify user's active sessions are invalidated
```

### Scenario S2: API Key Exposure in Mobile/Web Client
**Attack:** API key hardcoded in mobile app → attacker extracts it → makes trades on behalf of user.
**Test your understanding:**
```
Prevention:
- API keys stored in secure enclave (iOS Keychain, Android Keystore)
- Never in source code, not in API responses
- Use OAuth2 with short-lived access tokens + refresh tokens

Test cases to write:
1. Decompile mobile app (apktool for Android) → search for API keys → none found in source
2. Intercept API traffic → verify no API key in request headers (should use JWT Bearer token)
3. Check GitHub repos for leaked API keys (try searching Equiti's org if public)
4. Verify rate limits apply per-user-token, not per-API-key
```

### Scenario S3: Payment Gateway Replay Attack
**Attack:** Attacker intercepts a valid payment request → replays it 100 times → gets credited 100x.
**Test your understanding:**
```
Prevention:
- Idempotency keys: unique token per transaction, server rejects duplicate keys
- Timestamp validation: requests older than 5 minutes rejected
- One-time-use tokens (nonces)

Test cases to write:
1. Submit deposit request → intercept → replay exact same request → second attempt fails with "duplicate transaction"
2. Submit deposit → intercept → replay with different idempotency key → both may succeed (intentional) → verify only one credit
3. Wait 10 minutes → replay old request → verify rejection due to timestamp
```

### Scenario S4: Order Manipulation via MITM
**Attack:** Attacker intercepts order to buy at market price → modifies price to a manipulated value → executes at advantageous price.
**Test your understanding:**
```
Prevention:
- HTTPS with certificate pinning
- Order price validated server-side (never trust client price)
- Time-of-trade validation (price must be within X% of current market)

Test cases to write:
1. Intercept market order → modify price in request → server rejects or re-validates against live price
2. Intercept limit order → change expiry date to far-future → server enforces max expiry
3. Place order at current price → wait 30 seconds → server confirms price at execution time, not submission time
```

### Scenario S5: KYC Document Tampering
**Attack:** User uploads a fake passport → system approves it automatically.
**Test your understanding:**
```
Prevention:
- Manual review workflow for high-risk applications
- Liveness detection for selfie (not just photo upload)
- Document expiration validation
- Cross-reference with sanctions/PEP lists

Test cases to write:
1. Upload expired passport → system rejects or flags for manual review
2. Upload photoshopped document → verify manual review catches it
3. Upload someone else's document → liveness check should fail
4. Check: does the system log WHO reviewed a KYC submission and WHEN?
5. Try to access KYC documents of another user by changing IDs → should be 403
```

---

## 2.3 "Walk Me Through a Security Test" — Full Example Answer

**Interview question:** *"Walk me through how you'd test the security of Equiti's login flow."*

**Memorize this structure:**

```
STEP 1 — Map the attack surface
"I'd start by identifying every entry point in the login flow: 
the login form (username, password), the forgot-password flow, 
the registration flow, the session management after login, and any 
API endpoints used. For each, I note what data is transmitted and 
where it goes."

STEP 2 — Test authentication security
"Then I'd test authentication itself:
- Valid login works and creates a new session (not a fixed one)
- Invalid credentials show a generic error (not 'user exists, wrong password')
- After 5 failed attempts, account locks or captcha triggers
- Password field doesn't echo back in responses
- Password meets complexity requirements (8+ chars, mixed case, number, special)
- Concurrent sessions: logging in on Device B should not immediately invalidate Device A without warning"

STEP 3 — Test for injection
"Next I'd test injection vectors:
- Username field: try SQLi (' OR 1=1 --), XSS (<script>), SSTI ({{7*7}})
- Password field: same vectors
- Check for HTTP parameter pollution: username=a&username=b
- Check for CRLF injection in any redirect URL parameters"

STEP 4 — Test session management
"Then session security:
- Cookie has HttpOnly, Secure, SameSite=Strict flags
- Session token changes after login
- Session expires after inactivity (check the timeout value is reasonable, e.g., 15-30 min)
- After logout, session token is invalidated server-side
- _csrf token is present in login form and validated on submission"

STEP 5 — Test for broken access control
"After logging in:
- Can I access /admin routes with a regular user token?
- Can I access another user's data by changing IDs in the URL?
- Does the API validate that the requested resource belongs to the authenticated user?"

STEP 6 — Test error handling
"Finally error handling:
- Does a 403/404/500 error give away information? (should be generic)
- Does the server banner reveal version info?
- Are there default/demo accounts I can find?"

STEP 7 — Document findings
"I'd document each test case, its expected result, actual result, 
and severity. Critical findings go to the top with remediation suggestions."
```

---

## 2.4 Security Test Plan Template

For any feature, use this structure:

```
SECURITY TEST PLAN: [Feature Name]
==================================

1. INFORMATION GATHERING
   - Entry points (URLs, APIs, WebSockets, files)
   - User roles (anonymous, authenticated, admin)
   - Data sensitivity classification (PII, financial, session)
   - Third-party integrations

2. AUTHENTICATION TESTING
   - Credential transmission: HTTPS only? Token in header not URL?
   - Password policy: min length, complexity, history
   - Brute force protection: lockout, captcha, rate limit
   - Forgot password: token entropy, expiry, reuse prevention

3. AUTHORIZATION TESTING  
   - Horizontal privilege: can user A access user B's data?
   - Vertical privilege: can regular user access admin functions?
   - Parameter tampering: can I change IDs in requests?

4. INPUT VALIDATION TESTING
   - SQL injection: in every field
   - XSS: reflected, stored, DOM-based in every field
   - Command injection: in every field that interacts with shell/system
   - Type coercion: string to number, number to boolean
   - Null byte injection: in file upload fields

5. SESSION MANAGEMENT TESTING
   - Cookie attributes: HttpOnly, Secure, SameSite
   - Session lifecycle: creation, timeout, logout, invalidation
   - Session fixation: token doesn't survive login
   - Concurrent sessions: limit and notification

6. CRYPTOGRAPHIC TESTING
   - Data at rest: sensitive fields encrypted in DB?
   - Data in transit: HTTPS everywhere? Certificate pinning?
   - Secrets in code: no API keys, no passwords in source

7. LOGGING & MONITORING
   - Are security events logged? (login, logout, failed attempts, admin actions)
   - Do logs contain PII? (should not, or should be masked)
   - Is there alerting for anomalous activity?

8. COMPLIANCE CHECKLIST (FSA-specific)
   - Audit trail exists for all financial transactions
   - PII is encrypted at rest and in transit
   - Data retention policy is enforced
   - User sessions can be remotely terminated by admin
```

---

# ═══════════════════════════════════
# SECTION 3 — API Performance Testing (90 min)
# ═══════════════════════════════════

## 3.1 Trading API Fundamentals

### How a Trading API Works
```
Client (Trader's app)
   │
   │ HTTPS REST or WebSocket
   ▼
API Gateway (rate limit, auth, routing)
   │
   │ Internal gRPC or HTTP
   ▼
Trading Engine
   │
   │ Market Data Feed
   ▼
Price Aggregator (from multiple liquidity providers)
   │
   │ Real-time prices
   ▼
Client receives: bid/ask spread, executes trade
```

### Key API Types at a Brokerage

| API Type | Purpose | Latency Requirement | Protocol |
|----------|---------|-------------------|----------|
| **Price Feed** | Stream live bid/ask prices | < 100ms | WebSocket |
| **Order Placement** | Submit buy/sell orders | < 500ms | REST |
| **Order Management** | Modify/cancel existing orders | < 500ms | REST |
| **Account Info** | Balance, equity, margin | < 1s | REST |
| **Trade History** | Past positions, statements | < 2s | REST (paginated) |
| **Deposit/Withdraw** | Payment operations | < 5s | REST (async webhooks) |

### REST vs WebSocket for Trading
```
REST: Request-Response
- Client asks → Server answers
- Good for: account queries, order management, history
- Bad for: real-time prices (polling = too slow)

WebSocket: Persistent Bidirectional Connection
- Server pushes prices as they change
- Good for: live price feeds, trade confirmations
- Challenge: connection management, reconnection logic
```

---

## 3.2 API Performance Test Scenarios

### Scenario P1: Load Test Price Feed with 10K Concurrent Connections
**Question:** "Design a load test for the live price feed API supporting 10,000 concurrent traders."

**Full example answer:**

```
OBJECTIVE: Verify price feed API handles 10K concurrent WebSocket connections 
           without degradation below p99 latency of 200ms.

TOOLS: k6 (JavaScript-based, good for WebSocket), JMeter (if REST only)

TEST DATA SETUP:
- Create 10,000 test accounts
- Pre-subscribe each to 10 currency pairs
- Or: use few accounts with many concurrent connections per account (if allowed)

SCENARIOS:

1. BASELINE (smoke test)
   - 1 user, 100 requests
   - Measure: avg response time, error rate
   - Target: p99 < 100ms, 0 errors

2. LOAD TEST — Ramp up
   - 0 → 2,000 users over 2 min
   - 2,000 → 5,000 users over 3 min  
   - 5,000 → 10,000 users over 3 min
   - Hold at 10,000 for 10 min
   Measure at each step: p50, p95, p99 latency, error rate, CPU, memory

3. SPIKE TEST
   - Steady 2,000 users
   - Suddenly jump to 10,000 (in 10 seconds)
   - Measure: does it recover gracefully? Does it shed load or crash?

4. SOAK TEST
   - 8,000 users for 2 hours
   - Monitor: memory leak? Slow drift in response times? Connection pool exhaustion?

5. BREAKAGE TEST
   - Push until it breaks — find the max capacity
   - At what number does latency exceed 500ms? 1 second?
   - What happens when capacity is exceeded? 503? Queue? Drop?

METRICS TO COLLECT:
- Response time: p50, p95, p99 (not just average)
- Throughput: requests/second
- Error rate: 4xx and 5xx responses
- Resource usage: CPU, memory, network bandwidth
- WebSocket: connection success rate, message delivery latency

ACCEPTANCE CRITERIA:
- At 10,000 concurrent: p99 < 200ms
- Error rate < 0.1%
- No connection drops after sustained load
- Memory stable over 2 hours (no leak)
```

### Scenario P2: Order Execution Latency Under Load
**Question:** "When 5,000 users simultaneously place market orders during high volatility, what latency should you expect? How would you test this?"

**Full example answer:**

```
CRITICAL CONTEXT: 
Market orders during high volatility are the highest-risk scenario.
Price changes every millisecond — a 500ms delay can mean 
the difference between profit and loss.

EXPECTED LATENCY TARGETS:
- p50: < 100ms
- p95: < 300ms
- p99: < 500ms

WHY: A 1-pip slippage on EUR/USD = $10/lot. 500ms delay at market open 
can mean 5-20 pips slippage. That's $50-$200 loss per lot.

LOAD TEST DESIGN:
1. Simulate market volatility: price changes every 50ms (not static)
2. Ramp users: 100 → 1000 → 3000 → 5000 over 5 minutes
3. Each user submits 1 market order per minute
4. Measure: order acknowledgment time, order fill time, price slippage

KEY METRICS:
- Order submission to acknowledgment: < 300ms p99
- Order acknowledgment to fill confirmation: < 200ms p99
- Price slippage: measured against reference price at time of receipt
- Failed orders: should be < 0.01%

WHAT BREAKS UNDER THIS LOAD:
- Database connection pool exhaustion (too many concurrent writes)
- Risk engine bottleneck (margin calculations can't keep up)
- Price feed lag (prices stale by the time order executes)
- Message queue backlog (orders pile up in broker queue)
```

### Scenario P3: API Pagination Performance
**Question:** "A client wants to fetch 10 years of trade history — that's approximately 50,000 trades. How do you test this?"

**Answer:**

```
PROBLEM: Fetching 50,000 records in one API call would:
- Timeout the request (30+ seconds)
- Crash the server (memory exhaustion)
- Break the client (too much JSON to parse)

SOLUTION: API pagination

TESTING ANGER:
1. Request page 1 (default size, e.g., 50 records) → verify correct
2. Request page size of 10,000 → does server reject it? (should have max limit)
3. Request page 1, then page 2 → verify no duplicates, no gaps in records
4. Request with sort: newest first → verify correct ordering
5. Request with date filter: last 30 days only → verify correct subset
6. Concurrent pagination: 100 users requesting different pages simultaneously
7. Performance: what is response time for page 1 vs page 1000? (should be similar if indexed)

EDGE CASES:
- Empty result set → proper response with empty array, not error
- Page number beyond available data → empty array, not 500
- Negative page number → validation error (400)
- Non-numeric page → validation error (400)
```

### Scenario P4: Rate Limiting Edge Cases
**Question:** "Design test cases for rate limiting on the trading API."

**Answer:**

```
RATE LIMIT RULES (typical):
- 100 requests/minute per account
- 1000 requests/minute per IP
- 1 order/second per account

TEST CASES:

1. At 99 requests/minute → should succeed
2. At 101 requests/minute → should return 429 Too Many Requests
3. At exactly 1 minute later → should reset and succeed again
4. Concurrent: 100 requests in 10 seconds from same account → some get 429
5. From IP with 100 accounts: 1000 requests/minute total → IP blocked or throttled

RATE LIMIT HEADERS (check these exist):
- X-RateLimit-Limit: 100
- X-RateLimit-Remaining: 57
- X-RateLimit-Reset: 1623456789 (Unix timestamp)

6. After receiving 429 → does Retry-After header tell client when to retry?
7. Graceful degradation: when rate limited, does the API still allow order placement?
   (Some APIs exempt critical endpoints from rate limiting)
8. Concurrent from multiple IPs: 100 IPs × 10 requests each = 1000 → should NOT be blocked
   (verifies per-IP and per-account limits are independent)
```

### Scenario P5: WebSocket Reconnection Logic
**Question:** "If a trader's WebSocket connection drops for 5 seconds during a volatile market, what should happen when they reconnect?"

**Answer:**

```
EXPECTED BEHAVIOR:
1. Client detects disconnection (no pong response to ping)
2. Client waits 1 second → reconnects automatically
3. On reconnect → client sends auth token + last sequence number received
4. Server replays: missed price updates since last sequence number
5. Trader sees: current price + brief "reconnecting..." overlay
6. Server does NOT replay orders (orders are REST — not affected by WebSocket drop)

TEST CASES:
1. Disconnect for 1 second → reconnect → verify price resync < 500ms
2. Disconnect for 1 minute → reconnect → verify still authenticated
3. Disconnect for 30 minutes → reconnect → should require re-login (session expired)
4. While disconnected: 50 price updates happen → on reconnect → verify all 50 are replayed in order
5. Client reconnects before old connection fully closed → handle duplicate connections gracefully
6. Network flapping (connect, disconnect, reconnect rapidly) → no memory leak, no orphan connections
```

---

## 3.3 JMeter / k6 Quick Reference

### JMeter — When to Use
- Enterprise teams, complex scenarios, historical record
- Good for: REST APIs, record-and-playback, CSV data-driven tests
- Learning curve: medium

```
Thread Group:
- Threads (users): 10000
- Ramp-up period: 300s (gradual ramp)
- Hold for: 600s
- Sampler: HTTP Request (GET /api/prices)
- Assertions: Response Assertion (status 200), JSON Path (price exists)
- Listeners: Summary Report, View Results Tree
```

### k6 — When to Use
- Modern teams, code-based, CI/CD integration
- Good for: WebSocket, REST, quick scripting, JavaScript
- Learning curve: low

```javascript
// k6 WebSocket load test example
import ws from 'k6/ws';

export const options = {
  vus: 10000,
  duration: '10m',
};

export default function () {
  ws.connect('wss://api.equiti.com/prices', () => {
    ws.onMessage((data) => {
      const price = JSON.parse(data);
      if (price.bid === undefined) {
        throw new Error('Missing bid price');
      }
    });
    
    ws.send(JSON.stringify({ action: 'subscribe', pairs: ['EURUSD'] }));
    
    ws.pause(5); // hold connection for 5 seconds
  });
}
```

### Postman — When to Use
- Manual testing, API exploration, quick checks
- Good for: functional testing of individual endpoints, pre-conditions
- Weakness: not designed for heavy load testing (use k6/JMeter for that)

```
Postman for performance:
- Collection Runner: run a collection with iterations and delay
- Monitor: scheduled health checks
- Newman (CLI): can integrate with CI/CD for smoke tests
```

---

## 3.4 "Design a Performance Test" — Full Example Answer

**Interview question:** *"Design a performance test plan for Equiti's deposit API."*

**Memorize this structure:**

```
STEP 1 — Define the objective
"I need to understand what 'performance' means for the deposit API:
- Speed: how fast does a deposit confirmation appear?
- Throughput: how many deposits per minute can the system process?
- Reliability: does every deposit get credited exactly once (idempotency)?
- Degradation: what happens when the payment gateway is slow?"

STEP 2 — Map the flow and dependencies
"A deposit involves:
1. Client submits card details → to Equiti's server (HTTPS)
2. Equiti server tokenizes card → sends to payment gateway
3. Payment gateway contacts issuing bank → authorization
4. Capture → funds transferred
5. Webhook callback to Equiti → balance credited
6. Email/SMS confirmation sent

Each of these is a potential bottleneck."

STEP 3 — Identify performance criteria
"For a deposit:
- p95 < 5 seconds for user-facing confirmation
- p99 < 10 seconds (some bank authorizations are slow)
- 0% duplicate credits (critical: idempotency must work)
- 100% deposit success with correct balance update"

STEP 4 — Design the test scenarios
"I'd design 5 scenarios:

1. BASELINE: 1 user deposits $100 → measure single-request time
2. LOAD: 100 concurrent deposits → p95 < 5s, no duplicates
3. SPIKE: 0 → 200 deposits in 10s → graceful rejection or queue
4. GATEWAY SLOWDOWN: simulate payment gateway taking 10s → 
   does Equiti's server timeout correctly? Does user see proper error?
5. RECOVERY: gateway comes back after 30s outage → 
   do pending deposits complete? Are webhook retries handled?"

STEP 5 — Define metrics
"Metrics I'd track:
- Time to deposit confirmation (user-perceived)
- Time to webhook callback receipt
- Balance update latency (from deposit to showing in account)
- Error rate by error type (timeout vs decline vs system error)
- Idempotency: 0 duplicate credits under concurrent load"

STEP 6 — Tools and environment
"I'd use:
- k6 with test data (multiple cards, multiple amounts)
- Separate test environment (not production)
- Blazemeter or Grafana k6 cloud for distributed load
- Monitor payment gateway's response time independently"
```

---

# ═══════════════════════════════════
# SECTION 4 — Trading Platform Scenarios (60 min)
# ═══════════════════════════════════

## 4.1 Order Types — Test Cases

### Market Order
```
BUY at market price = execute immediately at current ask price
SELL at market price = execute immediately at current bid price

Test cases:
1. Place BUY market order at current price → executed at exact current ask (+ slippage noted)
2. Place SELL market order → executed at exact current bid
3. Market order during low liquidity (weekend) → verify wider spread is applied
4. Market order for a stock during market hours vs after hours → correct price source
5. Market order for 100 lots → partial fill possible? Document behavior
6. Price changes between order submission and execution → user sees actual fill price
7. Insufficient margin for order size → order rejected with margin error
```

### Limit Order
```
BUY limit = execute only at specified price OR LOWER (cheaper)
SELL limit = execute only at specified price OR HIGHER (better)

Test cases:
1. BUY limit at $1.20, current price $1.30 → order sits in book (not executed)
2. Price drops to $1.20 → order executes at $1.20
3. Price drops below $1.20 (to $1.15) → order executes at $1.15 (better than limit)
4. SELL limit at $1.40, current $1.30 → order sits in book
5. Price rises to $1.40 → executes at $1.40
6. Price jumps above $1.40 (to $1.45) → executes at $1.40 (better for seller)
7. Limit order expires: specify GTC (good till cancelled) vs day order
```

### Stop Loss Order
```
Purpose: limit losses if price moves against you

Test cases:
1. Open LONG position at $100 → set stop loss at $95
2. Price drops to $95 → stop loss triggers → position closed at $95
3. Price gaps down to $88 (overnight) → stop executes at $88, not $95 (slippage)
4. Stop loss during high volatility → verify it's not triggered by normal fluctuation
5. Trailing stop: price rises to $120 → trailing stop follows at $115 → 
   price drops to $115 → position closed. Verify trailing distance maintained correctly.
```

### Trailing Stop
```
Dynamic stop loss that follows price as it moves in your favor

Test cases:
1. Buy at $100, trailing stop 10 pips
   - Price $100 → stop at $99.90
   - Price $110 → stop trails to $109.90 (always 10 pips behind)
   - Price $115 → stop trails to $114.90
   - Price drops to $114.90 → STOP TRIGGERS → sell executed
2. Verify trailing stop only moves UP, never down
3. Trailing stop on SELL position: trails behind when price drops
4. Platform disconnect: does trailing stop still execute server-side?
   (Critical: should execute even if trader's app is closed)
```

---

## 4.2 Margin & Leverage Testing

### Leverage
```
1:100 leverage = $1,000 of your money controls $100,000 position
Margin = $1,000 deposited holds the $100,000 position

Test cases:
1. Account with $1,000 → 1:100 leverage → can open $100,000 in positions
2. Open $50,000 position → remaining margin = $500
3. Open second $50,000 position → margin used = $1,000 = total equity → margin call
4. Margin call triggered → verify user sees warning + cannot open new positions
5. Price moves against large position → margin level drops to 20% → forced close
6. Switch from 1:100 to 1:10 leverage on existing positions → margin requirement increases → margin call if insufficient
```

### Margin Calculation (Practice These Numbers)
```
Scenario: Account equity = $5,000, leverage = 1:100
- Max position size = $5,000 × 100 = $500,000 = 5 lots (1 lot = $100,000)

If you buy 3 lots ($300,000):
- Margin used = $300,000 / 100 = $3,000
- Available margin = $5,000 - $3,000 = $2,000

If price moves against you and equity drops to $3,000:
- Margin level = ($3,000 / $3,000) × 100% = 100%
- Margin call typically at 50-80% → warning triggered
- Forced close at 20-30% margin level

Test: Verify these calculations match what the platform displays.
If there's a 1-pip discrepancy in margin, it could trigger unnecessary margin calls.
```

---

## 4.3 Platform Sync (MT4 Bridge) Test Cases

**The MT4/MT5 bridge connects MetaTrader platforms to Equiti's core trading engine. If it fails, traders can't execute new orders but existing positions remain open.**

```
SCENARIO 1: MT4 Bridge goes down during trading hours
- New orders from MT4 clients → fail to reach trading engine
- Existing open positions → remain open (not affected)
- Price feed from MT4 → stops updating
- Clients may see "offline" or "reconnecting" in MT4 terminal
- Equiti operations team gets alert

TEST:
1. Simulate MT4 bridge failure → verify alert is generated
2. Verify new order attempts show error, not silent failure
3. Verify existing positions can still be closed (order routed differently)
4. Verify balance/margin calculations still update for existing positions
5. Test MT4 bridge auto-restart → verify orders resume within X seconds

SCENARIO 2: MT4 Bridge comes back online
- Pending orders should resume processing
- Price feed should resume within seconds
- No duplicate orders (idempotency check)

TEST:
1. Drop and restore bridge → verify no duplicate executions
2. Verify pending orders placed during outage are processed in correct sequence
3. Verify price after restore is accurate, not stale
```

---

## 4.4 Split-Brain Scenario Testing

**Critical FinTech scenario: the same account shows different data on web vs mobile vs MT4.**

```
SCENARIO: Client's web portal shows balance $10,000.
          Same client's mobile app shows balance $9,500.
          Same client's MT4 shows balance $9,800.

WHY THIS HAPPENS:
- Web and mobile read from the core database directly
- MT4 reads from the MT4 server's copy of the database
- Sync lag between MT4 bridge and core → temporary discrepancy

TEST CASES:
1. After any balance-affecting action (deposit, trade, withdrawal):
   verify ALL platforms show the same balance within 5 seconds
2. During high-volume trading: check if discrepancy appears
3. When MT4 bridge is under load: does lag increase?
4. If discrepancy exceeds $1 (any amount): does ops team get alerted?
5. Client disputes balance: which source is authoritative? (Core DB is truth)
```

---

## 4.5 Bug Triage Exercise

**You found these 10 bugs on release day. You have 2 hours. Prioritize and justify.**

| Bug | Severity | Risk | Priority |
|-----|----------|------|----------|
| A. Margin call triggers at 50% instead of 30% | High | Financial loss to clients | P1 |
| B. "Forgot password" email has 24hr expiry instead of 1hr | Low | Security risk | P3 |
| C. Price chart shows wrong timeframe label (1H instead of 4H) | Medium | UX confusion, no financial impact | P4 |
| D. 50% of WebSocket connections drop after 30 minutes | Critical | Complete service outage for half users | P1 |
| E. "Copy trading" feature duplicates some trades | High | Followers lose money on double positions | P1 |
| F. Dark mode toggle doesn't persist after refresh | Low | Minor UX annoyance | P5 |
| G. Export statement button doesn't work in Safari | Medium | Enterprise users on Mac can't export | P3 |
| H. New user sees 0 trades even after opening first position | High | Critical trust/verification issue | P2 |
| I. VIP clients aren't getting the correct leverage (50:1 instead of 100:1) | Critical | Regulatory + financial | P1 |
| J. Error log contains full credit card numbers in plaintext | Critical | PCI-DSS violation + data exposure | P1 |

**Priority 1 — Fix Now:**
- D (service outage), E (financial loss), I (regulatory + financial), J (security/PCI breach)
**These halt shipping immediately.**

**Priority 2 — Fix Today:**
- A (financial calculation error), H (data integrity)
**These can ship if fixes are quick; otherwise P1.**

**Priority 3 — Fix This Week:**
- B (security config error), G (browser compatibility)
**Non-blocking but important.**

**Priority 4/5 — Backlog:**
- C (cosmetic), F (cosmetic)

**Key reasoning for interview:**
> *"B and J both look like security bugs, but J is P1 because it actively exposes card data — that's a PCI-DSS violation that requires immediate disclosure and remediation. B is lower because the 24hr window is long enough that exploitation is unlikely before the fix ships."*

---

# ═══════════════════════════════════
# SECTION 5 — Payment & Compliance (60 min)
# ═══════════════════════════════════

## 5.1 Deposit Flow — Complete Test Cases

```
HAPPY PATH:
1. Client logs in → navigates to Deposit
2. Selects Visa → enters $1,000 → submits
3. Redirected to Stripe/payment page → enters card details
4. Authorization: bank approves → capture succeeds
5. Equiti credits $1,000 to account (minus processing fee)
6. Confirmation email sent → balance reflects deposit immediately
7. Audit log: transaction_id, user_id, amount, currency, method, timestamp

TEST CASES:

FUNCTIONAL:
1. Valid Visa → $1,000 deposit → credited within 5 seconds
2. Valid Mastercard → same amount → works
3. Visa decline (insufficient funds) → clear error message, no balance change
4. Visa decline (expired card) → clear error message
5. Visa decline (bank rejection) → generic "payment declined" (never say why specifically)
6. Network timeout during payment → user sees retry option, no duplicate charge
7. Partial capture (e.g., $500 authorized but network error on full $1,000) → $0 captured, retry allowed

COMPLIANCE:
8. Same card used simultaneously from two devices → only one deposit succeeds (idempotency)
9. Deposit of $10,000+ triggers AML review → user notified, funds held pending review
10. Deposit from blocked country → rejected at payment gateway

SECURITY:
11. Intercepted API request → modified to $100,000 → server validates against balance/limit
12. Card number in response → should be masked or tokenized
13. Deposit API accessible without authentication → should return 401

PERFORMANCE:
14. 50 concurrent deposits → all processed within 30 seconds
15. Payment gateway downtime → user informed within 10 seconds, not hanging indefinitely
```

---

## 5.2 Withdrawal Flow — Complete Test Cases

```
HAPPY PATH:
1. Client requests $500 withdrawal to Skrill
2. System checks: balance >= $500? Yes
3. System checks: daily limit not exceeded? Yes
4. $500 deducted from trading account (pending)
5. Withdrawal request submitted to Skrill
6. Skrill credits client's Skrill account
7. Webhook confirms success → status changes to "completed"
8. Audit log: transaction_id, amount, method, destination, timestamp, status

TEST CASES:

FUNCTIONAL:
1. Request $500 when balance is $500 → pending → completed → balance $0
2. Request $500 when balance is $300 → rejected with clear error
3. Request $500 when daily limit is $400 → rejected with limit info
4. Skrill account name doesn't match Equiti account → rejected (name mismatch fraud check)
5. Cancel withdrawal while pending → balance restored immediately

EDGE CASES:
6. User requests withdrawal → then immediately opens a large trade → 
   system must hold withdrawal amount in reserved balance, not available margin
7. Withdrawal pending → account gets margin called → 
   withdrawal should be automatically cancelled OR ops alerted
8. Skrill withdrawal fails (wrong account) → webhook returns error → 
   funds returned to trading account → user notified with next steps

COMPLIANCE:
9. Withdrawal to third party (not the account holder) → AML flag → rejected
10. Multiple withdrawals same day totaling $9,000 (just under $10K AML threshold) → 
    flagged as structuring → human review triggered
11. First-time withdrawal of $5,000+ → KYC re-verification triggered

SECURITY:
12. Attacker compromises account → requests withdrawal → 
    email/SMS notification sent to real user before processing (anti-fraud hold)
13. Attacker changes withdrawal destination to their Skrill → 
    pending 24hr hold + email confirmation required
```

---

## 5.3 KYC/AML Testing Angles

```
KNOW YOUR CUSTOMER (KYC):
- Document verification: passport, national ID, driver's license
- Proof of address: utility bill, bank statement (within 3 months)
- Liveness check: selfie with document, not a photo

TEST CASES:

1. Upload blurry passport → system rejects with "image unreadable"
2. Upload expired passport → system rejects or flags for manual review
3. Upload document in wrong format (PDF instead of JPG) → appropriate error
4. Upload photoshopped document → manual review detects it
5. Upload someone else's document → liveness check fails
6. Upload valid docs → approved within X hours → can trade

ANTI-MONEY LAUNDERING (AML):
- Transaction monitoring: unusual patterns flagged
- Sanctions screening: against PEP/sanctions lists
- Suspicious activity: structuring, rapid movement

TEST CASES:
7. Client receives $9,500 deposit → immediately requests $9,400 withdrawal → 
   flagged as potential structuring
8. Client suddenly receives $50,000 from multiple sources → AML review triggered
9. Politically Exposed Person (PEP) flagged → enhanced due diligence (EDD) required
10. Client on sanctions list tries to open account → immediate rejection

COMPLIANCE TESTING:
11. Attempt to open account from OFAC-blocked country → rejection at registration
12. Attempt to change nationality in profile after account creation → requires re-verification
13. Attempt to remove 2FA after large balance → system warns or requires cooling period
```

---

# ═══════════════════════════════════
# SECTION 6 — STAR Method Practice Bank (60 min)
# ═══════════════════════════════════

## STAR Method Reminder
```
S — Situation: Set the scene. What was the context?
T — Task: What was YOUR responsibility in that situation?
A — Action: What specific steps did YOU take?
R — Result: What was the outcome? Quantify if possible.
```

---

## Q1: "Tell me about a time you found a critical bug before release."

**Answer:**
> **Situation:** "At my previous company, we were 2 days from shipping a major release — a new payment integration with a digital wallet provider. I was running my final regression suite."
>
> **Task:** "My job was to verify the deposit and withdrawal flows worked correctly across all supported currencies before the release deadline."
>
> **Action:** "I tested a withdrawal to the digital wallet with a non-base currency — say, a EUR account converting to USD. I discovered that when the currency conversion API returned a rate with more than 4 decimal places, the withdrawal amount was truncated incorrectly. For a €10,000 withdrawal, this resulted in a €3 discrepancy — the user would receive €9,997 instead of €10,000, with the remaining €3 going into a suspense account. I immediately escalated to the lead developer with my exact reproduction steps, the API response payload, and the database state after the transaction."
>
> **Result:** "We held the release, spent a day fixing the rounding logic, and re-ran the full test suite. The bug was in the same rounding function used across 7 other currency pairs. If it had shipped, we would have had an unreconcilable discrepancy on every non-base-currency withdrawal — potentially thousands of euros per day across all affected pairs. The PM told me this was the most impactful find of that quarter."

---

## Q2: "Tell me about a time you had to prioritize tests under a tight deadline."

**Answer:**
> **Situation:** "We were releasing a new feature — cryptocurrency trading — and discovered 3 bugs 4 hours before the release window closed. The feature involved 4 components: the order book, the price engine, the wallet balance, and the transaction log."
>
> **Task:** "I had to decide which bugs to fix before release and which could ship as known issues, while protecting the core trading functionality."
>
> **Action:** "I triaged all 3 bugs against our risk framework. Bug 1: wallet balance showing incorrect decimals on the UI but backend calculation correct — cosmetic, could ship. Bug 2: transaction log occasionally duplicating the last entry on page refresh — data integrity concern, risky but low probability. Bug 3: order book not updating in real time on the web platform only — critical, but only affected web, mobile worked fine. I recommended we ship Bug 3's fix (it was a one-line WebSocket subscription issue), hold Bug 2 for emergency patch within 24 hours, and ship Bug 1 as a known issue with a UI note. I wrote up my rationale with a risk matrix and got sign-off from the EM and QA lead in 30 minutes."
>
> **Result:** "Release shipped on time. Bug 2 shipped 18 hours later in a hotfix. Bug 1 was fixed in the next sprint. No customer complaints on any of the three issues post-release."

---

## Q3: "Describe a time you disagreed with a developer about whether something was a bug."

**Answer:**
> **Situation:** "A developer told me that the trading platform correctly rejected a $500 withdrawal when the account balance was $495 after an open position used $400 as margin — meaning only $95 was available for withdrawal, not $500. He said it was 'working as designed.'"
>
> **Task:** "I believed the user-facing error message was misleading — it said 'Insufficient balance' when the real issue was that margin was being double-counted. I had to escalate this diplomatically."
>
> **Action:** "I first reproduced the issue with exact steps and showed him the balance shown to the user ($495) versus what the system was actually calculating ($95 available after margin). I explained that 'Insufficient balance' implied the user had fewer funds than they actually did — this would erode trust and prompt users to deposit more money unnecessarily. I suggested the message should read 'Insufficient available balance — $400 held in margin for open positions.' He acknowledged the UX issue and we escalated to the product manager, who agreed the message needed improvement."
>
> **Result:** "Error message was updated to be precise. The PM also added a requirement that margin-held amounts always be explicitly displayed before a withdrawal attempt. The fix shipped in 2 days and we saw a measurable drop in support tickets about withdrawal confusion."

---

## Q4: "Tell me about a time you improved a test process."

**Answer:**
> **Situation:** "At my previous role, our regression suite took 6 hours to run because we were manually re-testing 300 test cases after every build. This meant releases were only happening twice a week."
>
> **Task:** "I was asked to look at ways to speed up our QA cycle without reducing coverage."
>
> **Action:** "I audited our test suite and found: (1) 40% of test cases were redundant — testing the same flow with different data, (2) 30% were manual when they could be automated, (3) 20% were testing low-risk UI elements that didn't need to be in the critical path. I proposed and led a 3-week effort to: deduplicate the test cases, automate the 90 highest-priority ones using Playwright, and categorize the remaining tests into smoke, regression, and exploratory tiers. We also introduced a risk-based classification — features touching money flows always ran full regression; UI-only changes ran smoke only."
>
> **Result:** "Regression time dropped from 6 hours to 45 minutes. We went from 2 releases per week to 4. We caught 3 critical bugs in the first month that the old manual process had been missing because testers were fatigued by hour 5 of regression."

---

## Q5: "How do you handle testing a feature with unclear requirements?"

**Answer:**
> **Situation:** "I was assigned to test a new 'trailing stop' feature for the mobile app, but the spec only described the happy path — price follows upward, stop trails, position closes at trigger."
>
> **Task:** "I needed to flesh out the spec by identifying edge cases before writing any test cases."
>
> **Action:** "I spent the first day in 'requirements clarification' mode — I wrote out 25 edge case questions and met with the product manager and a senior trader to answer them: What happens to the trailing stop when the app is closed? Does it execute server-side? What if the trailing distance is set smaller than the spread? What happens during a market gap overnight? For each unclear point, I got written confirmation and attached it to the ticket. Only then did I write the test cases — 47 in total, covering normal flow, all edge cases, and known trading platform gotchas like gap-down scenarios."
>
> **Result:** "The PM told me our pre-launch review meeting was the smoothest he'd ever run because there were no surprises from QA. The feature shipped with zero critical bugs in the first 2 weeks."

---

## Q6: "A trade failed for 1,000 customers simultaneously. How do you respond?" (Stress/Escalation)

**Answer:**
> **Situation:** "At 10:47 AM during peak trading hours, our monitoring dashboard showed a spike — 1,000 market orders failed within 2 minutes with error code 503."
>
> **Task:** "My role as QA was to: (1) help identify the scope, (2) verify the fix once deployed, and (3) ensure no customer data was compromised and every affected customer was made whole."
>
> **Action:** "First, I immediately escalated to the tech lead with my monitoring data showing the exact timestamp range and affected order types. I helped the on-call engineer narrow down the root cause — a downstream liquidity provider's API was returning 503s, which our circuit breaker wasn't catching fast enough. While developers fixed the circuit breaker, I: (1) identified all 1,000 affected customers and their order details, (2) verified our audit logs captured every failed attempt so customers could be compensated, (3) wrote a regression test for the circuit breaker behavior so this couldn't recur, (4) confirmed no partial executions occurred — every failed order was either fully executed or fully rejected, no in-between states."
>
> **Result:** "System restored in 23 minutes. All 1,000 customers received credit for the slippage they'd experienced. We filed the incident report for FSA within the required 24-hour window. The regression test I wrote has since caught 2 similar circuit breaker misconfigurations before they reached production."

---

## Q7: "What questions should I ask the interviewer?" (Always have 3–5 ready)

**DO ASK (impresses them):**
1. "What's the biggest challenge your QA team has faced in the last 6 months — and what did you do to solve it?"
2. "How does the team balance the pressure of fast releases with the need for thorough testing?"
3. "What's the testing-to-development ratio, and how do you decide what gets automated vs manual?"
4. "How does the team handle bugs found in production vs bugs found in testing — is there a blameless post-mortem culture?"
5. "What tools and frameworks does the team use for automated testing, and what's the plan for expanding coverage?"
6. "Can you describe a recent regulatory audit or compliance exercise the team supported?"

**NEVER ASK (shows lack of preparation):**
- "What does your company do?" (should already know)
- "How many vacation days do I get?" (save for HR)
- "Is remote work allowed?" (wait for offer stage)

---

# ═══════════════════════════════════
# SECTION 7 — Interview Day Prep (30 min)
# ═══════════════════════════════════

## Night Before
- [ ] Review cheat sheet (Top 20 terms, 5 opening lines)
- [ ] Review your 3 strongest STAR stories (practice saying them out loud)
- [ ] Prepare 5 questions to ask the interviewer
- [ ] Check interview time, location, format (video/in-person)
- [ ] If video: test your camera, mic, internet; use a clean background
- [ ] If in-person: plan route, leave 15 min early; bring ID
- [ ] Set out professional clothes (even for video — you feel more confident)
- [ ] NO cramming past 10 PM — sleep matters more than one more review

## Morning Of
- [ ] Shower, dress professionally
- [ ] Light breakfast (no coffee if you're nervous — water only)
- [ ] Review cheat sheet one more time (15 min max)
- [ ] 5 deep breaths before the call/in-person meeting
- [ ] Have a pen and notepad ready (for whiteboarding or taking notes)

## During the Interview

### First 2 Minutes (Set the Tone)
```
1. Smile and make eye contact (or at camera if video)
2. Thank them for their time
3. Say ONE of the "5 opening lines that impress" early — shows research
4. If virtual: "Is my audio/video clear?" — shows professionalism
```

### Answering Technical Questions
```
DO:
- Think out loud — show your reasoning process, not just the answer
- Ask clarifying questions before answering ("Can I assume it's a REST API?")
- Admit when you don't know something — then show how you'd figure it out
- Give structured answers (bullets, numbered steps, "First/Then/Finally")
- Relate to Equiti specifically when possible ("For a trading platform, this matters because...")

DON'T:
- Rush to answer — 3-5 seconds of thinking is fine and shows care
- Use buzzwords without substance
- Say "I don't know" and stop — follow with "but I'd start by..."
- Get defensive if they push back — they're testing how you handle pressure
```

### If You Don't Know the Answer
```
The right response:
"I haven't worked directly with [X], but here's how I'd approach it:
1. I'd start by [first step]
2. I'd look at [resource or person]
3. I'd validate my approach by [what you'd measure]
This is similar to [something you DO know] which I'd approach like..."
```

---

# ═══════════════════════════════════
# QUICK REFERENCE — Security Checklist
# ═══════════════════════════════════

## Every API Endpoint Test (Security Minimum)
```
□ 401 returned when no auth token
□ 403 returned when auth token valid but insufficient permissions
□ 400 returned when request body invalid
□ 404 returned when resource not found (not 500)
□ SQL injection sanitized in all string params
□ XSS sanitized in all string params  
□ Rate limit headers present (X-RateLimit-*)
□ No sensitive data in error messages
□ No sensitive data in response headers
□ HTTPS only — no HTTP endpoints
□ No version info in headers (Server: nginx, X-Powered-By removed)
```

## Every Financial Transaction Test (Compliance Minimum)
```
□ Audit log written: user_id, action, amount, timestamp, IP, result
□ Idempotency key prevents duplicate transactions
□ Balance updated atomically (no partial states)
□ User notified of success/failure immediately
□ Pending state shown during async processing
□ All states transition correctly (pending → success/failed)
□ Rollback occurs if any step in transaction fails
□ No sensitive data (card numbers, CVV) stored anywhere
```

---

# ═══════════════════════════════════
# QUICK REFERENCE — API Test Checklist
# ═══════════════════════════════════

## Every API Endpoint Test (Functional Minimum)
```
□ Valid request → 200 with correct data shape
□ Missing required param → 400 with specific error message
□ Invalid param type → 400 with validation error
□ Unknown endpoint → 404 (not 500)
□ Valid auth + valid request → 200
□ Valid auth + wrong permissions → 403
□ Invalid/expired auth → 401
□ Valid request + server error → 500 (should not happen, flag it)
□ Empty result → 200 with empty array (not error)
□ Large page size request → capped at max, not crashing
□ Concurrent requests → correct behavior, no race conditions
□ Same request sent twice → idempotent (same response, no side effects)
```

---

# ═══════════════════════════════════
# FINALE — 5 Things to Say Before You Leave
# ═══════════════════════════════════

1. **"I want to highlight that I understand the gravity of testing financial systems — a bug here isn't a UX problem, it's a financial and regulatory problem. That's the mindset I bring."** — Shows maturity.

2. **"I'm particularly excited about Equiti's integration with MT4/MT5 — those bridge architectures are notoriously tricky to test, and I'd love to learn more about how your team approaches that."** — Shows technical curiosity.

3. **"What I heard you describe about [something they mentioned] — it sounds like the team deals with real challenges around [latency/compliance/scale]. I'd thrive in that environment."** — Shows active listening.

4. **"I'm committed to continuous learning in security testing — I know FinTech QA requires staying current with OWASP, PCI-DSS, and FSA regulations. That's not a one-time effort, it's a practice."** — Shows growth mindset.

5. **"Thank you for your time — I learned something valuable about [specific thing mentioned] today."** — Always end graciously, even if you think it went poorly.

---

*Good luck. You know more than you think. Be yourself, think out loud, and show them you care about getting it right — not just getting it done.*
