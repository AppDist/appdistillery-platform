# Deployment Guide

Deploy Next.js applications to various platforms with production-ready configurations.

## Production Build

```bash
# Create optimized production build
npm run build

# Test production build locally
npm start
```

## Vercel (Recommended)

Vercel is the easiest way to deploy Next.js (created by Next.js team).

### Deploy with Git

1. Push code to GitHub/GitLab/Bitbucket
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Vercel automatically detects Next.js and configures build

### Deploy with CLI

```bash
npm install -g vercel
vercel
```

### Environment Variables

Set in Vercel Dashboard:
- Project Settings → Environment Variables
- Separate variables for Production, Preview, Development

### Configuration

```javascript
// vercel.json (optional)
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

## Docker

### Dockerfile

```dockerfile
# Multi-stage build for optimal size
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Enable Standalone Output

```typescript
// next.config.ts
const config: NextConfig = {
  output: 'standalone',
}

export default config
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Build and Run

```bash
# Build image
docker build -t my-nextjs-app .

# Run container
docker run -p 3000:3000 -e DATABASE_URL="..." my-nextjs-app

# With docker-compose
docker-compose up
```

## AWS

### AWS Amplify

1. Connect Git repository
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### AWS App Runner

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.region.amazonaws.com
docker build -t my-app .
docker tag my-app:latest <account>.dkr.ecr.region.amazonaws.com/my-app:latest
docker push <account>.dkr.ecr.region.amazonaws.com/my-app:latest

# Create App Runner service via console or CLI
```

### AWS ECS/Fargate

1. Push Docker image to ECR
2. Create ECS task definition
3. Create ECS service with load balancer

## Netlify

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_TELEMETRY_DISABLED = "1"
```

### Deploy

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Google Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/nextjs-app

# Deploy to Cloud Run
gcloud run deploy nextjs-app \
  --image gcr.io/PROJECT_ID/nextjs-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Kubernetes

### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs
  template:
    metadata:
      labels:
        app: nextjs
    spec:
      containers:
      - name: nextjs
        image: my-nextjs-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: nextjs-service
spec:
  selector:
    app: nextjs
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Apply

```bash
kubectl apply -f deployment.yaml
```

## CDN Configuration

### Cloudflare

1. Add site to Cloudflare
2. Configure DNS
3. Enable caching rules:
   ```
   Cache Level: Standard
   Browser Cache TTL: Respect Existing Headers
   Always Online: On
   ```

### CloudFront (AWS)

```javascript
// Configure in next.config.ts
const config: NextConfig = {
  images: {
    domains: ['d1234.cloudfront.net'],
  },
  assetPrefix: 'https://d1234.cloudfront.net',
}
```

## Environment-Specific Builds

### Staging

```bash
# .env.staging
DATABASE_URL=staging-db-url
NEXT_PUBLIC_API_URL=https://staging-api.example.com

# Build for staging
npm run build
```

### Production

```bash
# .env.production
DATABASE_URL=production-db-url
NEXT_PUBLIC_API_URL=https://api.example.com

# Build for production
NODE_ENV=production npm run build
```

## Performance Optimization

### Enable Compression

```typescript
// next.config.ts
const config: NextConfig = {
  compress: true, // Gzip compression (enabled by default)
}
```

### Configure Caching

```typescript
// app/api/data/route.ts
export async function GET() {
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

### Image Optimization

```typescript
const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

## Monitoring

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    await db.query('SELECT 1')
    
    return Response.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 503 }
    )
  }
}
```

### Logging

```typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})
```

## Security Headers

```typescript
// next.config.ts
const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

## Rollback Strategy

### Vercel

- Automatic rollback available in dashboard
- Each deployment has unique URL

### Docker

```bash
# Tag versions
docker tag my-app:latest my-app:v1.2.3

# Rollback by deploying previous version
docker pull my-app:v1.2.2
docker run my-app:v1.2.2
```

### Kubernetes

```bash
# View deployment history
kubectl rollout history deployment/nextjs-app

# Rollback to previous version
kubectl rollout undo deployment/nextjs-app

# Rollback to specific revision
kubectl rollout undo deployment/nextjs-app --to-revision=2
```

## Troubleshooting

### Build Fails

- Check Node.js version compatibility
- Clear `.next` folder: `rm -rf .next`
- Verify all dependencies are installed
- Check for TypeScript errors

### Runtime Errors

- Check environment variables are set
- Review server logs
- Verify database connections
- Check API endpoint configurations

### Performance Issues

- Enable compression
- Optimize images
- Implement proper caching
- Use CDN for static assets
- Monitor bundle size: `npm run build` shows bundle analysis
