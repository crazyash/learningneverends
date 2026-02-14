---
title: "Docker Best Practices"
date: 2026-02-14
author: "Learning Never Ends"
excerpt: "Master production-ready Docker practices for security, performance, and maintainability in enterprise environments."
tags: ["docker", "best-practices", "security", "production"]
---

# Docker Best Practices

Ready to take your Docker skills to production level? These best practices will help you build secure, efficient, and maintainable containerized applications.

## Security Best Practices

### Use Official Base Images

```dockerfile
#  GOOD: Official images are maintained and security-scanned
FROM node:18-alpine
FROM nginx:alpine  
FROM postgres:15-alpine

#  AVOID: Unofficial images may have vulnerabilities
FROM someuser/custom-node
FROM random-nginx-build
```

**Why official images?**
- Regular security updates
- Smaller attack surface
- Proven stability
- Community support

### Run as Non-Root User

```dockerfile
#  GOOD: Create and use non-root user
FROM node:18-alpine

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set ownership and switch user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Now all commands run as nodejs user
COPY --chown=nodejs:nodejs . /app
```

```dockerfile
#  BAD: Running as root
FROM node:18-alpine
COPY . /app
# Implicitly running as root user
```

### Minimize Image Attack Surface

```dockerfile
#  GOOD: Multi-stage build removes build tools
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
USER nodejs
CMD ["node", "dist/server.js"]
```

### Security Scanning

```bash
# Scan images for vulnerabilities
docker scout quickview my-app:latest
docker scout cves my-app:latest

# Use Trivy for comprehensive scanning
trivy image my-app:latest

# Scan during CI/CD pipeline
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image my-app:latest
```

## Image Optimization

### Layer Optimization and Caching

```dockerfile
#  GOOD: Optimize layer caching
FROM node:18-alpine
WORKDIR /app

# Copy package.json first (changes less frequently)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source code (changes more frequently)
COPY . .

#  BAD: Poor layer caching
FROM node:18-alpine
WORKDIR /app
COPY . .                    # This invalidates cache for every code change
RUN npm install
```

### Minimize Layer Count

```dockerfile
#  GOOD: Combine related commands
FROM ubuntu:22.04
RUN apt-get update && \
    apt-get install -y \
        curl \
        git \
        vim && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

#  BAD: Too many layers
FROM ubuntu:22.04
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git  
RUN apt-get install -y vim
RUN apt-get clean
```

### Use .dockerignore

```dockerfile
# .dockerignore
node_modules
npm-debug.log*
.git
.gitignore
README.md
.env
.env.local
coverage/
.nyc_output
test/
docs/
.docker/
Dockerfile*
docker-compose*
```

### Choose Right Base Images

```dockerfile
# Size comparison for Node.js app:

#  LARGE: Full Ubuntu base (~200MB)  
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y nodejs npm

#  BETTER: Official Node.js (~150MB)
FROM node:18

#  BEST: Alpine version (~50MB)
FROM node:18-alpine

#  OPTIMAL: Distroless for production (~30MB)
FROM gcr.io/distroless/nodejs18-debian11
```

## Performance Best Practices

### Resource Management

```yaml
# docker-compose.yml
services:
  web:
    image: my-web-app:latest
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    restart: unless-stopped
```

```bash
# Run with resource limits
docker run -d \
  --memory="256m" \
  --cpus="0.5" \
  --name optimized-app \
  my-app:latest
```

### Health Checks

```dockerfile
# Add health check to Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

```yaml
# Health check in docker-compose.yml
services:
  api:
    image: my-api:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Logging Best Practices

```dockerfile
# Configure logging in application
# Log to STDOUT/STDERR for container compatibility
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log
```

```yaml
# Configure log rotation
services:
  web:
    image: nginx:alpine
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Development Best Practices

### Environment Configuration

```dockerfile
#  GOOD: Use environment variables
FROM node:18-alpine
ENV NODE_ENV=production
ENV PORT=3000
ENV LOG_LEVEL=info

# Support configuration override
EXPOSE $PORT
```

```yaml
# Environment-specific overrides
version: '3.8'
services:
  app:
    image: my-app:latest
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    env_file:
      - .env
      - .env.local
```

### Secrets Management

```yaml
#  GOOD: Use Docker secrets (Swarm mode)
version: '3.8'
services:
  app:
    image: my-app:latest
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
```

```bash
#  AVOID: Hardcoded secrets in Dockerfile
# Don't do this:
ENV API_KEY=super-secret-key-123
ENV DATABASE_PASSWORD=admin123
```

### Development vs Production

**Dockerfile.dev**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install  # Include dev dependencies
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Dockerfile.prod**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
USER nodejs
EXPOSE 3000
CMD ["node", "server.js"]
```

## Production Deployment

### Container Orchestration Readiness

```yaml
# Production-ready docker-compose.yml
version: '3.8'
services:
  web:
    image: my-web-app:${VERSION:-latest}
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
```

### Graceful Shutdown

```javascript
// Node.js graceful shutdown example
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');  
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
```

