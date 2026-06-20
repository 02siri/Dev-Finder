# Dev-Finder

This is the backend server for DevFinder, the developer matchmaking social platform. It is built as a robust Express.js API that connects to MongoDB, handles secure token authentication, processes webhooks, operates cron schedules, and coordinates WebSocket connections for real-time chat.

## Technologies
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose
- **Real-Time**: Socket.io (WebSocket)
- **Payments**: Stripe Node SDK
- **Mailing**: AWS SDK v3 (Amazon SES)
- **Scheduling**: Node-Cron + Date-fns
- **Authentication**: JWT (JSON Web Tokens) & Cookie-Parser

---

## Architecture & Core Features

### 1. Database Schema & Indexing
- **User Schema**: Saves profiles containing `firstName`, `lastName`, `emailId`, `password`, `photoURL`, `age`, `gender`, `about`, `skills`, and subscription keys (`isPremium`, `membershipType`). Includes instance methods for JWT token signing (`getJWT`) and password verification (`validatePswd`).
- **ConnectionRequest Schema**: Contains fields for `fromUserId` and `toUserId` along with the status (`ignored`, `interested`, `accepted`, `rejected`).
- **Compound Index**: A compound index is defined on `fromUserId` and `toUserId` to ensure that query lookups checking for existing connection requests on either side run in \(O(1)\) index scans.
- **Payment Schema**: Stores details of transactions with payment status (`pending`, `completed`), session IDs, product/price mappings, and metadata.
- **Chat Schema**: Stores direct messages arrays (`senderId`, `text`, `timestamp`) mapping to a unique participants list.

### 2. WebSocket Real-Time Chat with Authentication
- Socket server initializes alongside the HTTP listener.
- **WebSocket Auth**: Uses the `socketAuth` middleware to intercept connection attempts, extract the JWT token from the cookie, verify it, and inject the authenticated user into the socket instance before matching.
- **Room Derivation**: Generates a secure room ID using the sorted array of the two user IDs hashed with SHA-256 (`crypto.createHash("sha256")`).
- **Authorization**: Validates that the sender and target receiver have an active `accepted` status in `ConnectionRequest` before persisting or broadcasting messages.

### 3. Stripe Integration & Webhooks
- **Session Creation**: `/payment/createProduct` creates a Stripe Product and Price dynamically based on selected membership types, saves a `pending` payment record, and returns a checkout session URL.
- **Signature Verification**: Stripe webhook endpoint `/payment/webhook` receives webhook requests and verifies signatures using `stripeInstance.webhooks.constructEvent()` to protect against spoofing.
- **Event Handler**: On `checkout.session.completed`, the system updates the `Payment` document status to `completed` and flags the user account as `isPremium = true` with their chosen tier.

### 4. Amazon SES Daily Email Scheduler
- A node-cron job is scheduled daily (`0 8 * * *`) to scan for connection requests created within the last 24 hours.
- Uses `date-fns` (`subDays`, `startOfDay`, `endOfDay`) to locate target timestamps.
- Aggregates unique receivers, queries their emails, and fires personalized request notifications using the AWS SES client (`@aws-sdk/client-ses`).

---

## API Reference

### Auth Routes (`/auth/*`)
- `POST /signup`: Validates inputs, hashes password using bcrypt, stores user, cookies a JWT, and returns user details.
- `POST /login`: Validates credentials, verifies bcrypt hash, returns cookies containing JWT.
- `POST /logout`: Clears the JWT cookie immediately.

### Profile Routes (`/profile/*`)
- `GET /profile/view`: Returns details of the logged-in user.
- `PATCH /profile/edit`: Updates editable user details (e.g., photo URL, skills, age).
- `PATCH /profile/changePassword`: Validates strength and updates the password hash.

### Connection Request Routes (`/request/*`)
- `POST /request/send/:status/:toUserId`: Sends request. Status must be `ignored` or `interested`.
- `POST /request/review/:status/:requestId`: Reviews received request. Status must be `accepted` or `rejected`.

### User Queries & Feed Routes (`/user/*` and `/feed`)
- `GET /user/requests/received`: Fetches pending requests received by the current user.
- `GET /user/connections`: Retrieves all accepted friends.
- `GET /feed?page=1&limit=10`: Fetches other user cards, excluding own, connections, ignored, or pending users. Supports server-side pagination with skip/limit formula `(page - 1) * limit`.

### Chat History Route (`/chat/*`)
- `GET /chat/:targetUserId?page=1&limit=10`: Paginated access to historical direct messages. Returns the slice of messages along with `hasMore` pagination tokens.

### Stripe Membership Routes (`/payment/*`)
- `POST /payment/createProduct`: Generates Stripe checkout session.
- `POST /payment/webhook`: Processes payment updates from Stripe.
- `GET /payment/premium/verify`: Confirms user's premium status.
- `POST /payment/premium/cancel`: Downgrades user to a free account.

---

## Environment Configuration
Create a `.env` file in the root of the backend folder:
```env
PORT=7777
CLIENT_URL="https://dev-finder.online"
DB_CONNECTION_SECRET="mongodb+srv://..."
JWT_SECRET="your_jwt_signing_key"
AWS_ACCESS_KEY="your_aws_access_key"
AWS_SECRET_KEY="your_aws_secret_key"
STRIPE_SECRET_KEY="your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"
```

---

## Running Locally

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install
npm start
```

---

## Deployment & Process Management
The application runs on AWS EC2 behind Nginx. 

### Process Management with PM2
To run the server continuously in the background:
```bash
# Start backend server
pm2 start npm --name "dev-finder-backend" -- start

# List active processes
pm2 list

# View logs in real-time
pm2 logs

# Stop or restart processes
pm2 restart dev-finder-backend
pm2 stop dev-finder-backend
```

### Nginx Reverse Proxy Config
Insert this block under the main server directive in `/etc/nginx/sites-available/default`:
```nginx
server_name dev-finder.online;

location /api/ {
    proxy_pass http://localhost:7777/;
    proxy_http_version 1.1;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```
This maps requests targeting `https://dev-finder.online/api/*` directly to `http://localhost:7777/*`.
