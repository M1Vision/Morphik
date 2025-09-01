# 🚀 Deployment Guide: Sica Frontend + Morphik MCP to Vercel

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Vercel account  
- ✅ Morphik credentials (Owner ID: `a4ca1539-c3f5-4a27-ba45-338056a7c08f`)
- ✅ AI API keys (OpenAI, Anthropic, Groq, etc.)

## 🔧 Step 1: Prepare Your Local Repository

### 1.1 Initialize Git (if not already done)
```bash
cd "Sica Frontend"
git init
git add .
git commit -m "Initial commit: Sica Frontend with Morphik MCP integration"
```

### 1.2 Create .gitignore (if not exists)
```bash
# Create .gitignore file
echo "# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
.next/
out/
build/
dist/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel" > .gitignore
```

## 🔗 Step 2: Use Your Existing GitHub Repository

### 2.1 Your Repository
- **Repository name**: `morphik` (already exists)
- **Current remote**: `https://github.com/idosal/scira-mcp-ui-chat.git`
- **New remote**: `https://github.com/idosal/morphik.git`

### 2.2 Update Remote (if needed)
If you want to use your `morphik` repo instead of the current one:
```bash
# Remove current remote
git remote remove origin

# Add your morphik repo as remote
git remote add origin https://github.com/idosal/morphik.git
```

## 📤 Step 3: Push to GitHub

### 3.1 Choose Your Repository

**Option A: Use your existing `morphik` repo (Recommended)**
```bash
# Switch to your morphik repo
git remote remove origin
git remote add origin https://github.com/idosal/morphik.git

# Push to morphik repo
git push -u origin main
```

**Option B: Keep current `scira-mcp-ui-chat` repo**
```bash
# Just push to current repo
git push origin main
```

## 🚀 Step 4: Deploy on Vercel

### 4.1 Connect Vercel to GitHub
- Go to [vercel.com](https://vercel.com)
- Click **"New Project"**
- Import your GitHub repository: `morphik` (your existing repo)
- Click **"Import"**

### 4.2 Configure Project
- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (should auto-detect)
- **Output Directory**: `.next` (should auto-detect)
- Click **"Deploy"**

### 4.3 Add Environment Variables
After deployment, go to **Settings** → **Environment Variables** and add:

```env
# Morphik Configuration
MORPHIK_OWNER_ID=a4ca1539-c3f5-4a27-ba45-338056a7c08f
MORPHIK_TOKEN=your_actual_morphik_token_here
MORPHIK_URI=morphik://a4ca1539-c3f5-4a27-ba45-338056a7c08f:your_token@api.morphik.ai

# MCP Server Authentication
MCP_AUTH_TOKEN=your_secure_random_token_123456789

# AI API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### 4.4 Redeploy
- Go to **Deployments** tab
- Click **"Redeploy"** on your latest deployment
- This ensures environment variables are loaded

## 🧪 Step 5: Test Your Deployment

### 5.1 Test MCP Server
Your MCP server will be available at:
```
https://your-project.vercel.app/api/mcp
```

### 5.2 Test Morphik Integration
- Open your deployed app
- Try using the chat interface
- The MCP server should connect to Morphik automatically

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check Vercel build logs
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

2. **Environment Variables Not Working**
   - Double-check variable names in Vercel
   - Redeploy after adding variables
   - Check for typos

3. **MCP Server Not Responding**
   - Verify `MCP_AUTH_TOKEN` is set
   - Check Vercel function logs
   - Ensure CORS headers are correct

4. **Morphik Connection Issues**
   - Verify `MORPHIK_URI` format
   - Check Morphik credentials
   - Ensure Morphik server is accessible

## 📚 What You Get After Deployment

✅ **Live Chat Interface** with AI models  
✅ **Morphik MCP Server** accessible via HTTP  
✅ **Semantic Search** across your knowledge base  
✅ **Image Support** via ColPali visual understanding  
✅ **Secure Authentication** with Bearer tokens  
✅ **Scalable Infrastructure** on Vercel  

## 🔄 Continuous Deployment

- Every push to `main` branch automatically deploys
- Environment variables persist across deployments
- Easy rollback to previous versions

## 🎯 Next Steps After Deployment

1. **Test all AI models** in the chat interface
2. **Ingest documents** into Morphik
3. **Test semantic search** functionality
4. **Verify image display** works correctly
5. **Configure Cursor/Claude** to use your MCP server

---

**🎉 Congratulations!** You'll have a production-ready AI chat interface with full Morphik integration!
