# Scripts Directory

This directory contains various utility scripts for testing and deployment.

## Structure

- `testing/` - Scripts for testing different components and systems
- `deployment/` - Scripts for deployment and environment management

## Environment Variables

All scripts require environment variables to be set. Never commit actual API keys or secrets to the repository.

## Usage

Make sure to have the required environment variables set before running any scripts:

```bash
export CLERK_SECRET_KEY="your_clerk_secret_key"
export NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
export DATABASE_URL="your_database_url"
```