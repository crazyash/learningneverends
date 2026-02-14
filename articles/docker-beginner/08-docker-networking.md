---
title: "Docker Networking Basics"
date: 2026-02-14
author: "Learning Never Ends"
excerpt: "Understand Docker networking fundamentals, network types, and container communication patterns."
tags: ["docker", "networking", "communication", "containers"]
---

# Docker Networking Basics

Docker networking enables containers to communicate with each other and the outside world. Understanding networking is crucial for building multi-container applications.

## Container Networking Overview

```plantuml
@startuml
!theme blueprint
title Docker Network Architecture

package "Host Machine" {
  rectangle "Docker Engine" as engine
  
  package "Bridge Network" {
    rectangle "Web Container\n(172.17.0.2)" as web
    rectangle "API Container\n(172.17.0.3)" as api
    rectangle "DB Container\n(172.17.0.4)" as db
  }
  
  rectangle "Host Network Interface\n(eth0)" as host_net
}

package "External Network" {
  rectangle "Internet" as internet
  rectangle "Other Services" as external
}

web <--> api : Container-to-container
api <--> db : Database queries
engine <--> host_net : Port mapping
host_net <--> internet : External access
@enduml
```

## Default Docker Networks

When Docker is installed, it creates three default networks:

### Bridge Network (default)
- **Purpose**: Default network for containers
- **Scope**: Single host
- **Isolation**: Containers can communicate with each other
- **External Access**: Via port mapping

### Host Network  
- **Purpose**: Remove network isolation
- **Scope**: Uses host's network directly
- **Performance**: Best network performance
- **Use Case**: High-performance applications

### None Network
- **Purpose**: Complete network isolation
- **Scope**: No network access
- **Use Case**: Maximum security, batch processing

```bash
# List default networks
docker network ls

# Output:
# NETWORK ID     NAME      DRIVER    SCOPE
# 123abc456def   bridge    bridge    local
# 789ghi012jkl   host      host      local
# 456mno789pqr   none      null      local
```

## Creating and Managing Networks

### Custom Bridge Networks

```bash
# Create a custom bridge network
docker network create my-app-network

# Create with specific subnet
docker network create --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  custom-network

# Inspect network details
docker network inspect my-app-network

# Remove network
docker network rm my-app-network
```

### Network Drivers

| Driver | Description | Use Case |
|--------|-------------|----------|
| **bridge** | Default single-host networking | Development, simple apps |
| **host** | Remove network isolation | High performance needs |
| **none** | Disable networking | Security, isolated processing |
| **overlay** | Multi-host networking | Docker Swarm clusters |
| **macvlan** | Assign MAC addresses | Legacy app integration |

## Container Network Communication

### Same Network Communication

```bash
# Create custom network
docker network create app-network

# Run containers on same network
docker run -d --name web-server --network app-network nginx:latest
docker run -d --name app-server --network app-network node:18-alpine
docker run -d --name database --network app-network postgres:15

# Containers can communicate using container names
# web-server can reach app-server at http://app-server:3000
# app-server can reach database at postgresql://database:5432
```

### Connecting Existing Containers to Networks

```bash
# Run container on default network
docker run -d --name existing-app nginx:latest

# Connect to custom network
docker network connect app-network existing-app

# Now accessible via both default bridge and app-network
# Disconnect from a network
docker network disconnect bridge existing-app
```

## Practical Networking Examples

### Example 1: Web Application with Database

```bash
# Create application network
docker network create webapp-network

# Run PostgreSQL database
docker run -d --name postgres-db \
  --network webapp-network \
  -e POSTGRES_DB=webapp \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=secret123 \
  postgres:15

# Run web application
docker run -d --name web-app \
  --network webapp-network \
  -p 8080:3000 \
  -e DATABASE_URL=postgresql://admin:secret123@postgres-db:5432/webapp \
  my-web-app:latest

# Application connects to database using hostname "postgres-db"
```

### Example 2: Load Balancer Setup

```bash
# Create network for load balanced setup
docker network create lb-network

# Run multiple web servers
docker run -d --name web1 --network lb-network nginx:latest
docker run -d --name web2 --network lb-network nginx:latest  
docker run -d --name web3 --network lb-network nginx:latest

# Run NGINX load balancer
docker run -d --name load-balancer \
  --network lb-network \
  -p 80:80 \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:latest
```

**nginx.conf for load balancing:**
```nginx
upstream backend {
    server web1:80;
    server web2:80;
    server web3:80;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Example 3: Microservices Communication

```bash
# Create microservices network
docker network create microservices

# User service
docker run -d --name user-service \
  --network microservices \
  -e SERVICE_NAME=user-service \
  my-user-service:latest

# Order service
docker run -d --name order-service \
  --network microservices \
  -e SERVICE_NAME=order-service \
  -e USER_SERVICE_URL=http://user-service:3000 \
  my-order-service:latest

# API Gateway
docker run -d --name api-gateway \
  --network microservices \
  -p 8080:80 \
  -e USER_SERVICE=http://user-service:3000 \
  -e ORDER_SERVICE=http://order-service:3000 \
  my-api-gateway:latest
```

## Port Mapping and Exposure

### Understanding Port Mapping

```plantuml
@startuml
!theme blueprint
title Port Mapping Flow

rectangle "Host Machine\n(Your Computer)" as host {
  rectangle "Port 8080" as host_port
}

rectangle "Docker Network" as network {
  rectangle "Container\nPort 80" as container_port
}

host_port --> network : -p 8080:80
network --> container_port : Port forwarding

