---
title: "ConfigMaps and Secrets"
date: 2026-02-17
author: "Learning Never Ends"
excerpt: "Master Kubernetes ConfigMaps and Secrets for secure and flexible application configuration management across different environments."
tags: ["kubernetes", "configmaps", "secrets", "configuration", "security"]
---

# ConfigMaps and Secrets

Hardcoding configuration in your containers is a recipe for disaster! What happens when you need different database URLs for development and production? How do you handle API keys securely? Enter **ConfigMaps** and **Secrets** - Kubernetes' solution for flexible and secure configuration management.

## The Configuration Problem

### Traditional Approaches (Don't Do This!)

```dockerfile
# BAD: Hardcoded in Dockerfile
ENV DATABASE_URL=mysql://user:pass@localhost:3306/app
ENV API_KEY=sk_live_abc123xyz789
ENV DEBUG_MODE=false
```

**Problems:**
- Same image can't work in different environments
- Secrets visible in image layers
- Need to rebuild images for config changes
- No way to rotate secrets easily

### The Kubernetes Way 

```yaml
# ConfigMap for non-sensitive data
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config
data:
 database_url: "mysql://user@db-service:3306/app"
 debug_mode: "false"
 max_connections: "100"
---
# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
 name: app-secrets
type: Opaque
data:
 api_key: c2tfbGl2ZV9hYmMxMjN4eXo3ODk= # base64 encoded
 db_password: c3VwZXJzZWNyZXQ= # base64 encoded
```

## Understanding ConfigMaps 

**ConfigMaps** store non-sensitive configuration data as key-value pairs.

### ConfigMap Creation Methods

#### Method 1: From Literal Values

```bash
# Create from command line
kubectl create configmap app-config \
 --from-literal=database_host=mysql-service \
 --from-literal=database_port=3306 \
 --from-literal=debug_mode=true \
 --from-literal=max_connections=100
```

#### Method 2: From Files

```bash
# Create config file
cat > app.properties << EOF
database.host=mysql-service
database.port=3306
debug.mode=true
max.connections=100
cache.ttl=3600
EOF

# Create ConfigMap from file
kubectl create configmap app-config --from-file=app.properties
```

#### Method 3: From Directory

```bash
# Create config directory
mkdir config/
echo "mysql-service" > config/database_host
echo "3306" > config/database_port
echo "true" > config/debug_mode

# Create ConfigMap from directory
kubectl create configmap app-config --from-file=config/
```

#### Method 4: YAML Manifest

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config
 namespace: default
data:
 # Simple key-value pairs
 database_host: "mysql-service"
 database_port: "3306"
 debug_mode: "true"
 
 # File content
 app.properties: |
 database.host=mysql-service
 database.port=3306
 debug.mode=true
 max.connections=100
 
 # JSON configuration
 database.json: |
 {
 "host": "mysql-service",
 "port": 3306,
 "database": "myapp",
 "pool": {
 "min": 5,
 "max": 20
 }
 }
```

## Understanding Secrets

**Secrets** store sensitive information like passwords, tokens, and certificates.

### Secret Types

| Type | Purpose | Example Use Case |
|------|---------|------------------|
| `Opaque` | Generic secrets | API keys, passwords |
| `kubernetes.io/dockerconfigjson` | Docker registry | Private image pulls |
| `kubernetes.io/tls` | TLS certificates | HTTPS endpoints |
| `kubernetes.io/service-account-token` | Service account | Pod authentication |

### Secret Creation Methods

#### Method 1: From Literal Values

```bash
kubectl create secret generic app-secrets \
 --from-literal=api_key=sk_live_abc123xyz789 \
 --from-literal=db_password=supersecret \
 --from-literal=jwt_secret=my-super-secret-jwt-key
```

#### Method 2: From Files

```bash
# Create secret files
echo -n "sk_live_abc123xyz789" > api_key.txt
echo -n "supersecret" > db_password.txt

kubectl create secret generic app-secrets \
 --from-file=api_key=api_key.txt \
 --from-file=db_password=db_password.txt
```

#### Method 3: YAML Manifest (Base64 Encoded)

```yaml
apiVersion: v1
kind: Secret
metadata:
 name: app-secrets
