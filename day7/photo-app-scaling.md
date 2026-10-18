# SnapShare Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos
and view photos from people they follow.

The following assumptions are provided:

- Registered users: 10,000,000.
- Daily active users: 10% of registered users.
- Photos uploaded per active user per day: 1.
- Feed pages viewed per active user per day: 50.
- Average original photo size: 2 MB.
- Average thumbnail size: 50 KB.
- Seconds per day for rough estimates: approximately 100,000.
- Peak traffic: 5 times the average traffic.
- Days per year: 365.
- Storage calculations use decimal units: 1,000 MB = 1 GB and
  1,000 GB = 1 TB.

### Daily Active Users

Daily active users = 10,000,000 × 10%

Daily active users = 1,000,000 users.

## 2. Traffic and Storage Estimates

### Photo Uploads

Daily uploads = 1,000,000 users × 1 photo

Daily uploads = 1,000,000 photos.

Average uploads per second = 1,000,000 ÷ 100,000

Average uploads per second ≈ 10.

Peak uploads per second = 10 × 5

Peak uploads per second ≈ 50.

### Feed Views

Daily feed views = 1,000,000 users × 50 views

Daily feed views = 50,000,000.

Average feed views per second = 50,000,000 ÷ 100,000

Average feed views per second ≈ 500.

Peak feed views per second = 500 × 5

Peak feed views per second ≈ 2,500.

### Yearly Storage

Original photos per day:

1,000,000 × 2 MB = 2,000,000 MB = 2 TB.

Original photo storage per year:

2 TB × 365 = 730 TB.

Thumbnails per day:

1,000,000 × 50 KB = 50 GB.

Thumbnail storage per year:

50 GB × 365 = 18.25 TB.

Total estimated storage per year:

730 TB + 18.25 TB = 748.25 TB.

These estimates exclude backups, replicated copies, and other overhead.

## 3. Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system because users view feed pages
much more frequently than they upload photos.

Each active user views 50 feed pages but uploads only one photo
per day. This is a ratio of 50 feed views to every photo upload.

The design should therefore prioritise fast feed delivery.
A cache, CDN, and database read replica can reduce response times
and reduce the workload on the primary database.
## 4. System Architecture

The following architecture distributes requests across multiple application servers, caches frequently requested data, stores photos in object storage, and processes thumbnail creation in the background.

```text
                    +------------------+
                    |       Users      |
                    | Browser / Mobile |
                    +--------+---------+
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
          +-------------+         +----------------+
          |     DNS     |         | CDN            |
          | Find address|         | Static files   |
          +-------------+         | Photos/thumbs  |
                                  +--------+-------+
                                           |
                                   Object storage
                                           ^
                                           |
+-------------+    API requests    +-------+--------+
|             | -----------------> | Load Balancer  |
|    Users    |                    +-------+--------+
|             |                            |
+-------------+                  +---------+---------+
                                 |                   |
                                 v                   v
                          +-------------+     +-------------+
                          | App Server 1|     | App Server 2|
                          +------+------+     +------+------+
                                 |                   |
                                 +---------+---------+
                                           |
                         +-----------------+----------------+
                         |                                  |
                         v                                  v
                  +-------------+                    +-------------+
                  | Cache       |                    | Message     |
                  | Feed data   |                    | Queue       |
                  +------+------+                    +------+------+
                         |                                  |
                   Cache miss                               v
                         |                           +-------------+
                         v                           | Thumbnail   |
                  +-------------+                    | Worker      |
                  | Read Replica|                    +------+------+
                  +-------------+                           |
                         ^                                  |
                         |                                  v
                  +------+------+                    +-------------+
                  | Primary     | <--- metadata ----- | Object      |
                  | Database    |                    | Storage     |
                  +-------------+                    | Original &  |
                                                     | thumbnails  |
                                                     +-------------+
```

### Component Responsibilities

* **DNS:** Resolves SnapShare's domain name so users can reach the application.
* **CDN:** Delivers static files and cached photo images from locations closer to users.
* **Load balancer:** Distributes incoming API requests across healthy application servers.
* **Application servers:** Validate requests, enforce permissions, coordinate uploads, and retrieve feed data.
* **Cache:** Stores frequently requested feed data to reduce latency and database workload.
* **Primary database:** Stores authoritative records such as users, photo metadata, and follow relationships.
* **Read replica:** Handles suitable read queries using a copy of the primary database's data.
* **Object storage:** Holds original photos and generated thumbnails without placing large image files inside the main database.
* **Message queue:** Holds thumbnail-generation jobs until a worker can process them.
* **Thumbnail worker:** Reads original photos from object storage, creates smaller thumbnail images, and stores the resulting files in object storage.

The application servers are designed to be stateless: important persistent data lives in the database or object storage rather than only in an individual server's memory. This allows requests to be handled by different application servers.

## 5. Photo Upload Flow

When a user uploads a photo, the following steps occur:

1. The user selects a photo in the SnapShare application and starts the upload.
2. The request reaches the load balancer, which forwards it to a healthy application server.
3. The application server verifies the user's identity and checks that the upload is permitted.
4. The original photo is stored in object storage. The application can use a controlled upload endpoint or a short-lived, authorised upload URL.
5. The application server saves the photo's metadata, including its owner and storage location, in the primary database.
6. The application server places a thumbnail-generation job on the message queue and responds to the user without waiting for thumbnail creation to finish.
7. A background worker retrieves the job and reads the original photo from object storage.
8. The worker generates a smaller thumbnail and saves it in object storage.
9. The thumbnail's storage location or processing status is recorded in the database if required.
10. The CDN can then deliver the original photo or thumbnail to users, using its cache and retrieving files from object storage when necessary.

If thumbnail processing is temporarily delayed, the photo upload can still finish successfully. The application can display the original photo or a placeholder until the thumbnail is ready.

## 6. Design Trade-offs

### Trade-off 1: Cache speed versus data freshness

Caching makes popular feeds faster and reduces the load on the database. However, a cached feed may not immediately reflect a new photo or a changed follow relationship. SnapShare should expire or invalidate affected cache entries when relevant data changes.

### Trade-off 2: Database read performance versus consistency

A read replica allows feed queries to be handled without sending every read to the primary database. However, changes may take a short time to appear on the replica. SnapShare can use replicas for ordinary feed reads and the primary database when a user needs to see a newly saved change immediately.

### Trade-off 3: Fast uploads versus immediate thumbnail availability

Processing thumbnails in the background allows the application to acknowledge uploads quickly. The trade-off is that a thumbnail may not be available immediately, so the interface should show a placeholder or the original image while processing continues.

### Trade-off 4: Reliability versus infrastructure cost

Multiple application servers, a read replica, object storage, and background workers reduce the impact of individual failures and improve capacity. However, these components increase infrastructure costs and operational complexity. SnapShare should introduce capacity and redundancy according to measured traffic and reliability requirements.
