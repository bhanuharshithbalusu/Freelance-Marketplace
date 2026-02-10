# Deployment Guide

## Quick Start

Your environment files are ready with pre-configured secrets:
- `server/.env.production` - Backend environment variables
- `client/.env.production` - Frontend environment variables

## Environment Variables Summary

### Backend (server/.env.production)
✅ MongoDB connection configured  
✅ JWT secrets generated (secure random 32-char strings)  
⚠️ Need to update `CLIENT_URL` after frontend deployment

### Frontend (client/.env.production)
⚠️ Need to update `NEXT_PUBLIC_API_URL` after backend deployment  
⚠️ Need to update `NEXT_PUBLIC_SOCKET_URL` after backend deployment  
⚠️ Need to update `NEXT_PUBLIC_APP_URL` after frontend deployment

## Deployment Steps

### 1. Deploy Backend (Render/Railway)

**Using Railway CLI:**
```bash
cd server
railway login
railway init
railway up
```

**Using Render:**
- Go to https://render.com
- Create new Web Service
- Connect GitHub repo
- Set root directory to `server`
- Copy environment variables from `server/.env.production`

### 2. Deploy Frontend (Vercel)

**Using Vercel CLI:**
```bash
cd client
vercel login
vercel --prod
```

**Using Vercel Dashboard:**
- Go to https://vercel.com
- Import GitHub repo
- Set root directory to `client`
- Copy environment variables from `client/.env.production`

### 3. Update Environment Variables

After deployment:
1. Update `CLIENT_URL` in backend with your Vercel URL
2. Update `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` in frontend with your backend URL
3. Redeploy both services

## Generated Secrets

Your JWT secrets have been securely generated:
- JWT_ACCESS_SECRET: `wdJkaQoP4SrfvTDu0XZcQH95VnKNxTCP0h19AyavtIQ=`
- JWT_REFRESH_SECRET: `kjJBwoXoJnYT9+usFWtbOvldN4W9q5g6TKyJhmBjf4Q=`

**⚠️ Keep these secrets secure - do not commit to version control!**

## MongoDB Connection

Your database is ready:
- Cluster: cluster0.6gxkroo.mongodb.net
- Database: freelance
- Connection string configured in `.env.production`

## Next Steps

1. Choose your deployment platform (Render/Railway for backend, Vercel for frontend)
2. Deploy backend first
3. Copy the backend URL
4. Update frontend environment variables with backend URL
5. Deploy frontend
6. Test the application

For detailed instructions, see the walkthrough in the artifacts folder.
