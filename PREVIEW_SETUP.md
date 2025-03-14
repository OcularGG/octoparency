# Setting Up a Preview Environment

This guide explains how to set up a separate preview/testing environment for BattleTab.

## Prerequisites

1. A GitHub account with your BattleTab repository
2. A Vercel account connected to GitHub
3. A new Supabase project for your preview environment

## Step 1: Create a Testing Supabase Project

1. Log in to [Supabase](https://app.supabase.com)
2. Click "New Project"
3. Name it something like "battletab-preview" or "battletab-staging"
4. Set up the same database schema as your production database:
   - Copy the SQL from `SETUP_SUPABASE.md`
   - Execute it in the SQL Editor of your new project

## Step 2: Configure Environment Variables in Vercel

1. Go to your project in Vercel
2. Click on "Settings" → "Environment Variables"
3. Add these variables:
   - `NEXT_PUBLIC_PREVIEW_SUPABASE_URL`: Your preview Supabase project URL
   - `NEXT_PUBLIC_PREVIEW_SUPABASE_ANON_KEY`: Your preview Supabase anon key
   - `NEXT_PUBLIC_IS_PREVIEW`: Set to `true` for preview branches

4. Under "Environment Variable Overrides" section:
   - Click "Add New"
   - Select "Preview" as the environment
   - Add `NEXT_PUBLIC_IS_PREVIEW` with value `true`

## Step 3: Set Up Branch Previews

1. Make sure you've pushed the latest `vercel.json` to your repository
2. In Vercel, go to your project settings → Git
3. Enable "Preview deployments"
4. Configure branch patterns if needed

## Step 4: Test Your Setup

1. Create a new branch in your repository: `git checkout -b test-preview`
2. Make a small change, commit, and push to GitHub
3. Vercel will automatically create a preview deployment
4. Check the deployment URL to verify it's using the preview database

## Accessing Preview Deployments

Every pull request and branch push will create a unique URL like:
`https://battletab-git-your-branch-name-yourusername.vercel.app`

This URL will automatically use the preview Supabase database, allowing you to test changes safely before merging to production.

## Local Development with Preview DB

To use the preview database during local development:

1. Create a `.env.local` file in your project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-preview-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-preview-anon-key
   NEXT_PUBLIC_IS_PREVIEW=true
   ```

2. Start your local development server
