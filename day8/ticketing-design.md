# TicketHub Event Ticketing System Design

## 1. Context, Goals and Requirements

### Context

TicketHub is an online ticketing platform where users browse events, select seats, purchase tickets, and view their bookings. The system must handle normal traffic as well as sudden demand when tickets for a popular concert go on sale.

The most important design challenge is preventing double-booking while keeping the platform responsive and fair to users.

### Goals

* Allow users to browse events and view available seats.
* Allow authenticated users to hold available seats temporarily and purchase tickets.
* Prevent two customers from purchasing the same seat.
* Process payments securely and maintain accurate order records.
* Handle traffic spikes without overwhelming the application or database.
* Provide a clear confirmation of successful purchases.

### Non-Goals

The initial design does not include a complete payment-provider implementation, international tax calculations, event recommendations, or a resale marketplace. These features could be added later.

### Functional Requirements

1. Users can register, log in, and browse events.
2. Users can view event details, prices, and available seats.
3. Users can temporarily hold available seats while completing checkout.
4. Users can pay for held seats and receive confirmed tickets.
5. Users can view their purchased tickets and order history.
6. Users can cancel eligible orders according to the event's cancellation policy.
7. Organisers can create events and configure seating arrangements.
8. The system releases expired seat holds so other customers can purchase those seats.
9. The system sends ticket confirmations after successful payment.
10. The system prevents duplicate payments and double-booking.

### Non-Functional Requirements

**Performance:** Event pages and seat availability should respond quickly under normal conditions. The design target is a p95 response time below 200 ms for ordinary browsing requests, excluding external payment processing.

**Availability:** The browsing and event-information services should remain available during high-demand periods. Multiple application servers and redundant infrastructure reduce interruptions.

**Correctness:** A seat can have at most one active reservation or confirmed sale. The database must enforce the necessary constraints, and seat acquisition must use an atomic transaction.

**Fairness:** Customers should receive access according to a consistent admission and queuing policy during major sales. Automated clients must be rate-limited so a small number of users cannot monopolise the service.

**Security:** Authentication, authorisation, HTTPS, input validation, and secure payment-provider integration are required.

**Reliability:** Failed or interrupted payment requests must not create duplicate orders or charge customers twice. Payment processing and order confirmation should be idempotent.

**Scalability:** The application should support additional servers and controlled traffic admission when a popular concert attracts sudden demand.

---

## 2. Traffic and Capacity Estimates

### Assumptions

The following facts are supplied in the assignment:

* Registered users: 2,000,000.
* Normal daily visitors: 50,000.
* Pages viewed per normal-day visitor: 10.
* Tickets sold on a normal day: 5,000.
* During a popular concert sale, 200,000 people try to buy 20,000 seats within 10 minutes.
* A normal day contains 86,400 seconds.
* The peak-sales window contains 600 seconds.

For rough planning, calculations use the number of visitors and page views given in the assignment. Each visitor is assumed to view ten pages, and each person attempting to buy during the major sale is counted as one buying attempt. Actual request volume may be higher if users refresh pages or retry requests.

### Normal Traffic

**Daily page views**

50,000 visitors × 10 pages = 500,000 page views per day.

**Average page views per second**

500,000 ÷ 86,400 ≈ 5.79 page views per second.

Assuming a five-times peak during an ordinary busy period:

5.79 × 5 ≈ 29 page views per second.

**Normal ticket sales**

5,000 tickets are sold per day.

5,000 ÷ 86,400 ≈ 0.058 ticket sales per second.

This is an average over the full day; actual purchases will occur in bursts.

### Popular Concert Sale

200,000 people try to buy tickets within 10 minutes.

10 minutes × 60 seconds = 600 seconds.

**Average buying attempts per second**

200,000 ÷ 600 ≈ 333 attempts per second.

The concert has only 20,000 seats.

**Demand-to-seat ratio**

200,000 potential buyers ÷ 20,000 seats = 10.

There are approximately ten potential buyers for every available seat. If all 200,000 people seek a seat, at least 180,000 cannot obtain one from this sale.

The platform must therefore manage contention for a limited inventory rather than simply accept every purchase request.

### Estimate Summary

| Measurement                                     |      Normal operation |                         Popular concert sale |
| ----------------------------------------------- | --------------------: | -------------------------------------------: |
| People involved                                 | 50,000 daily visitors |                     200,000 potential buyers |
| Page views                                      |       500,000 per day |      Depends on browsing and retry behaviour |
| Average page views per second                   |    Approximately 5.79 |              Not specified by the assignment |
| Approximate ordinary peak page views per second |      Approximately 29 |        Actual browsing rate must be measured |
| Ticket sales or attempts                        | 5,000 tickets per day | Approximately 333 buying attempts per second |
| Available seats for the sale                    |  Depends on the event |                                       20,000 |
| Demand relative to available seats              |         Not specified |                 10 potential buyers per seat |

