---
title: "Docker Compose for Multi-Container Apps"
date: 2026-02-14
author: "Learning Never Ends"
excerpt: "Master Docker Compose to orchestrate complex multi-container applications with ease and efficiency."
tags: ["docker", "compose", "orchestration", "multi-container"]
---

# Docker Compose for Multi-Container Apps

Managing multiple containers manually becomes complex quickly. **Docker Compose** solves this by defining multi-container applications in a single YAML file.

## What is Docker Compose?

**Docker Compose** is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file to configure your application's services, networks, and volumes.

```plantuml
@startuml
!theme blueprint
title Docker Compose Architecture

package "docker-compose.yml" {
  rectangle "Service Definitions" as services
  rectangle "Network Configuration" as networks  
  rectangle "Volume Configuration" as volumes
}

package "Running Application" {
  rectangle "Web Container" as web
  rectangle "API Container" as api
  rectangle "Database Container" as db
  rectangle "Redis Container" as redis
}

package "Docker Networks" {
  rectangle "app-network" as net
}

package "Docker Volumes" {
  rectangle "db-data" as vol1
  rectangle "redis-data" as vol2
}

services --> web : docker compose up
services --> api
services --> db  
services --> redis

web -.-> net
api -.-> net
db -.-> net
redis -.-> net

db -.-> vol1
redis -.-> vol2
@enduml
```

## Benefits of Docker Compose

- **Simplified Management**: Single command to start/stop entire application
- **Environment Consistency**: Same configuration across dev, test, production
- **Service Dependencies**: Define startup order and relationships  
- **Scaling**: Easily scale services up or down
- **Networking**: Automatic network creation and service discovery

## Basic Docker Compose Structure

### docker-compose.yml Anatomy

```yaml
version: '3.8'  # Compose file format version

services:       # Container definitions
  web:
    image: nginx:latest
    ports:
      - "8080:80"
      
  api:
    build: ./api
    environment:
      - NODE_ENV=production
      
  database:
    image: postgres:15
    volumes:
      - db_data:/var/lib/postgresql/data

networks:       # Network definitions (optional)
  default:
    driver: bridge

volumes:        # Volume definitions (optional)
  db_data:
```

## Essential Docker Compose Commands

```bash
# Start services in background
docker compose up -d

# Start specific services
docker compose up web database

# Stop and remove containers
docker compose down

# Stop and remove everything (including volumes)
docker compose down -v

# View running services
docker compose ps

# View service logs
docker compose logs web

# Follow logs for all services
docker compose logs -f

# Execute command in running service
docker compose exec web bash

# Scale service to multiple instances
docker compose up -d --scale web=3

# Rebuild services
docker compose up -d --build
```

## Practical Example: Full-Stack Web Application

Let's build a complete web application with frontend, backend, database, and cache:

### Project Structure
```
my-app/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   └── src/
├── backend/
│   ├── Dockerfile  
│   ├── package.json
│   └── server.js
└── nginx/
    └── nginx.conf
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Frontend (React App)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: react-app
    restart: unless-stopped
    
  # Backend API (Node.js)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: node-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://admin:secret123@database:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - database
      - cache
    volumes:
      - ./backend:/app
      - /app/node_modules
      
  # NGINX Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: reverse-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - frontend
      - backend
      
  # PostgreSQL Database
  database:
    image: postgres:15-alpine
    container_name: postgres-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret123
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "5432:5432"
      
  # Redis Cache
  cache:
    image: redis:7-alpine
    container_name: redis-cache
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  # Background Worker
  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: background-worker
    restart: unless-stopped
    command: npm run worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://admin:secret123@database:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - database
      - cache
    volumes:
      - ./backend:/app
      - /app/node_modules

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  default:
    name: myapp-network
    driver: bridge
```

### Run the Application
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend

# Scale backend API
docker compose up -d --scale backend=3

# Stop everything
docker compose down
```

## Service Configuration Options

### Build Configuration

```yaml
services:
  web:
    build:
      context: ./web          # Build context directory
      dockerfile: Dockerfile.prod  # Custom Dockerfile name
      args:                   # Build arguments
        - NODE_ENV=production
        - VERSION=1.2.3
      target: production      # Multi-stage build target
```

### Environment Variables

```yaml
services:
  api:
    image: my-api:latest
    environment:
      # Method 1: Key-value pairs
      - NODE_ENV=production
      - DATABASE_URL=postgresql://db:5432/app
      
    # Method 2: Dictionary format
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://db:5432/app
      
    # Method 3: External env file
    env_file:
      - .env
      - .env.production
```

### Volume Mounting

```yaml
services:
  web:
    image: nginx:latest
    volumes:
      # Named volume
      - web_data:/usr/share/nginx/html
      
      # Bind mount
      - ./website:/usr/share/nginx/html
      
      # Read-only bind mount
      - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
      
      # Anonymous volume
      - /var/log/nginx
