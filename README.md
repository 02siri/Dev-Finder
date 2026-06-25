# DevFinder Backend

This is the backend server for DevFinder, a full-stack social networking platform for software developers. It operates as an Express.js API that manages database transactions, handles token-based session authentication, coordinates WebSocket connections, and communicates with external services.

## Tech Stack
- **Runtime & Framework**: Node.js + Express.js
- **Database**: MongoDB via Mongoose
- **Real-Time Communication**: Socket.io
- **Integrations**: Stripe SDK (Payments), AWS SDK (Amazon SES)
- **Scheduling**: Node-Cron

---

## Architecture & Core Features

### 1. Database & Persistence
- **Data Modeling**: Models user profiles, connection relationships, transactions, and message histories.
- **Query Optimization**: Employs database indexes to facilitate fast lookups for relations and requests.

### 2. WebSocket Real-Time Chat
- **Secure Sessions**: Validates cookies to authenticate incoming WebSocket connections.
- **Channel Access**: Derives chat channels programmatically and enforces active connection requirements before allowing messages to route between users.

### 3. Stripe Integration & Webhooks
- **Session Billing**: Generates dynamic Stripe billing links and directs users to payment portals.
- **Event Handling**: Listens to Stripe webhook signals securely and updates premium memberships on successful subscription events.

### 4. Notification Scheduler
- **Daily Digests**: Runs scheduled checks to gather recently created request notifications.
- **Email Dispatch**: Sends summarized update digests via Amazon Simple Email Service (SES).

---

## API Reference

### Auth
- `POST /auth/signup` - Register a new user profile
- `POST /auth/login` - Authenticate credentials and establish session cookie
- `POST /auth/logout` - Clear session authentication

### Profile
- `GET /profile/view` - Retrieve logged-in user profile details
- `PATCH /profile/edit` - Update profile configurations
- `PATCH /profile/changePassword` - Change password securely

### Connections & Requests
- `POST /request/send/:status/:toUserId` - Send connection request (Interested/Ignored)
- `POST /request/review/:status/:requestId` - Review incoming connection request (Accept/Reject)
- `GET /user/requests/received` - Fetch pending connection requests
- `GET /user/connections` - Fetch accepted connections

### Feed & Chat
- `GET /feed` - Fetch candidate card feed for discovery
- `GET /chat/:targetUserId` - Retrieve paginated historical chat logs

### Payments
- `POST /payment/createProduct` - Generate checkout session URLs
- `POST /payment/webhook` - Handle Stripe webhook events
- `GET /payment/premium/verify` - Confirm user's premium status
- `POST /payment/premium/cancel` - Cancel active subscription plan

---

## Running Locally

### 1. Installation
Install dependencies inside the backend folder:
```bash
npm install
```

### 2. Configure Environment
Set up your required environment variables (port, database connection string, JWT secret, AWS credentials, and Stripe keys) in a local `.env` file at the root of this folder.

### 3. Run Server
Start the development server:
```bash
npm run dev
```

The backend server defaults to port `7777`.

---

## Deployment & Process Management
The application is deployed on an **AWS EC2 Instance** (Ubuntu) using Nginx and PM2.

### Step 1: Connect to your EC2 Instance
Access your virtual machine via SSH:
```bash
ssh -i "your-key-file.pem" ubuntu@your-ec2-ip-address
```

### Step 2: Set Up Environment & Clone
1. Install system requirements (Node.js, PM2, and Nginx).
2. Clone the backend repository to your directory.
3. Configure local environment variables in a `.env` file.

### Step 3: Manage Application with PM2
To run and monitor the server continuously in the background:
```bash
# Start backend server
pm2 start npm --name "dev-finder-backend" -- start

# List active processes
pm2 list

# Monitor logs in real-time
pm2 logs

# Restart process
pm2 restart dev-finder-backend
```

### Step 4: Reverse Proxy Configuration
Configure your Nginx server block to forward incoming API requests to the local backend port:
- Standard traffic targeting `/api/*` is routed directly to the backend application running on `http://localhost:7777`.
