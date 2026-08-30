# SmartStock AI — Dashboard & ERP System

SmartStock AI is a Next.js-powered Enterprise Resource Planning (ERP) application with built-in Gemini AI intelligence layers for metrics summaries, inventory stock recommendations, and real-time operations assistant.

---

## 🛠️ Local Development (Option A)

To run the application locally on your host machine:

### 1. Prerequisites
- Node.js (v20 LTS recommended)
- A running PostgreSQL database instance (local or remote/Neon)

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your database credentials and Gemini API key:
```bash
cp .env.example .env
```

### 3. Initialize Database & Run Migrations
Run migrations using your database connection configured in `.env`:
```bash
npx tsx scripts/run-migration.ts
```

### 4. Install Dependencies & Start Server
```bash
npm install
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🐳 Docker Setup & Containerization (Option B)

This project is fully containerized using Docker and Docker Compose. Environment secrets are injected at runtime and never baked into build images.

### 1. Prerequisites
- **Docker** and **Docker Compose** installed on your system.

### 2. Configure Environment Variables
Ensure you have created a `.env` file at the root of the project:
```bash
cp .env.example .env
```
*Note: The `DATABASE_URL` in `.env` is used for host-based development. Within Docker, `docker-compose.yml` automatically redirects database traffic to the internal `postgres` container service name.*

### 3. Run the Docker Stack
To build the application image and spin up the app and PostgreSQL containers together, run:
```bash
docker compose up --build -d
```
This command:
- Builds the `smartstock-ai` Next.js image using a secure multi-stage `Dockerfile`.
- Pulls and configures the `postgres:15-alpine` container.
- **Automatically executes migrations** on initial database creation by reading `.sql` files inside `./db/migrations/` (mounted to `/docker-entrypoint-initdb.d`).
- Health-checks PostgreSQL before starting the Next.js application server.

### 4. Seed Database (Optional)
If you want to load mock seed data into your containerized PostgreSQL instance, run the seed files manually:
```bash
# Seed initial tables
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/001_seed_users.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/002_seed_customers.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/003_seed_categories.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/004_seed_products.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/005_seed_inventory.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/006_seed_stock_movements.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/007_seed_sales.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/008_seed_payments.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/009_seed_challans.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/010_seed_accounts.sql
docker compose exec -T postgres psql -U neondb_owner -d neondb -f /docker-entrypoint-seeds/011_seed_procurement.sql
```

### 5. Accessing the Application
Once the containers are running and healthy, open your browser and navigate to:
- **Next.js Web Interface**: [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database** (Exposed to host for tools like pgAdmin/DBeaver): `localhost:5432`

---

## 🎛️ Docker Commands Reference

### View Running Containers
```bash
docker compose ps
```

### Stream Live Logs
- For the entire stack:
  ```bash
  docker compose logs -f
  ```
- For the Next.js application container:
  ```bash
  docker compose logs -f smartstock
  ```
- For the PostgreSQL container:
  ```bash
  docker compose logs -f postgres
  ```

### Stop the Containers
To stop the services without deleting your database data:
```bash
docker compose down
```

### ⚠️ Removing Containers & Volumes
If you need to tear down the entire stack including the persistent named database volume:
```bash
# WARNING: This deletes the PostgreSQL Docker volume and all database data permanently!
docker compose down -v
```

---

## 🚀 Docker Hub Distribution Workflow

To distribute the built application to Docker Hub for remote deployments:

### 1. Build and Tag the Image
```bash
docker build -t smartstock-ai:latest .
docker tag smartstock-ai:latest <dockerhub-username>/smartstock-ai:latest
```

### 2. Push to Docker Hub
```bash
docker push <dockerhub-username>/smartstock-ai:latest
```

### 3. Running from Docker Hub (Consumer Workflow)
A consumer pulling the Docker image from Docker Hub does **not** get your database credentials or Gemini API key. They must run it using their own environment configuration:

1. Pull the image:
   ```bash
   docker pull <dockerhub-username>/smartstock-ai:latest
   ```
2. Create a local `.env` file containing their own secrets:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   JWT_SECRET="consumer-jwt-secret"
   GEMINI_API_KEY="consumer-gemini-key"
   ```
3. Run the container:
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env \
     <dockerhub-username>/smartstock-ai:latest
   ```

Alternatively, they can download the project's `docker-compose.yml`, replace the `build:` block with `image: <dockerhub-username>/smartstock-ai:latest`, and run `docker compose up -d`.
