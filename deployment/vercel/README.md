# Vercel Deployment Guide

Deploy ClaimSight's React frontend to Vercel with optimized performance and automatic CI/CD.

---

## 📋 Overview

**Vercel** is a cloud platform for deploying static sites and serverless functions, optimized for React, Next.js, and modern web frameworks.

**What gets deployed:**
- ✅ React frontend (Vite build)
- ✅ Static assets (optimized and CDN-distributed)
- ✅ Automatic HTTPS
- ✅ Preview deployments for every PR

**What you'll get:**
- Production URL: `https://your-app.vercel.app`
- Custom domain support: `https://app.claimsight.com`
- Automatic deployments on git push

**Time to complete:** 10-15 minutes

**Cost:** Free (100GB bandwidth/month, unlimited sites)

---

## 🎯 Prerequisites

- [x] Hasura deployed ([see guide](../hasura-cloud/README.md))
- [x] Gateway deployed (optional, for federation)
- [x] GitHub account with repo pushed
- [x] Vercel account (sign up at https://vercel.com/)

---

## 🚀 Step 1: Prepare Frontend for Production

### 1.1 Update GraphQL Endpoint Configuration

Edit `app/client/src/apollo/client.ts`:

```typescript
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// Use environment variable for GraphQL endpoint
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
});

// Auth link for Hasura
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage (if using JWT)
  const token = localStorage.getItem('authToken');

  return {
    headers: {
      ...headers,
      // Use JWT in production, admin secret for development only
      ...(token
        ? { authorization: `Bearer ${token}` }
        : { 'x-hasura-admin-secret': import.meta.env.VITE_HASURA_ADMIN_SECRET }
      ),
    },
  };
});

// Error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(`[GraphQL error]: Message: ${message}, Path: ${path}`)
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default client;
```

### 1.2 Create Environment Variable Example

Create `app/client/.env.example`:

```bash
# GraphQL Endpoint
VITE_GRAPHQL_ENDPOINT=https://your-gateway.onrender.com/graphql

# Hasura Admin Secret (DEVELOPMENT ONLY - Use JWT in production!)
VITE_HASURA_ADMIN_SECRET=your-secret-here

# Optional: Auth0 or other auth provider
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
```

### 1.3 Test Production Build Locally

```bash
cd app/client

# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:4173` and verify everything works.

---

## 🔗 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Easiest)

#### 2.1 Connect GitHub Repository

1. Visit https://vercel.com/
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub repo: `your-username/poc-has-apal`
5. Click **"Import"**

#### 2.2 Configure Build Settings

Vercel auto-detects Vite, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `app/client`
- **Build Command**: `npm run build` (or leave default)
- **Output Directory**: `dist` (or leave default)
- **Install Command**: `npm install` (or leave default)

#### 2.3 Add Environment Variables

In the "Environment Variables" section, add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_GRAPHQL_ENDPOINT` | `https://your-gateway.onrender.com/graphql` | Production |
| `VITE_HASURA_ADMIN_SECRET` | `your-admin-secret` | Development Preview |

**⚠️ Security Note:**
- Don't use admin secret in production! Use JWT authentication instead.
- For production, only set `VITE_GRAPHQL_ENDPOINT`
- Implement JWT authentication for secure production use

#### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll see: **"Your project has been successfully deployed!"**

Your app is now live at: `https://your-app.vercel.app`

---

### Option B: Deploy via Vercel CLI

#### 2.1 Install Vercel CLI (Optional)

**Recommended: Use npx (no installation needed)**
```bash
# Use npx directly - no installation needed
npx vercel --version
```

**Alternative: Install locally**
```bash
# Install locally in your project
npm install --save-dev vercel
```

#### 2.2 Login to Vercel

```bash
npx vercel login
```

Follow prompts to authenticate with GitHub/GitLab/email.

#### 2.3 Deploy

```bash
# Navigate to frontend directory
cd app/client

# First deployment (interactive)
npx vercel

# Follow prompts:
# - Set up and deploy: Yes
# - Scope: Your account
# - Link to existing project: No
# - Project name: claimsight
# - Directory: ./ (current)
# - Override settings: No

# For production deployment
npx vercel --prod
```

#### 2.4 Set Environment Variables via CLI

```bash
# Add environment variables
npx vercel env add VITE_GRAPHQL_ENDPOINT production
# Paste value when prompted: https://your-gateway.onrender.com/graphql

npx vercel env add VITE_HASURA_ADMIN_SECRET development
# Paste value when prompted: your-admin-secret

# Redeploy with new env vars
npx vercel --prod
```

---

## ✅ Step 3: Verify Deployment

### 3.1 Test GraphQL Connection

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Open browser DevTools → Network tab
3. Interact with app (load members, claims, etc.)
4. Verify GraphQL requests go to correct endpoint
5. Check response status: Should be `200 OK`

### 3.2 Test Key Features

- [ ] **Members list loads** from GraphQL API
- [ ] **Claims display** with nested provider data
- [ ] **Notes CRUD** works (create, read, update, delete)
- [ ] **Role switcher** changes permissions correctly
- [ ] **Eligibility check** action works (if handler deployed)
- [ ] **Provider ratings** display (if federation enabled)

### 3.3 Check Console for Errors

Open DevTools → Console. Should see:
```
✓ Apollo Client connected
✓ GraphQL queries successful
```

No CORS errors, no authentication errors.

---

## 🎨 Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain: `app.claimsight.com`
5. Click **"Add"**

### 4.2 Configure DNS

Vercel provides DNS instructions. Two options:

**Option A: CNAME Record (Subdomains)**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

**Option B: A Record (Root Domains)**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 4.3 Wait for DNS Propagation

- Takes 1-60 minutes depending on DNS provider
- Vercel auto-provisions SSL certificate
- Access your app at: `https://app.claimsight.com`

---

## 🔄 Step 5: Automatic Deployments

Vercel automatically deploys on every git push!

### 5.1 Production Deployments

```bash
# Make changes
git add .
git commit -m "Update homepage design"
git push origin main

# Vercel auto-deploys to production
# Visit: https://your-app.vercel.app
```

### 5.2 Preview Deployments (PRs)

1. Create a feature branch:
   ```bash
   git checkout -b feature/new-ui
   # Make changes
   git add .
   git commit -m "Add new UI component"
   git push origin feature/new-ui
   ```

2. Open Pull Request on GitHub

3. Vercel automatically:
   - Builds preview deployment
   - Comments on PR with preview URL: `https://your-app-git-feature-new-ui.vercel.app`
   - Runs build checks

4. Test preview before merging!

---

## 🛡️ Step 6: Security Configuration

### 6.1 Remove Admin Secret from Production

**Never expose admin secret in frontend!**

Update env vars:
1. Vercel dashboard → Project Settings → Environment Variables
2. Delete `VITE_HASURA_ADMIN_SECRET` from **Production**
3. Keep only in **Development** and **Preview**
4. Update `apollo/client.ts` to use JWT tokens in production

### 6.2 Configure Content Security Policy

Add security headers in `vercel.json`:

Create `app/client/vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

Redeploy for changes to take effect.

### 6.3 Enable HTTPS Redirect

Already enabled by default! Vercel auto-redirects HTTP → HTTPS.

---

## 📊 Step 7: Analytics and Monitoring

### 7.1 Enable Vercel Analytics

1. In project dashboard, click **"Analytics"** tab
2. Click **"Enable Analytics"**
3. Add Vercel Analytics script (optional for detailed metrics)

Install in your app:
```bash
cd app/client
npm install @vercel/analytics
```

Add to `main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
      <Analytics />
    </ApolloProvider>
  </StrictMode>
);
```

### 7.2 View Deployment Logs

1. Go to project dashboard
2. Click **"Deployments"** tab
3. Click any deployment
4. View:
   - Build logs
   - Runtime logs (if using serverless functions)
   - Deployment duration
   - Bundle size

### 7.3 Monitor Performance

In Analytics tab, see:
- **Real User Metrics** (Web Vitals)
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
- **Page views**
- **Visitors (Pro plan)**

---

## 🚀 Step 8: Optimize Performance

### 8.1 Enable Code Splitting

Already enabled with Vite! Verify in build output:
```
dist/assets/index-abc123.js    45.2 kB
dist/assets/vendor-xyz789.js   120.3 kB
```

### 8.2 Optimize Images

Use Vercel Image Optimization (automatic for `<img>` tags).

Or install `next/image` equivalent for Vite:
```bash
npm install vite-plugin-image-optimizer
```

### 8.3 Enable Compression

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer(),
  ],
  build: {
    // Enable minification
    minify: 'terser',
    // Generate source maps for production debugging
    sourcemap: true,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
});
```

