# Base Template Setup Guide

This guide helps you create a reusable base template for all your Nuxt/TypeScript/Node 24 projects.

## Step 1: Create Base Template Directory

```bash
cd ~/Dev/playground
mkdir base-template
cd base-template
git init
```

## Step 2: Add Base Configuration Files

### package.json
```json
{
  "name": "nuxt-base-template",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/ui": "^2.0.0",
    "nuxt": "^4.0.0"
  },
  "devDependencies": {
    "@nuxt/typescript-build": "^3.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=24.0.0"
  }
}
```

### nuxt.config.ts
```typescript
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  typescript: {
    strict: true,
    typeCheck: true
  }
})
```

### tsconfig.json
```json
{
  "extends": "./.nuxt/tsconfig.json"
}
```

### .nvmrc (for Node version management)
```
24
```

### .gitignore
```
# Nuxt dev/build outputs
.output
.nuxt
.nitro
.cache
dist

# Node
node_modules
.pnp
.pnp.js

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea
.vscode
*.swp
*.swo
*~

# Env
.env
.env.local
.env.*.local
```

## Step 3: Initial Commit

```bash
git add .
git commit -m "Initial base template for Nuxt/TypeScript/Node 24"
```

## Step 4: Use the Scripts

Make scripts executable:
```bash
chmod +x ~/Dev/playground/Mermaider/scripts/*.sh
```

Create a new project:
```bash
~/Dev/playground/Mermaider/scripts/create-worktree.sh my-new-project
```

## Tips

1. **Keep base template minimal**: Only include truly shared configuration
2. **Project-specific overrides**: Each worktree can override base config
3. **Regular updates**: Update base template and merge changes to worktrees as needed
4. **Shared dependencies**: Consider using pnpm workspaces if you want to share node_modules