The 333-per-second estimate measures buying attempts during the ten-minute sale window. It is not a complete estimate of all API requests. Viewing events, refreshing seat maps, checking out, and payment callbacks create additional traffic.

For capacity planning, TicketHub should also conduct load tests at higher rates than the estimated average to allow for short bursts and repeated requests.

### What the Estimates Tell Us

Normal traffic is relatively modest, but the popular concert creates intense, concentrated demand for a limited number of seats.

The architecture should prioritise:

* Controlled admission during high-demand sales.
* Fast event and seat-map reads.
* Atomic database operations for seat allocation.
* Protection against repeated requests and duplicate payments.
* Reliable payment and order processing.

---

## 3. API Design

TicketHub uses a REST API that communicates through HTTPS and JSON. Authenticated operations require an access token.

The following endpoints illustrate the main operations.

| Method | Endpoint                    | Description                                                            | Success status         |
| ------ | --------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| GET    | `/events`                   | Lists upcoming events, with optional search and pagination.            | 200 OK                 |
| GET    | `/events/{eventId}`         | Returns the details of one event.                                      | 200 OK                 |
| GET    | `/events/{eventId}/seats`   | Returns seat information and current availability.                     | 200 OK                 |
| POST   | `/events/{eventId}/holds`   | Attempts to hold selected seats temporarily.                           | 201 Created            |
| POST   | `/orders`                   | Creates an order for seats held by the authenticated user.             | 201 Created            |
| POST   | `/orders/{orderId}/payment` | Starts or confirms payment through a payment provider.                 | 200 OK or 202 Accepted |
| GET    | `/users/me/tickets`         | Lists tickets belonging to the authenticated user.                     | 200 OK                 |
| GET    | `/orders/{orderId}`         | Returns the status and details of one order belonging to the user.     | 200 OK                 |
| DELETE | `/holds/{holdId}`           | Releases a hold that has not been converted into a completed purchase. | 204 No Content         |

### Example: Hold seats

Request:

`POST /events/501/holds`

```json
{
  "seatIds": [1201, 1202]
}
```

The server authenticates the user and tries to hold both seats atomically.

A successful response might be:

```json
{
  "holdId": "hold_789",
  "eventId": 501,
  "seatIds": [1201, 1202],
  "status": "held",
  "expiresAt": "2026-10-19T11:15:00Z"
}
```

If one seat has already been taken, the system should not create a successful hold for the entire requested group. It returns an appropriate conflict response, such as `409 Conflict`, and explains that the selected seats are no longer available.

### Example: Create an order

Request:

`POST /orders`

```json
{
  "holdId": "hold_789",
  "idempotencyKey": "checkout-unique-789"
}
```

The server checks that the hold belongs to the authenticated user and has not expired.

A successful response might be:

```json
{
  "orderId": 9001,
  "status": "pending_payment",
  "currency": "USD",
  "totalAmount": 200.00
}
```

The example uses USD for illustration; a real implementation would use the event's configured currency.

### API Error Responses

* **400 Bad Request:** Invalid input, such as an empty seat list.
* **401 Unauthorized:** The request has no valid access token.
* **403 Forbidden:** The user is not allowed to access the requested order.
* **404 Not Found:** The event, seat, hold, or order cannot be found.
* **409 Conflict:** A seat has already been held or sold, or the hold has expired.
* **429 Too Many Requests:** The user has exceeded a rate limit.
* **500 Internal Server Error:** An unexpected server failure occurred.
* **503 Service Unavailable:** A required service is temporarily unavailable or the system is overloaded.

