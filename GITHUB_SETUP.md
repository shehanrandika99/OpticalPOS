# GitHub Repository Setup Guide

## Step 1: Add all files to Git

```bash
git add .
```

## Step 2: Commit your changes

```bash
git commit -m "Initial commit: Invoice Management System with User, Product, and Reports"
```

## Step 3: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Enter repository name (e.g., `invoice-management-system`)
5. Choose Public or Private
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 4: Add GitHub Remote

After creating the repository, GitHub will show you commands. Use these:

```bash
# Replace YOUR_USERNAME and REPO_NAME with your actual values
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

Or if you prefer SSH:
```bash
git remote add origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

## Step 5: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

## Important Notes:

1. **Environment Variables**: Make sure `.env.local` is in `.gitignore` (it already is)
2. **Database URL**: Never commit your database credentials
3. **JWT Secret**: Keep your JWT_SECRET secure

## If you need to update later:

```bash
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting:

If you get authentication errors:
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys for GitHub

