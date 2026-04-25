#!/usr/bin/env bash

# UniSync Dev Environment Setup Script
# ------------------------------------
# Installs Node, pnpm, PostgreSQL, sets up the database,
# installs dependencies, runs Prisma migrations and seeds, starts dev server.

set -e

echo "🛠 Starting UniSync local dev environment setup..."

# 1️⃣ Check Node.js
if command -v node >/dev/null 2>&1; then
    echo "Node.js already installed: $(node -v)"
else
    echo "Installing Node.js 20 via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

# 2️⃣ Enable pnpm
corepack enable
corepack prepare pnpm@10.8.1 --activate
echo "pnpm version: $(pnpm -v)"

# 3️⃣ Check PostgreSQL
if command -v psql >/dev/null 2>&1; then
    echo "PostgreSQL already installed: $(psql --version)"
else
    echo "⚠️ PostgreSQL not found. Please install PostgreSQL 15+ manually."
    exit 1
fi

# 4️⃣ Create database (skip if exists)
DB_NAME="unisync"
DB_USER="postgres"
DB_PASS="postgres"

DB_EXISTS=$(psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -w $DB_NAME || true)
if [ "$DB_EXISTS" == "$DB_NAME" ]; then
    echo "Database $DB_NAME already exists."
else
    echo "Creating database $DB_NAME..."
    sudo -u $DB_USER psql -c "CREATE DATABASE $DB_NAME;"
fi

# 5️⃣ Install dependencies
pnpm install

# 6️⃣ Prisma generate
pnpm prisma generate

# 7️⃣ Prisma migrate
pnpm prisma migrate dev --name init

# 8️⃣ Seed database
pnpm prisma db seed

# 9️⃣ Start dev server
echo "Starting dev server..."
pnpm dev &

echo "
✅ UniSync setup complete!
- Frontend: http://localhost:3000
- API: http://localhost:4000/api
- Seeded accounts:
  - owner@lakeview.edu / Password123!
  - tutor@lakeview.edu / Password123!
"