Example error body:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "One or more selected seats are no longer available."
  }
}
```

---

## 4. Data Model

TicketHub uses a relational database such as PostgreSQL because ticket sales require reliable transactions, uniqueness constraints, and relationships between users, events, seats, and orders.

The principal entities are `users`, `events`, `seats`, and `orders`. An additional `order_seats` table records which seats belong to each order.

### Table 1: users

Stores customer accounts.

| Column     | Type         | Constraints      |
| ---------- | ------------ | ---------------- |
| id         | BIGINT       | Primary key      |
| name       | VARCHAR(150) | NOT NULL         |
| email      | VARCHAR(255) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP    | NOT NULL         |

### Table 2: events

Stores concerts and other events.

| Column    | Type         | Constraints |
| --------- | ------------ | ----------- |
| id        | BIGINT       | Primary key |
| title     | VARCHAR(200) | NOT NULL    |
| venue     | VARCHAR(200) | NOT NULL    |
| starts_at | TIMESTAMP    | NOT NULL    |
| status    | VARCHAR(20)  | NOT NULL    |

### Table 3: orders

Stores purchase attempts and completed orders.

| Column          | Type          | Constraints              |
| --------------- | ------------- | ------------------------ |
| id              | BIGINT        | Primary key              |
| user_id         | BIGINT        | Foreign key to users.id  |
| event_id        | BIGINT        | Foreign key to events.id |
| status          | VARCHAR(30)   | NOT NULL                 |
| total_amount    | DECIMAL(12,2) | NOT NULL                 |
| currency        | CHAR(3)       | NOT NULL                 |
| idempotency_key | VARCHAR(100)  | NOT NULL, UNIQUE         |
| created_at      | TIMESTAMP     | NOT NULL                 |

The idempotency key allows repeated requests representing the same checkout attempt to be recognised, helping prevent duplicate orders or payment operations.

### Table 4: seats

Stores the seats available for each event.

| Column           | Type          | Constraints                       |
| ---------------- | ------------- | --------------------------------- |
| id               | BIGINT        | Primary key                       |
| event_id         | BIGINT        | Foreign key to events.id          |
| section          | VARCHAR(50)   | NOT NULL                          |
| row_label        | VARCHAR(20)   | NOT NULL                          |
| seat_number      | VARCHAR(20)   | NOT NULL                          |
| price            | DECIMAL(12,2) | NOT NULL                          |
| status           | VARCHAR(20)   | NOT NULL                          |
| current_order_id | BIGINT        | Nullable foreign key to orders.id |
| hold_expires_at  | TIMESTAMP     | Nullable                          |

A unique constraint on `(event_id, section, row_label, seat_number)` ensures that a seat position is not accidentally registered twice for the same event.

The seat status is one of `available`, `held`, or `sold`.

### Table 5: order_seats

Links seats to orders and records the price associated with each seat in an order.

| Column            | Type          | Constraints                                             |
| ----------------- | ------------- | ------------------------------------------------------- |
| order_id          | BIGINT        | Part of composite primary key; foreign key to orders.id |
| seat_id           | BIGINT        | Part of composite primary key; foreign key to seats.id  |
| price_at_purchase | DECIMAL(12,2) | NOT NULL                                                |

The composite primary key `(order_id, seat_id)` prevents the same seat from being listed twice in a single order. The seat's current status and ownership are controlled transactionally using the `seats` table.

### Relationships

**One-to-many: Users and Orders**

One user can make many orders, but each order belongs to one user.

**One-to-many: Events and Seats**

One event can have many seats, but each seat belongs to one event.

**One-to-many: Events and Orders**

An event can have many orders, but each order is associated with one event.

**Many-to-many: Orders and Seats**

An order may contain multiple seats, and a seat may appear in different historical order records over time if an earlier order is cancelled. The `order_seats` table models this relationship.

Only one active hold or confirmed sale can own a seat at a time. The current status and owner fields in `seats`, together with transactional updates, enforce this rule.

### Example SQL Schema

The following PostgreSQL-style statements illustrate the principal tables and constraints.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('draft', 'on_sale', 'sold_out', 'cancelled'))
);

CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    event_id BIGINT NOT NULL REFERENCES events(id),
    status VARCHAR(30) NOT NULL
        CHECK (status IN ('pending_payment', 'confirmed', 'cancelled', 'expired')),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    currency CHAR(3) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    section VARCHAR(50) NOT NULL,
    row_label VARCHAR(20) NOT NULL,
    seat_number VARCHAR(20) NOT NULL,
    price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'held', 'sold')),
    current_order_id BIGINT REFERENCES orders(id),
    hold_expires_at TIMESTAMP,
    UNIQUE (event_id, section, row_label, seat_number)
);

CREATE TABLE order_seats (
    order_id BIGINT NOT NULL REFERENCES orders(id),
    seat_id BIGINT NOT NULL REFERENCES seats(id),
    price_at_purchase DECIMAL(12,2) NOT NULL CHECK (price_at_purchase >= 0),
    PRIMARY KEY (order_id, seat_id)
);

CREATE INDEX idx_events_starts_at
    ON events(starts_at);

CREATE INDEX idx_seats_event_status
    ON seats(event_id, status);

CREATE INDEX idx_orders_user_created
    ON orders(user_id, created_at DESC);
```