note right of host_port : External access\nvia localhost:8080
note left of container_port : Internal service\nruns on port 80
@enduml
```

### Port Mapping Examples

```bash
# Map single port
docker run -d -p 8080:80 nginx:latest

# Map multiple ports
docker run -d -p 8080:80 -p 8443:443 nginx:latest

# Map to specific host interface
docker run -d -p 127.0.0.1:8080:80 nginx:latest

# Map random host port
docker run -d -P nginx:latest

# Check port mappings
docker port container-name
```

### EXPOSE vs Publish

```dockerfile
# Dockerfile
EXPOSE 80 443
# Documents which ports the container uses
# Doesn't actually publish ports

# Runtime publishing
docker run -d -p 8080:80 my-app
# Actually maps host port 8080 to container port 80
```

## Network Isolation and Security

### Network Segmentation

```bash
# Frontend network
docker network create frontend-network

# Backend network  
docker network create backend-network

# Database network
docker network create database-network

# Web server - only on frontend
docker run -d --name web \
  --network frontend-network \
  -p 80:80 nginx:latest

# API server - on both frontend and backend
docker run -d --name api \
  --network frontend-network \
  my-api:latest
docker network connect backend-network api

# Database - only on backend
docker run -d --name db \
  --network backend-network \
  postgres:15

# Result: web can reach api, api can reach db, but web cannot reach db directly
```

### Internal Networks

```bash
# Create internal network (no external access)
docker network create --internal secure-network

# Containers on internal network cannot reach internet
docker run -d --name secure-app --network secure-network alpine
docker exec secure-app ping google.com  # This will fail
```

## Advanced Networking Concepts

### Custom DNS Resolution

```bash
# Run container with custom hostname
docker run -d --name web --hostname webserver nginx:latest

# Add DNS entries
docker run -d --name app \
  --add-host database:172.17.0.5 \
  --add-host cache:172.17.0.6 \
  my-app:latest

# Container can resolve 'database' and 'cache' to specified IPs
```

### Network Aliases

```bash
# Create network
docker network create app-network

# Run container with network alias
docker run -d --name postgres-primary \
  --network app-network \
  --network-alias database \
  --network-alias db \
  postgres:15

# Other containers can reach it via 'postgres-primary', 'database', or 'db'
```

### Static IP Assignment

```bash
# Create network with specific subnet
docker network create --subnet=172.20.0.0/16 static-network

# Run container with static IP
docker run -d --name web-server \
  --network static-network \
  --ip 172.20.0.10 \
  nginx:latest

# Container will always have IP 172.20.0.10 on this network
```

## Network Troubleshooting

### Common Networking Issues

#### Container Cannot Connect to Another Container
```bash
# Check if containers are on same network
docker inspect container1 | grep NetworkMode
docker inspect container2 | grep NetworkMode

# List container networks
docker network ls
docker network inspect bridge

# Test connectivity
docker exec container1 ping container2
docker exec container1 nslookup container2
```

#### Port Mapping Not Working
```bash
# Check port mappings
docker port container-name

# Verify service is running inside container
docker exec container-name netstat -tulpn

# Test from inside container
docker exec container-name curl http://localhost:80

# Check for port conflicts
sudo netstat -tulpn | grep :8080
```

#### DNS Resolution Problems
```bash
# Check DNS configuration
docker exec container-name cat /etc/resolv.conf

# Test DNS resolution
docker exec container-name nslookup other-container
docker exec container-name dig other-container

# Check network configuration
docker network inspect network-name
```

### Network Debugging Tools

```bash
# Run debug container with network tools
docker run -it --rm --network container:target-container \
  nicolaka/netshoot

# Or attach to existing container's network namespace
docker run -it --rm --pid container:target-container \
  --network container:target-container \
  --cap-add SYS_PTRACE \
  nicolaka/netshoot
```

### Monitoring Network Traffic

```bash
# Monitor network usage
docker stats container-name

# Capture network packets (requires privileged mode)
docker run -it --rm --net container:target-container \
  --privileged \
  nicolaka/netshoot tcpdump -i eth0
```

## Docker Compose Networking

### Automatic Network Creation

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
  
  api:
    image: my-api:latest
    
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: secret

# Compose automatically creates a network
# Services can reach each other by service name
# web -> http://api:3000
# api -> postgresql://db:5432
```

### Custom Networks in Compose

```yaml
version: '3.8'
services:
  web:
    image: nginx:latest
    networks:
      - frontend
      
  api:
    image: my-api:latest
    networks:
      - frontend
      - backend
      
  db:
    image: postgres:15
    networks:
      - backend
    environment:
      POSTGRES_PASSWORD: secret

networks:
  frontend:
    driver: bridge
  backend:
    internal: true  # No external access
```

## Best Practices for Docker Networking

### Development
- Use custom networks instead of default bridge
- Name containers descriptively for easy reference
- Use Docker Compose for multi-container applications

### Production
- Implement proper network segmentation
- Use internal networks for sensitive services
- Monitor network performance and security
- Document network topology

### Security
- Follow principle of least privilege
- Use internal networks for service-to-service communication
- Regularly audit network configurations
- Implement proper firewall rules

## Next Steps

With networking mastered, let's explore Docker Compose for orchestrating multi-container applications in the next lesson!

Key takeaways:
- Custom networks provide better isolation and communication
- Container names serve as hostnames within the same network
- Port mapping enables external access to containerized services
- Network segmentation improves security and organization

---
## References
- [Docker Networking Documentation](https://docs.docker.com/network/)
- [Network Security Best Practices](https://docs.docker.com/network/security/)