type: Opaque
data:
 # Values must be base64 encoded
 api_key: c2tfbGl2ZV9hYmMxMjN4eXo3ODk= # sk_live_abc123xyz789
 db_password: c3VwZXJzZWNyZXQ= # supersecret
 jwt_secret: bXktc3VwZXItc2VjcmV0LWp3dC1rZXk= # my-super-secret-jwt-key
```

#### Method 4: YAML with String Data (No Encoding Needed)

```yaml
apiVersion: v1
kind: Secret
metadata:
 name: app-secrets
type: Opaque
stringData: # No base64 encoding required
 api_key: "sk_live_abc123xyz789"
 db_password: "supersecret" 
 jwt_secret: "my-super-secret-jwt-key"
```

### Encoding/Decoding Base64

```bash
# Encode
echo -n "supersecret" | base64
# Output: c3VwZXJzZWNyZXQ=

# Decode
echo "c3VwZXJzZWNyZXQ=" | base64 --decode
# Output: supersecret
```

## Using ConfigMaps and Secrets 

### Method 1: Environment Variables

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
 name: webapp
spec:
 replicas: 3
 selector:
 matchLabels:
 app: webapp
 template:
 metadata:
 labels:
 app: webapp
 spec:
 containers:
 - name: webapp
 image: myapp:1.0
 env:
 # Individual ConfigMap values
 - name: DATABASE_HOST
 valueFrom:
 configMapKeyRef:
 name: app-config
 key: database_host
 
 - name: DATABASE_PORT
 valueFrom:
 configMapKeyRef:
 name: app-config
 key: database_port
 
 # Individual Secret values
 - name: API_KEY
 valueFrom:
 secretKeyRef:
 name: app-secrets
 key: api_key
 
 - name: DB_PASSWORD
 valueFrom:
 secretKeyRef:
 name: app-secrets
 key: db_password
 
 # All ConfigMap keys as env vars
 envFrom:
 - configMapRef:
 name: app-config
 
 # All Secret keys as env vars 
 - secretRef:
 name: app-secrets
```

### Method 2: Volume Mounts (Files)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
 name: webapp
spec:
 replicas: 2
 selector:
 matchLabels:
 app: webapp
 template:
 metadata:
 labels:
 app: webapp
 spec:
 containers:
 - name: webapp
 image: myapp:1.0
 volumeMounts:
 # Mount ConfigMap as files
 - name: config-volume
 mountPath: "/etc/config"
 readOnly: true
 
 # Mount specific ConfigMap keys
 - name: app-properties
 mountPath: "/etc/app"
 readOnly: true
 
 # Mount Secret as files
 - name: secret-volume
 mountPath: "/etc/secrets"
 readOnly: true
 
 volumes:
 # ConfigMap volume
 - name: config-volume
 configMap:
 name: app-config
 
 # Specific ConfigMap keys
 - name: app-properties
 configMap:
 name: app-config
 items:
 - key: app.properties
 path: application.properties
 - key: database.json
 path: db-config.json
 
 # Secret volume
 - name: secret-volume
 secret:
 secretName: app-secrets
 defaultMode: 0600 # Read-write for owner only
```

### File Structure After Mounting

```bash
# Inside the container:
/etc/config/
├── database_host # Contains: mysql-service
├── database_port # Contains: 3306
├── debug_mode # Contains: true
├── app.properties # Contains: full properties file
└── database.json # Contains: JSON configuration

/etc/app/
├── application.properties # Renamed from app.properties
└── db-config.json # Renamed from database.json

/etc/secrets/
├── api_key # Contains: sk_live_abc123xyz789
├── db_password # Contains: supersecret
└── jwt_secret # Contains: my-super-secret-jwt-key
```

## Advanced Configuration Patterns 

### Multi-Environment Configuration

```yaml
# Development ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config-dev
 namespace: development
data:
 database_host: "dev-mysql-service"
 debug_mode: "true"
 log_level: "DEBUG"
 cache_enabled: "false"
---
# Production ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config-prod
 namespace: production