The schema illustrates the main tables and relationships. In production, the application must enforce valid order/seat combinations and seat-state transitions within transactions. PostgreSQL row locking or conditional updates must be used to safely acquire seats under concurrent requests.

### Example SQL Queries

**Query 1: Find upcoming events**

```sql
SELECT id, title, venue, starts_at
FROM events
WHERE status = 'on_sale'
  AND starts_at > CURRENT_TIMESTAMP
ORDER BY starts_at;
```

**Query 2: Display available seats for an event**

```sql
SELECT id, section, row_label, seat_number, price
FROM seats
WHERE event_id = 501
  AND status = 'available'
ORDER BY section, row_label, seat_number;
```

**Query 3: Find a user's confirmed orders**

```sql
SELECT orders.id, events.title, orders.total_amount, orders.currency
FROM orders
JOIN events ON events.id = orders.event_id
WHERE orders.user_id = 7
  AND orders.status = 'confirmed'
ORDER BY orders.created_at DESC;
```

### Indexing

The `idx_seats_event_status` index supports queries that retrieve available seats for a particular event. It helps the database find matching seat records without scanning the whole table in every query.

The `idx_events_starts_at` index helps retrieve and sort upcoming events, while `idx_orders_user_created` supports a user's order history.

Indexes consume storage and require maintenance during writes, so they should target important query patterns rather than every column.

### Preventing Two People from Buying the Same Seat

This is the most important correctness requirement.

TicketHub prevents double-booking using atomic transactions and conditional updates:

1. The server starts a database transaction and creates a pending order.
2. For each requested seat, it executes a conditional update similar to:

```sql
UPDATE seats
SET status = 'held',
    current_order_id = :order_id,
    hold_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes'
WHERE id = :seat_id
  AND status = 'available';
```

3. The server checks how many rows were updated. Exactly one row means the seat was acquired. Zero rows means another request already changed the seat's status, so the seat is unavailable.
4. The transaction must successfully acquire every seat requested by the customer. If any seat cannot be acquired, the transaction rolls back all seat changes and the pending order.
5. If every seat is acquired, the application records the corresponding `order_seats` rows and commits the transaction.
6. The customer completes payment while the hold remains valid.
7. After payment confirmation, another transaction verifies that the order still owns the seats and that their holds have not expired. It changes their status to `sold` and the order to `confirmed` atomically.

Because competing requests cannot both successfully change the same seat from `available` to `held`, the database allows only one successful hold for that seat at a time.

Expired holds must be released using a safe conditional update. A delayed payment callback must not be allowed to sell a seat that has already been released to another customer.

Payment requests use idempotency keys so retrying the same request does not accidentally charge the customer twice. If payment succeeds but confirmation processing fails temporarily, the system reconciles the provider's payment status before retrying or releasing the seat.

**The cache is never the source of truth for seat availability.** The database transaction decides which customer owns a seat.

---

## 5. Architecture Diagram

The architecture separates event browsing from critical ticket purchases while keeping seat allocation authoritative in the database.

```text
                    +----------------------+
                    |      CUSTOMERS       |
                    | Browser / Mobile App|
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |         DNS          |
                    +----------------------+
                               |
                    +----------+-----------+
                    |                      |
                    v                      v
             +-------------+        +------------------+
             | CDN         |        | Waiting Room     |
             | Static files|        | Rate limiting    |
             | Event images|        | Sale admission   |
             +-------------+        +--------+---------+
                                              |
                                              v
                                     +------------------+
                                     | Load Balancer    |
                                     +--------+---------+
                                              |
                                   +----------+----------+
                                   |                     |
                                   v                     v
                            +--------------+      +--------------+
                            | App Server 1 |      | App Server 2 |
                            | Stateless API|      | Stateless API|
                            +------+-------+      +------+-------+
                                   |                     |
                                   +----------+----------+
                                              |
                         +--------------------+------------------+
                         |                    |                  |
                         v                    v                  v
                  +-------------+     +---------------+  +----------------+
                  | Cache       |     | Primary DB    |  | Message Queue  |
                  | Event data  |     | Orders / Seats|  | Payment, email |
                  | Seat display|     | Transactions  |  | confirmation   |
                  +-------------+     +-------+-------+  +-------+--------+
                                              |                  |
                                              v                  v
                                      +---------------+  +----------------+
                                      | Read Replica  |  | Worker          |
                                      | Event browsing|  | Notifications   |
                                      | Read queries  |  | Reconciliation  |
                                      +---------------+  +----------------+
```

### Component Responsibilities

