# Booch Buddy Troubleshooting Guide

## "Failed to fetch" Error Fix

### Problem
Frontend shows "Failed to fetch" error when trying to login or make API calls.

### Root Causes
1. **Backend server not running** on port 5000
2. **CORS misconfiguration** - Frontend port doesn't match CORS allowed origin
3. **Port 5000 already in use** by another process

### Quick Fix Steps

#### 1. Check what's using port 5000
```bash
netstat -ano | findstr :5000 | findstr LISTENING
```

#### 2. Kill the process using port 5000
```bash
# Get the PID from step 1 (last column), then:
wmic process where ProcessId=[PID] delete
# Example: wmic process where ProcessId=30616 delete
```

#### 3. Update CORS configuration in .env
Make sure the FRONTEND_URL matches your actual frontend port:
```
FRONTEND_URL=http://localhost:5176  # Update this to match your frontend port
```

#### 4. Start the backend server
```bash
node server/dist/index.js
```

#### 5. Verify backend is running
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"OK","message":"Booch Buddy API is running",...}
```

### Working Test Credentials
- Username: **test**
- Password: **test123**

### Important Notes
- Frontend typically runs on port 5173-5176 (Vite auto-increments if port is busy)
- Backend runs on port 5000 (configured in .env)
- When .env changes, Vite auto-restarts but backend needs manual restart
- The admin user password hash may be corrupted - use the test account instead

### Database Setup
If database issues occur:
```bash
# Create database
mysql -u root -e "CREATE DATABASE IF NOT EXISTS booch_buddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root booch_buddy < database/schema.sql

# Migrate data from kbt_db (if exists)
mysql -u root < migrate_kbt_data.sql
```

### Running the Full Application
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend  
node server/dist/index.js

# Or use concurrent mode (may have issues with TypeScript loader)
npm run dev:full
```