### 8.4 Review Bundle Size

```bash
npm run build

# Analyze bundle
npx vite-bundle-visualizer
```

Look for:
- Large dependencies (can they be lazy-loaded?)
- Duplicate dependencies
- Unused code

---

## ✅ Success Checklist

- [ ] Frontend builds successfully locally
- [ ] Environment variables configured correctly
- [ ] Deployed to Vercel (production URL works)
- [ ] GraphQL endpoint accessible from frontend
- [ ] All key features tested and working
- [ ] Admin secret removed from production env
- [ ] Custom domain configured (optional)
- [ ] Automatic deployments enabled
- [ ] Preview deployments working for PRs
- [ ] Security headers configured
- [ ] Analytics enabled
- [ ] Performance optimized

---

## 🚀 Next Steps

### You've completed the Quick Start path!

**What you have now:**
- ✅ Hasura Cloud (database + GraphQL)
- ✅ React frontend on Vercel
- ✅ Automatic CI/CD

**To enable full federation:**
1. Deploy Providers subgraph ([Render guide](../render/README.md))
2. Deploy Apollo Gateway ([Render guide](../render/README.md))
3. Set up Apollo GraphOS ([Apollo guide](../apollo-graphos/README.md))
4. Update `VITE_GRAPHQL_ENDPOINT` to point to gateway