```

### Networking

```yaml
services:
  web:
    image: nginx:latest
    networks:
      - frontend
      - backend
    ports:
      - "80:80"           # Host:Container
      - "127.0.0.1:8080:8080"  # Bind to localhost only
      
  api:
    image: my-api:latest
    networks:
      backend:
        aliases:          # Network aliases
          - api-server
          - backend-api
    expose:              # Internal port exposure
      - "3000"

networks:
  frontend:
    driver: bridge
  backend:
    internal: true       # No external access
```

## Advanced Compose Features

### Service Dependencies

```yaml
services:
  web:
    image: nginx:latest
    depends_on:
      - api
      - database
    # Starts after api and database
    
  api:
    image: my-api:latest
    depends_on:
      database:
        condition: service_healthy
    # Waits for database health check
    
  database:
    image: postgres:15
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

```yaml
services:
  web:
    image: nginx:latest
    deploy:
      resources:
        limits:
          cpus: '0.5'      # 50% of 1 CPU core
          memory: 512M     # 512MB memory limit
        reservations:
          cpus: '0.25'     # Reserved CPU
          memory: 256M     # Reserved memory
```

### Health Checks

```yaml
services:
  api:
    image: my-api:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s      # Check every 30 seconds
      timeout: 10s       # Timeout after 10 seconds
      retries: 3         # Retry 3 times before unhealthy
      start_period: 40s  # Grace period before first check
```

### Restart Policies

```yaml
services:
  web:
    image: nginx:latest
    restart: unless-stopped  # Options: no, always, on-failure, unless-stopped
    
  worker:
    image: my-worker:latest
    restart: on-failure:3    # Restart max 3 times on failure
```

## Environment-Specific Configurations

### Multiple Compose Files

**docker-compose.yml** (base configuration):
```yaml
version: '3.8'
services:
  web:
    image: nginx:latest
    volumes:
      - ./website:/usr/share/nginx/html
      
  api:
    build: ./api
    environment:
      - NODE_ENV=development
```

**docker-compose.prod.yml** (production overrides):
```yaml
version: '3.8'
services:
  web:
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl:ro
      
  api:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
```

```bash
# Use multiple files
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or use COMPOSE_FILE environment variable
export COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml
docker compose up -d
```

### Environment Variables in Compose

**.env** file:
```bash
POSTGRES_PASSWORD=secret123
REDIS_PASSWORD=cache456
API_VERSION=1.2.3
NGINX_PORT=8080
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  database:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      
  web:
    image: nginx:latest
    ports:
      - "${NGINX_PORT}:80"
      
  api:
    build:
      context: ./api
      args:
        VERSION: ${API_VERSION}
```

## Real-World Compose Examples

### WordPress with MySQL

```yaml
version: '3.8'
services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: mysql:3306
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: password123
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress_data:/var/www/html
    depends_on:
      - mysql
      
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress  
      MYSQL_PASSWORD: password123
      MYSQL_ROOT_PASSWORD: rootpassword123
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

volumes:
  wordpress_data:
  mysql_data:
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
version: '3.8'
services:
  elasticsearch:
    image: elasticsearch:8.6.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
      
  logstash:
    image: logstash:8.6.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
    depends_on:
      - elasticsearch
      
  kibana:
    image: kibana:8.6.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## Compose Best Practices

### Development Workflow
```bash
# Development setup
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Watch for changes (if supported)
docker compose up --watch

# Rebuild specific service
docker compose up -d --build api

# View logs during development
docker compose logs -f --tail=100 api
```

### Production Deployment
```bash
# Production deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Update single service
docker compose pull api
docker compose up -d --no-deps api

# Backup volumes before updates
docker compose exec database pg_dump -U admin myapp > backup.sql
```

### Debugging and Troubleshooting

```bash
# Check service status
docker compose ps

# View service configuration
docker compose config

# Debug specific service
docker compose run --rm api bash

# Check resource usage
docker compose top

# Restart specific service
docker compose restart api
```

## Performance and Optimization

### Service Scaling
```bash
# Scale services based on load
docker compose up -d --scale web=3 --scale api=5

# Load balance with nginx
# (requires proper nginx configuration)
```

### Resource Monitoring
```yaml
services:
  web:
    image: nginx:latest
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    deploy:
      resources:
        limits:
          memory: 256M
```

## Migration from Docker Commands

### Before (Manual Commands)
```bash
# Manual container management
docker network create myapp-network
docker volume create postgres-data

docker run -d --name postgres \
  --network myapp-network \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:15

docker run -d --name api \
  --network myapp-network \
  -p 3000:3000 \
  my-api:latest

docker run -d --name web \
  --network myapp-network \
  -p 80:80 \
  nginx:latest
```

### After (Docker Compose)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
      
  api:
    image: my-api:latest
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      
  web:
    image: nginx:latest
    ports:
      - "80:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

```bash
# Single command to manage everything
docker compose up -d
```

## Next Steps

With Docker Compose mastered, let's explore Docker best practices and security in the final lesson!

Key takeaways:
- Compose simplifies multi-container application management
- YAML configuration is environment-agnostic and version-controlled
- Service dependencies ensure proper startup order
- Multiple compose files enable environment-specific configurations

---
## References
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