```dockerfile
# Set proper signal handling
STOPSIGNAL SIGTERM
```

### Monitoring and Observability

```dockerfile
# Expose metrics endpoint
EXPOSE 3000 9090
ENV METRICS_PORT=9090
```

```yaml
# Monitoring stack
services:
  app:
    image: my-app:latest
    ports:
      - "3000:3000"
      - "9090:9090"  # Metrics
    
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9091:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## CI/CD Integration

### Multi-Stage Pipeline

```yaml
# .github/workflows/docker.yml
name: Docker Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: |
          docker build -f Dockerfile.test -t my-app:test .
          docker run --rm my-app:test npm test
          
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build image
        run: docker build -t my-app:latest .
        
      - name: Security scan
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            aquasec/trivy image my-app:latest
            
  build-and-push:
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push
        run: |
          docker build -t my-app:${GITHUB_SHA} .
          docker push my-app:${GITHUB_SHA}
```

### Image Versioning

```bash
# Semantic versioning strategy
docker build -t my-app:1.2.3 .
docker build -t my-app:1.2 .
docker build -t my-app:1 .
docker build -t my-app:latest .

# Git-based versioning
docker build -t my-app:$(git rev-parse --short HEAD) .
docker build -t my-app:$(git describe --tags) .
```

## Maintenance Best Practices

### Regular Updates

```bash
#!/bin/bash
# update-images.sh - Regular image updates

images=("nginx:alpine" "node:18-alpine" "postgres:15-alpine")

for image in "${images[@]}"; do
    echo "Updating $image..."
    docker pull "$image"
done

# Rebuild applications with updated base images
docker-compose build --no-cache
docker-compose up -d
```

### Cleanup Automation

```bash
#!/bin/bash
# cleanup.sh - Regular Docker cleanup

# Remove unused containers
docker container prune -f

# Remove unused images  
docker image prune -f

# Remove unused volumes (be careful!)
docker volume prune -f

# Remove unused networks
docker network prune -f

# Remove build cache
docker builder prune -f

echo "Docker cleanup completed"
```

### Monitoring Script

```bash
#!/bin/bash
# docker-health-check.sh

services=("web" "api" "database" "cache")

for service in "${services[@]}"; do
    if docker compose ps --services --filter "status=running" | grep -q "$service"; then
        echo " $service is running"
    else
        echo " $service is down - attempting restart"
        docker compose restart "$service"
    fi
done

# Check resource usage
echo "=== Resource Usage ==="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Security Hardening Checklist

### Image Security
- Use official base images
- Run as non-root user  
- Scan images for vulnerabilities
- Keep base images updated
- Use multi-stage builds
- Minimize installed packages

### Runtime Security  
- Set resource limits
- Use read-only filesystems when possible
- Drop unnecessary capabilities
- Use secrets management
- Enable logging and monitoring
- Network segmentation

### Operational Security
- Regular security updates
- Monitor container behavior
- Implement proper backup strategies
- Use container image signing
- Audit access controls
- Document security procedures

## Performance Optimization Checklist

### Build Optimization
- Optimize Dockerfile layer caching
- Use .dockerignore effectively  
- Choose minimal base images
- Combine RUN commands
- Clean package caches

### Runtime Optimization
- Set appropriate resource limits
- Configure proper logging
- Implement health checks
- Use volume mounts for persistent data
- Monitor resource usage

### Application Optimization  
- Optimize application startup time
- Implement graceful shutdown
- Use connection pooling
- Cache static assets
- Monitor application metrics

## Troubleshooting Common Issues

### High Memory Usage
```bash
# Check memory usage
docker stats --no-stream

# Set memory limits
docker run -m 512m my-app:latest

# Monitor memory leaks
docker exec container-name ps aux --sort=-%mem
```

### Slow Build Times
```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker build -t my-app:latest .

# Optimize layer caching
# Move less frequently changing operations earlier in Dockerfile
```

### Network Connectivity Issues
```bash
# Debug network connectivity
docker network ls
docker network inspect bridge

# Test container connectivity
docker exec container1 ping container2
docker exec container1 nslookup container2
```

## Conclusion

Following these Docker best practices will help you build:
- **Secure** applications with minimal attack surface
- **Efficient** images with optimal resource usage  
- **Maintainable** code with proper CI/CD integration
- **Production-ready** deployments with monitoring and logging

Remember: Start with security, optimize for performance, and always plan for production from day one!

## Next Steps

Congratulations! You've completed the Docker Beginner course. You now have solid foundation in:
- Container fundamentals and Docker architecture
- Building and managing custom images
- Container lifecycle management
- Persistent data with volumes
- Container networking and communication
- Multi-container orchestration with Compose
- Production-ready best practices

**Continue your Docker journey:**
- Explore Docker Swarm for container orchestration
- Learn Kubernetes for advanced container management
- Study advanced networking and security topics
- Practice with real-world project deployments

---
## References
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Bench Security](https://github.com/docker/docker-bench-security)
