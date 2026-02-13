# Core City Platform

A civic engagement platform for reporting and resolving urban issues.

## Deployment to Render

This application is configured for deployment to Render. Follow these steps:

### Prerequisites
- A GitHub repository with this code
- A Render account

### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create a new Web Service on Render**
   - Go to https://dashboard.render.com/
   - Click "New +" and select "Web Service"
   - Connect your GitHub account and select your repository
   - Render will automatically detect the Node.js environment

3. **Configure the deployment**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node.js
   - Region: Select closest to your users

4. **Set Environment Variables**
   Add these environment variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `DB_HOST`: Provided by Render when you add a database
   - `DB_PORT`: `5432`
   - `DB_NAME`: Provided by Render
   - `DB_USER`: Provided by Render
   - `DB_PASSWORD`: Provided by Render
   - `JWT_SECRET`: Generate a strong secret

5. **Deploy!**

### Alternative: Use the Render Blueprint**
This repository includes a `Render.yaml` file that can be used as a blueprint. When creating your service, you can reference this file for automatic configuration.

## Local Development

To run the application locally:

```bash
npm run dev
```

This will start both the backend and frontend development servers.

## Architecture

- **Frontend**: Built with Vite, deployed as static files
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL
- **Authentication**: JWT-based

## Features

- Citizen reporting of urban issues with photos and geolocation
- Worker assignment and task management
- Administrator dashboard with analytics
- Role-based access control
- Real-time status tracking