* **Client:** Lets customers browse events, select seats, check out, and view their tickets.
* **DNS:** Resolves the TicketHub domain so customers can reach the service.
* **CDN:** Delivers static assets and event images from locations near customers, reducing load on the origin.
* **Waiting room:** Controls admission during a major sale so a sudden surge does not overwhelm the application.
* **Rate limiter:** Restricts excessive requests from a user or client, helping limit abuse and accidental overload.
* **Load balancer:** Distributes API requests across healthy application servers and routes traffic away from unhealthy instances.
* **Application servers:** Implement event browsing, seat holds, order creation, authentication, payment coordination, and business rules.
* **Cache:** Speeds up event details and seat-map display while reducing repeated database reads; it never decides who owns a seat.
* **Primary database:** Stores authoritative seat states, orders, and user records and enforces correct seat allocation through transactions.
* **Read replica:** Handles suitable read queries for event information, order history, and other read-heavy operations when replica lag is acceptable.
* **Message queue:** Buffers asynchronous jobs such as sending ticket emails, processing notifications, and retrying reconciliation tasks.
* **Worker:** Processes queued background jobs without delaying the user's checkout response.

### How the Architecture Survives a Big Sale

The waiting room controls the number of users admitted into the checkout flow. This helps protect the application servers and database from the initial surge of 200,000 people.

The CDN and cache serve frequently requested static assets and event information, reducing repeated work.

Multiple stateless application servers behind the load balancer can handle requests in parallel. Failed instances can be removed from traffic.

The primary database remains the source of truth for seat availability and orders. Transactions protect seat ownership even when many customers attempt to acquire the same seat simultaneously.

The message queue moves slower tasks, such as sending confirmation emails, out of the critical checkout path.

Monitoring, health checks, backups, and a tested database failover procedure help operators detect faults and recover from failures.

---

## 6. Trade-Offs and Risks

### Trade-Off 1: Fair Admission Versus Immediate Access

A waiting room protects TicketHub during a major sale, but customers may have to wait even when the website is technically available.

TicketHub should use a clearly communicated and consistently applied queue policy. Admission rates can be adjusted according to available capacity, while rate limits help prevent a small number of automated clients from consuming an unfair share of resources.

### Trade-Off 2: Longer Seat Holds Versus Ticket Availability

Longer holds give customers more time to complete checkout, but held seats remain unavailable to other customers even when the original customer abandons the purchase.

Short, clearly communicated holds reduce wasted inventory. The application must release expired holds safely and prevent late payment callbacks from confirming a seat that has already been reassigned.

### Trade-Off 3: Fast Cached Views Versus Accurate Availability

Caching makes event pages and seat maps faster, but the displayed availability can become outdated as other customers make purchases.

TicketHub can cache event information and approximate seat availability for display purposes. The database must always recheck and atomically acquire seats during the actual hold operation. A customer should never be promised a seat solely because it appeared available in a cache.

### Trade-Off 4: Strong Consistency Versus Maximum Throughput

Serialising changes to an individual seat ensures that only one request can acquire it, but heavy contention for popular seats can increase database waiting time.

TicketHub should keep transactions short, lock only the required seat records, and use controlled admission rather than permitting unlimited simultaneous checkout requests. It can distribute read traffic to replicas, but seat allocation decisions must still use the authoritative primary database.

### Trade-Off 5: Reliability Versus Infrastructure Cost

Multiple application servers, database replication, queues, monitoring, and recovery infrastructure reduce the impact of failures but increase cost and operational complexity.

TicketHub should prioritise redundancy for critical components and validate the architecture with load tests before committing to more complex infrastructure.

### Risks and Open Questions

* Payment-provider timeouts may leave the application uncertain whether a payment succeeded. Idempotency and payment reconciliation are required.
* Database failover can interrupt purchases unless connection handling and recovery are tested.
* The queue policy must be transparent enough that customers understand their position and admission process.
* Load tests are needed to determine actual capacity, transaction latency, and the number of simultaneous checkouts the database can sustain.
* The design must confirm applicable payment-security, privacy, refund, and ticketing requirements before production deployment.

## 7. Conclusion

TicketHub must support ordinary event browsing while protecting the correctness of ticket inventory during intense sales.

The key design decision is to separate fast browsing from transactional seat allocation. A CDN, cache, read replicas, waiting room, and multiple application servers help manage traffic, while the primary database uses atomic transactions and conditional seat-state changes to prevent double-booking.

No architectural diagram alone guarantees a reliable service. Load testing, careful payment handling, monitoring, and tested recovery procedures are necessary to make the design work in practice.