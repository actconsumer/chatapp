# Azure Deployment Guide for Project Chat Backend

This guide explains how to deploy the Project Chat backend to Microsoft Azure using Infrastructure as Code.

## Prerequisites

- Azure CLI installed (`az`)
- Active Azure subscription
- Azure PowerShell (optional)

## Deployment Options

1. **Azure Portal** - Manual deployment via web interface
2. **Azure CLI** - Command-line deployment
3. **ARM Templates** - Infrastructure as Code
4. **GitHub Actions** - Automated CI/CD

---

## Option 1: Azure CLI Quick Deployment

### Step 1: Login to Azure

```bash
az login
az account set --subscription "Your-Subscription-Name"
```

### Step 2: Create Resource Group

```bash
az group create \
  --name project-chat-rg \
  --location eastus
```

### Step 3: Create Azure Cosmos DB

```bash
az cosmosdb create \
  --name project-chat-cosmosdb \
  --resource-group project-chat-rg \
  --kind GlobalDocumentDB \
  --locations regionName=eastus failoverPriority=0 \
  --default-consistency-level Session \
  --enable-automatic-failover true

# Get connection string
az cosmosdb keys list \
  --name project-chat-cosmosdb \
  --resource-group project-chat-rg \
  --type connection-strings
```

### Step 4: Create Azure Storage Account

```bash
az storage account create \
  --name projectchatstorage \
  --resource-group project-chat-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name projectchatstorage \
  --resource-group project-chat-rg
```

### Step 5: Create Azure Redis Cache

```bash
az redis create \
  --name project-chat-redis \
  --resource-group project-chat-rg \
  --location eastus \
  --sku Basic \
  --vm-size c0

# Get access keys
az redis list-keys \
  --name project-chat-redis \
  --resource-group project-chat-rg
```

### Step 6: Create App Service Plan

```bash
az appservice plan create \
  --name project-chat-plan \
  --resource-group project-chat-rg \
  --location eastus \
  --sku B1 \
  --is-linux
```

### Step 7: Create Web App

```bash
az webapp create \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --plan project-chat-plan \
  --runtime "NODE|18-lts"
```

### Step 8: Configure Environment Variables

```bash
az webapp config appsettings set \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    COSMOS_ENDPOINT="https://project-chat-cosmosdb.documents.azure.com:443/" \
    COSMOS_KEY="your-cosmos-key" \
    COSMOS_DATABASE_NAME="ProjectChatDB" \
    AZURE_STORAGE_CONNECTION_STRING="your-storage-connection-string" \
    REDIS_HOST="project-chat-redis.redis.cache.windows.net" \
    REDIS_PORT=6380 \
    REDIS_PASSWORD="your-redis-password" \
    REDIS_TLS_ENABLED=true \
    JWT_SECRET="your-super-secret-jwt-key-min-32-chars" \
    JWT_REFRESH_SECRET="your-refresh-secret-key"
```

### Step 9: Deploy Code

```bash
# Method 1: Deploy from local Git
cd backend
git init
git add .
git commit -m "Initial commit"
az webapp deployment source config-local-git \
  --name project-chat-api \
  --resource-group project-chat-rg

git remote add azure <deployment-url>
git push azure main

# Method 2: Deploy from ZIP
npm run build
zip -r deploy.zip dist package.json package-lock.json
az webapp deployment source config-zip \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --src deploy.zip
```

---

## Option 2: ARM Template Deployment

Use the provided `azure-resources.json` ARM template:

```bash
az deployment group create \
  --name project-chat-deployment \
  --resource-group project-chat-rg \
  --template-file azure-resources.json \
  --parameters azure-parameters.json
```

---

## Option 3: GitHub Actions CI/CD

### Step 1: Setup Azure Service Principal

```bash
az ad sp create-for-rbac \
  --name "project-chat-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/project-chat-rg \
  --sdk-auth
```

Copy the JSON output.

### Step 2: Configure GitHub Secrets

Go to GitHub repository → Settings → Secrets → Add the following:

- `AZURE_CREDENTIALS` - JSON from step 1
- `AZURE_WEBAPP_NAME` - project-chat-api
- `AZURE_RESOURCE_GROUP` - project-chat-rg

### Step 3: Push Code

GitHub Actions will automatically deploy on push to `main` branch.

---

## Scaling Configuration

### Enable Autoscaling

```bash
az monitor autoscale create \
  --resource-group project-chat-rg \
  --resource project-chat-api \
  --resource-type Microsoft.Web/serverFarms \
  --name project-chat-autoscale \
  --min-count 1 \
  --max-count 10 \
  --count 2

az monitor autoscale rule create \
  --resource-group project-chat-rg \
  --autoscale-name project-chat-autoscale \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1
```

### Configure Application Insights

```bash
az monitor app-insights component create \
  --app project-chat-insights \
  --location eastus \
  --resource-group project-chat-rg \
  --application-type web

# Get instrumentation key
az monitor app-insights component show \
  --app project-chat-insights \
  --resource-group project-chat-rg \
  --query instrumentationKey
```

---

## Monitoring & Diagnostics

### Enable Application Logging

```bash
az webapp log config \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --application-logging filesystem \
  --level information
```

### View Logs

```bash
az webapp log tail \
  --name project-chat-api \
  --resource-group project-chat-rg
```

---

## Cost Optimization Tips

1. **Start with Basic SKUs** - Upgrade as needed
2. **Enable Autoscaling** - Scale down during low traffic
3. **Use Reserved Instances** - For predictable workloads
4. **Monitor with Cost Management** - Set budget alerts

---

## Security Checklist

- ✅ Enable HTTPS only
- ✅ Use Managed Identity for Azure services
- ✅ Store secrets in Azure Key Vault
- ✅ Enable DDoS protection
- ✅ Configure firewall rules
- ✅ Enable audit logging
- ✅ Regular security scans

---

## Troubleshooting

### Check Web App Status

```bash
az webapp show \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --query state
```

### Restart Web App

```bash
az webapp restart \
  --name project-chat-api \
  --resource-group project-chat-rg
```

### View Application Logs

```bash
az webapp log download \
  --name project-chat-api \
  --resource-group project-chat-rg \
  --log-file app-logs.zip
```

---

## Cleanup Resources

To delete all resources:

```bash
az group delete \
  --name project-chat-rg \
  --yes \
  --no-wait
```