data:
 database_host: "prod-mysql-service"
 debug_mode: "false" 
 log_level: "INFO"
 cache_enabled: "true"
---
# Staging ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config-staging
 namespace: staging
data:
 database_host: "staging-mysql-service"
 debug_mode: "false"
 log_level: "WARN"
 cache_enabled: "true"
```

### Configuration Hot Reload

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
 name: webapp
spec:
 template:
 metadata:
 annotations:
 # Forces pod restart when ConfigMap changes
 configmap/checksum: "{{ checksum .Values.configMap }}"
 spec:
 containers:
 - name: webapp
 image: myapp:1.0
 volumeMounts:
 - name: config
 mountPath: "/etc/config"
 # Application that watches file changes
 command: ["/app/start.sh"]
 args: ["--config-watch", "/etc/config/app.yaml"]
 volumes:
 - name: config
 configMap:
 name: app-config
```

### Immutable ConfigMaps and Secrets

```yaml
# Prevents accidental changes
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config
immutable: true
data:
 database_host: "mysql-service"
 database_port: "3306"
---
apiVersion: v1
kind: Secret
metadata:
 name: app-secrets
type: Opaque
immutable: true
stringData:
 api_key: "sk_live_abc123xyz789"
```

## Security Best Practices 🔒

### ConfigMap Security

```yaml
# Good: Non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
 name: app-config
data:
 server_port: "8080"
 log_level: "INFO"
 cache_ttl: "3600"
 # BAD: Don't put secrets here!
 # database_password: "secret123" # Visible in plaintext
```

### Secret Security

```yaml
# Good: Proper secret handling
apiVersion: v1
kind: Secret
metadata:
 name: app-secrets
type: Opaque
stringData:
 database_password: "complex-secure-password-123!"
 api_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 ssl_cert: |
 -----BEGIN CERTIFICATE-----
 MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV...
 -----END CERTIFICATE-----
```

### RBAC for Secrets

```yaml
# Restrict secret access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
 namespace: default
 name: secret-reader
rules:
- apiGroups: [""]
 resources: ["secrets"]
 resourceNames: ["app-secrets"] # Only this specific secret
 verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
 name: read-secrets
 namespace: default
subjects:
- kind: ServiceAccount
 name: webapp-sa
 namespace: default
roleRef:
 kind: Role
 name: secret-reader
 apiGroup: rbac.authorization.k8s.io
```

## Real-World Example: Complete Web Application

