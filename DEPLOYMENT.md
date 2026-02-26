# HealthBridge - Deployment Guide

## Prerequisites

You need to provide/arrange:

### 1. Server (Backend)
- **Node.js** 18+ installed
- **PM2** for process management (optional but recommended)
- Or use: Vercel, Render, Railway, Heroku, DigitalOcean

### 2. Database
- **MongoDB Atlas** (already configured) - Cloud database
- Or local MongoDB installation

### 3. Optional Services
- **Redis** - For caching (optional)
- **Cloudinary** - For file uploads (already configured)
- **Twilio** - For SMS (already configured)
- **SMTP Email** - For emails (already configured)

---

## Step 1: Environment Variables

Create/modify `.env` file in `/server` folder:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================
PORT=5000
NODE_ENV=production

# ===========================================
# DATABASE - MongoDB Atlas
# ===========================================
MONGODB_URI=mongodb+srv://your_connection_string_here

# ===========================================
# AUTHENTICATION (JWT) - CHANGE THIS!
# ===========================================
JWT_SECRET=generate_a_strong_random_64_character_string_here

# ===========================================
# EMAIL - SMTP
# ===========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=HealthBridge <your_email@gmail.com>

# ===========================================
# CLOUDINARY - File Uploads
# ===========================================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ===========================================
# TWILIO - SMS (Optional)
# ===========================================
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# ===========================================
# REDIS - Caching (Optional)
# ===========================================
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=false

# ===========================================
# CLIENT URL - IMPORTANT!
# ===========================================
CLIENT_URL=http://localhost:5000
# For production, change to your domain:
# CLIENT_URL=https://yourdomain.com

# ===========================================
# FEATURE FLAGS
# ===========================================
ENABLE_SMS=false
LOG_OTP_TO_CONSOLE=false
```

---

## Step 2: Generate JWT Secret

Run this in your browser console or use Node.js:

```javascript
// Generate a secure random string
console.log(require('crypto').randomBytes(64).toString('hex'));
```

Copy the output and set it as `JWT_SECRET` in your `.env` file.

---

## Step 3: Build Frontend

```bash
cd client
npm run build
```

This creates the `dist` folder with production-ready files.

---

## Step 4: Start Server

### Development Mode:
```bash
cd server
npm run dev
```

### Production Mode:
```bash
cd server
npm start
```

Or with PM2:
```bash
cd server
pm2 start src/server.js --name healthbridge
pm2 save
```

---

## Step 5: Deploy to Cloud Platforms

### Option A: Vercel (Recommended for Frontend + Server)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts

### Option B: Render.com

1. Connect your GitHub repository
2. Backend Service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add all from `.env`
3. Frontend Service:
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: Serve `client/dist` folder

### Option C: Railway

1. Connect GitHub repo
2. Add MongoDB Atlas database
3. Deploy with environment variables

### Option D: DigitalOcean Droplet

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your project
git clone your-repo-url
cd health-service-main

# Install dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# Start server with PM2
cd ../server
pm2 start src/server.js --name healthbridge
pm2 startup
pm2 save
```

---

## Step 6: Configure Domain

1. Buy a domain (e.g., from Namecheap, GoDaddy)
2. Point A record to your server IP
3. Or use Cloudflare for free SSL

---

## Quick Start Commands

```bash
# 1. Install dependencies
cd server && npm install
cd client && npm install

# 2. Build frontend
cd client && npm run build

# 3. Start server (production)
cd server && npm start
```

---

## Troubleshooting

### Port already in use:
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### MongoDB connection error:
- Check your `MONGODB_URI` in `.env`
- Make sure IP whitelist includes your server in MongoDB Atlas

### Static files not loading:
- Make sure you ran `npm run build` in client folder
- Check that `dist` folder exists in client directory

---

## Current Status

| Component | Status |
|-----------|--------|
| Backend API | ✅ Ready |
| Frontend Build | ✅ Ready |
| MongoDB | ✅ Connected |
| Cloudinary | ✅ Configured |
| Twilio | ✅ Configured |
| Email | ✅ Configured |

---

## Contact Support

If you need help:
- Telegram: https://t.me/abrahampaulsanhith
- Email: support@healthbridge.com