---

## 🔧 Troubleshooting

### Issue: Build fails with "Module not found"

**Cause:** Missing dependencies or incorrect import paths.

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Verify imports are correct
npm run build
```

### Issue: "CORS error" when querying GraphQL

**Cause:** Hasura not configured to allow Vercel domain.

**Solution:**
1. In Hasura Cloud → Project Settings → Env Vars
2. Update `HASURA_GRAPHQL_CORS_DOMAIN`:
   ```
   https://your-app.vercel.app, http://localhost:3000
   ```
3. Save and wait for Hasura to restart

### Issue: Environment variables not working

**Cause:** Env vars not prefixed with `VITE_` or deployment not redeployed.

**Solution:**
1. Ensure all env vars start with `VITE_` (Vite requirement)
2. After changing env vars in Vercel, redeploy:
   ```bash
   vercel --prod
   ```

### Issue: App loads but GraphQL queries fail

**Cause:** Incorrect `VITE_GRAPHQL_ENDPOINT` or authentication issue.

**Solution:**
1. Check env var value in Vercel dashboard
2. Test endpoint directly:
   ```bash
   curl -X POST https://your-endpoint/graphql \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __typename }"}'
   ```
3. Verify admin secret or JWT token is correct

### Issue: Preview deployments not showing up on PRs

**Cause:** Vercel GitHub integration not configured.

**Solution:**
1. Go to Vercel dashboard → Settings → Git
2. Ensure GitHub app is installed and has repo access
3. Enable "Automatic deployments for all branches"

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Apollo Client + Vercel](https://www.apollographql.com/docs/react/deployment/vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Vercel deployment complete!** 🎉

Your React app is now live at `https://your-app.vercel.app`

Users can access ClaimSight from anywhere in the world with automatic HTTPS, CDN distribution, and sub-second page loads!