```yaml
# ConfigMap for application settings
apiVersion: v1
kind: ConfigMap
metadata:
 name: webapp-config
data:
 # Server configuration
 server.port: "8080"
 server.host: "0.0.0.0"
 
 # Database configuration
 db.host: "postgres-service"
 db.port: "5432"
 db.name: "webapp"
 
 # Application settings
 app.name: "My Web Application"
 app.version: "1.2.3"
 app.environment: "production"
 log.level: "INFO"
 
 # Feature flags
 features.new_ui: "true"
 features.analytics: "true"
 features.cache: "true"
 
 # Complete config file
 application.yaml: |
 server:
 port: 8080
 host: 0.0.0.0
 database:
 host: postgres-service
 port: 5432
 name: webapp
 pool:
 min: 5
 max: 20
 logging:
 level: INFO
 format: json
 features:
 newUI: true
 analytics: true
 cache: true
---
# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
 name: webapp-secrets
type: Opaque
stringData:
 # Database credentials
 db.username: "webapp_user"
 db.password: "super-secure-db-password-2024!"
 
 # API keys
 stripe.api_key: "sk_live_51234567890abcdef"
 sendgrid.api_key: "SG.1234567890abcdef.ghijklmnopqrstuvwxyz"
 
 # JWT secrets
 jwt.secret: "ultra-secure-jwt-signing-key-2024"
 
 # SSL certificates
 ssl.cert: |
 -----BEGIN CERTIFICATE-----
 MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBBQUAMEUxCzAJBgNV...
 -----END CERTIFICATE-----
 ssl.key: |
 -----BEGIN PRIVATE KEY-----
 MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB...
 -----END PRIVATE KEY-----
---
# Deployment using both ConfigMap and Secret
apiVersion: apps/v1
kind: Deployment
metadata:
 name: webapp
spec:
 replicas: 3
 selector:
 matchLabels:
 app: webapp
 template:
 metadata:
 labels:
 app: webapp
 spec:
 containers:
 - name: webapp
 image: webapp:1.2.3
 ports:
 - containerPort: 8080
 
 # Environment variables from ConfigMap
 env:
 - name: SERVER_PORT
 valueFrom:
 configMapKeyRef:
 name: webapp-config
 key: server.port
 - name: DB_HOST
 valueFrom:
 configMapKeyRef:
 name: webapp-config
 key: db.host
 - name: APP_NAME
 valueFrom:
 configMapKeyRef:
 name: webapp-config
 key: app.name
 
 # Environment variables from Secret
 - name: DB_USERNAME
 valueFrom:
 secretKeyRef:
 name: webapp-secrets
 key: db.username
 - name: DB_PASSWORD
 valueFrom:
 secretKeyRef:
 name: webapp-secrets
 key: db.password
 - name: STRIPE_API_KEY
 valueFrom:
 secretKeyRef:
 name: webapp-secrets
 key: stripe.api_key
 
 # Mount config files
 volumeMounts:
 - name: config-volume
 mountPath: "/etc/webapp/config"
 readOnly: true
 - name: secret-volume
 mountPath: "/etc/webapp/secrets"
 readOnly: true
 
 # Health checks
 livenessProbe:
 httpGet:
 path: /health
 port: 8080
 initialDelaySeconds: 30
 periodSeconds: 10
 
 readinessProbe:
 httpGet:
 path: /ready
 port: 8080
 initialDelaySeconds: 5
 periodSeconds: 5
 
 volumes:
 - name: config-volume
 configMap:
 name: webapp-config
 - name: secret-volume
 secret:
 secretName: webapp-secrets
 defaultMode: 0600
```

## Management Commands 

### ConfigMap Operations

```bash
# Create ConfigMap
kubectl create configmap my-config --from-literal=key=value

# View ConfigMaps
kubectl get configmaps
kubectl describe configmap my-config

# Edit ConfigMap
kubectl edit configmap my-config

# Delete ConfigMap
kubectl delete configmap my-config

# Export ConfigMap
kubectl get configmap my-config -o yaml > my-config.yaml
```

### Secret Operations

```bash
# Create Secret
kubectl create secret generic my-secret --from-literal=password=secret123

# View Secrets (values are hidden)
kubectl get secrets
kubectl describe secret my-secret

# View Secret values (decoded)
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 --decode

# Edit Secret
kubectl edit secret my-secret

# Delete Secret
kubectl delete secret my-secret
```

### Troubleshooting

```bash
# Check if ConfigMap/Secret exists
kubectl get configmaps,secrets

# Verify pod can access configuration
kubectl exec -it <pod-name> -- env | grep DATABASE
kubectl exec -it <pod-name> -- cat /etc/config/app.properties

# Check volume mounts
kubectl describe pod <pod-name> | grep -A 10 Mounts

# Debug configuration issues
kubectl logs <pod-name> | grep -i config
kubectl get events --field-selector involvedObject.name=<pod-name>
```

## Key Takeaways 

 **ConfigMaps** for non-sensitive configuration data
 **Secrets** for sensitive information (passwords, tokens, certificates)
 Use **environment variables** for simple key-value configuration
 Use **volume mounts** for file-based configuration
 **Separate configuration by environment** (dev, staging, prod)
 **Never hardcode secrets** in container images
 Use **RBAC** to control access to sensitive secrets

## What's Next? 

Fantastic work! You now know how to manage configuration and secrets securely in Kubernetes. In the next article, we'll explore **Scaling and Rolling Updates** - how to handle traffic spikes and deploy new versions of your applications without downtime.

You'll learn about:
- Horizontal and vertical pod autoscaling
- Rolling update strategies
- Blue-green deployments
- Canary releases
- Zero-downtime deployments

---

* **Security Tip**: Regularly rotate your secrets and use tools like Kubernetes External Secrets Operator or HashiCorp Vault for advanced secret management in production environments.*
