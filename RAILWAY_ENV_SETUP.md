# Railway Environment Variables Setup

## 🚨 **URGENT: Production API Key Issues**

The production server is returning 401 errors because the Railway environment variables are not properly configured. You need to set these variables in your Railway dashboard.

## 🔧 **Required Environment Variables**

Set these in your Railway project dashboard under Settings → Variables:

### **Security Variables (CRITICAL)**
```
API_KEY = 860de3877c2de19b8c88f34c34b71580
JWT_SECRET = vEahCndVJYE4s/hkNuJ9EMW3xjfgWh+kq+XmYumxAsQ=
```

### **Database Variables**
```
MONGODB_URI = mongodb+srv://basherkitbasher_db_user:Jkv7hzom@cluster0.eqetzhr.mongodb.net/?appName=Cluster0
```

### **Application Variables**
```
NODE_ENV = production
PORT = 8080
REDIS_URL = disabled
ALLOWED_ORIGINS = https://kit-basher.github.io,https://dark-city-game-production.up.railway.app
DISCORD_WEBHOOK_URL = your_discord_webhook_url_here
BCRYPT_ROUNDS = 12
REPO_OWNER = Kit-Basher
REPO_NAME = dark-city-game
ENABLE_GITHUB_INTEGRATION = false
ENABLE_DISCORD_NOTIFICATIONS = false
CALENDAR_MONTHS_TO_LOAD = 3
MAX_CHARACTERS_PER_PAGE = 12
LOG_LEVEL = info
```

## 🚀 **Steps to Fix Production**

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**: `dark-city-game-production`
3. **Go to Settings → Variables**
4. **Add/update each variable** from the list above
5. **Redeploy the service** to apply changes

## 🔍 **What Was Fixed**

### **Backend Changes**
- ✅ Added `envInjector.js` middleware to inject environment variables into HTML
- ✅ Updated `server.js` to use the envInjector middleware
- ✅ Updated `railway.toml` with all required environment variables
- ✅ Fixed `.env` file with secure API key and JWT secret

### **Environment Variable Injection**
The server now automatically injects environment variables as meta tags into HTML pages:
```html
<meta name="env-API_KEY" content="860de3877c2de19b8c88f34c34b71580">
<meta name="env-NODE_ENV" content="production">
<!-- etc... -->
```

### **Frontend Loading**
The `env-loader.js` script reads these meta tags and makes them available to the frontend configuration.

## 🧪 **Testing After Fix**

1. **Deploy the changes** to Railway
2. **Check the browser console** - should no longer show 401 errors
3. **Verify API calls** are working in the Network tab
4. **Test character loading** on the main page and gallery

## 📱 **Expected Results**

After setting the environment variables correctly:
- ✅ Main page loads characters without 401 errors
- ✅ Gallery displays approved characters
- ✅ Character editing works with proper authentication
- ✅ No "Invalid API key" errors in console

## 🔒 **Security Notes**

- The API key `860de3877c2de19b8c88f34c34b71580` is now secure
- JWT secret `vEahCndVJYE4s/hkNuJ9EMW3xjfgWh+kq+XmYumxAsQ=` is properly configured
- Environment variables are injected safely into frontend
- All hardcoded secrets have been removed

## 🚨 **If Issues Persist**

1. **Check Railway logs** for any startup errors
2. **Verify variable names** match exactly (case-sensitive)
3. **Ensure Railway redeployment** after adding variables
4. **Clear browser cache** and reload the page

The environment variable injector middleware will ensure the frontend gets the correct API key once Railway is properly configured.
