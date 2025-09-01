# Bucket creation with MinIO

## Set-up
go to:

```bash
cd docker
```
and execute:

```bash
docker-compose -f minio.compose.yml up -d
```

It's gonna take for a while
and finally:
Going to http://localhost:9090


# PostgreSQL to pgvector Migration Without Data Loss
This guide will help you migrate your PostgreSQL database to PostgreSQL with pgvector, keeping all your existing data and adding vector fields to your Prisma schema.

## 🎯 Objective

To switch from a standard PostgreSQL Docker container to one with pgvector to support vector-type fields in Prisma, without losing any existing data.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Access to your current PostgreSQL container
- A recent backup of your database
- Prisma configured in your project

## 🚨 Important Warnings

- **Always make a backup before starting**
- **Test in a development environment first**
- **Have a rollback plan ready**

## 🔄 Migration proccess

### Step 1: Backup of the actual data base

```bash
# Complete backup without compression
docker exec your-postgres-container pg_dump -U your_user -d your_database > complete_backup.sql

# Full backup with compression (recommended for large DBs)
docker exec your-postgres-container pg_dump -U your_user -d your_database | gzip > complete_backup.sql.gz

# Data-only backup (optional, for specific cases)
docker exec your-postgres-container pg_dump -U your_user -d your_database --data-only > data_only_backup.sql
```

### Step 2: Configure Docker Compose for pgvector

Create or update your `docker-compose.yml`:

```yaml
version: '3.8'
services:
  # Existing container (keep while testing)
  postgres-old:
    image: postgres:15
    container_name: postgres-original
    environment:
      POSTGRES_DB: your_database
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_old_data:/var/lib/postgresql/data

  # New container with pgvector
  postgres-vector:
    image: pgvector/pgvector:pg15  # Use the version you prefer
    container_name: postgres-pgvector
    environment:
      POSTGRES_DB: your_database
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
    ports:
      - "5433:5432"  # Different port to avoid conflicts
    volumes:
      - pgvector_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d/
volumes:
  postgres_old_data:
  pgvector_data:
```

### Step 3: Initialization Script for pgvector


Create the directory and file `init-scripts/01-init-pgvector.sql`:

```bash
mkdir -p init-scripts
```

```sql
-- init-scripts/01-init-pgvector.sql
-- Create pgvector extension 
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify Instalation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE NOTICE 'pgvector extension installed successfully!';
    ELSE
        RAISE EXCEPTION 'Failed to install pgvector extension!';
    END IF;
END $$;
```

### Step 4: Refresh your prisma schema


Refresh your `schema.prisma` with the new vector fields:

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model TuModelo {
  id        Int      @id @default(autoincrement())
  // ... your existing fields ...
  

  embedding    Unsupported("vector(1536)")?  // Para embeddings OpenAI
  description  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("tu_tabla")
}

// Another example with vector

model DocumentEmbedding {
  id        Int      @id @default(autoincrement())
  content   String
  vector    Unsupported("vector(512)")   // Vector de menor dimensión
  metadata  Json?
  createdAt DateTime @default(now())
  
  @@map("document_embeddings")
}
```

### Step 5: execute migration

#### 5.1 Start the new container

```bash
docker-compose up -d postgres-vector

# Verify if it's running
docker ps | grep postgres-pgvector
```

#### 5.2 verify the pgvector is already installed


```bash
docker exec postgres-pgvector psql -U your_user -d your_database -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

#### 5.3 Restore the data in the new container


```bash
# For backup without compression

docker exec -i postgres-pgvector psql -U your_user -d your_database < backup_completo.sql

# With compression
gunzip -c backup_complete.sql.gz | docker exec -i postgres-pgvector psql -U your_user -d your_database

# Verify the data is restored

docker exec postgres-pgvector psql -U your_user -d your_database -c "SELECT COUNT(*) FROM your_main_table;"
```

#### 5.4 Enable pgvector in the restored DB (if it didn't run automatically)

```bash
docker exec postgres-pgvector psql -U tu_usuario -d tu_database -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Step 6: Configure Prisma for the new container

#### 6.1 Update environment variables

```bash
# .env
# Change the port from 5432 to 5433
DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5433/tu_database"
# Save the original URL in case you need to roll back
DATABASE_URL_OLD="postgresql://tu_usuario:tu_password@localhost:5432/tu_database"
```

#### 6.2 Generate migration for the new fields

```bash
# Generate migration for only the new fields
npx prisma migrate dev --name add_vector_fields
# If there are problems, you can use --create-only to review before applying
npx prisma migrate dev --name add_vector_fields --create-onlyy
```

#### 6.3 Regenerate Prisma client

```bash
npx prisma generate
```

### Step 7: Verification and testing

#### 7.1  Verification scripts

```bash
#!/bin/bash
echo "🔍 Verifying migration..."
echo "1. Verifying pgvector extension:"
docker exec postgres-pgvector psql -U tu_usuario -d tu_database -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
echo "2. Verifying existing data:"
docker exec postgres-pgvector psql -U tu_usuario -d tu_database -c "SELECT COUNT(*) as total_records FROM tu_tabla_principal;"
echo "3. Verifying new vector columns:"
docker exec postgres-pgvector psql -U tu_usuario -d tu_database -c "\d+ tu_tabla"
echo "4. Testing basic vector operation:"
docker exec postgres-pgvector psql -U tu_usuario -d tu_database -c "SELECT '[1,2,3]'::vector;"
echo "✅ Verification completed"
```

#### 7.2 Test your application

```bash
# Run your tests
npm test  # or yarn test
# Verify Prisma connection
npx prisma db pull
npx prisma generate
```

### Step 8: Gradual switch and monitoring

#### 8.1 Initial monitoring

```bash
# Keep both containers running initially
docker-compose ps
# Monitor logs of the new container
docker logs -f postgres-pgvector
```

#### 8.2 Production testing (optional)

If everything works correctly in development, you can do a gradual switch:

1. Change only a part of your application to the new container
2. Monitor for errors
3. Gradually migrate the rest

## 🔧 Troubleshooting

### Error: "vector" type not found

```sql
-- Run in the pgvector container
CREATE EXTENSION IF NOT EXISTS vector;
-- Verify that it was installed
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Error: Prisma migration fails

```bash
# Reset Prisma migrations (development only)
npx prisma migrate reset --force
# Apply migrations one by one
npx prisma migrate resolve --applied "migration_name"
```

### Error: Port already in use

```bash
# Change port in docker-compose.yml or stop the existing container
docker stop postgres-original
```

## 🔄 Rollback Plan

In case of problems, run:

```bash
#!/bin/bash
echo "🚨 Running rollback..."
# Switch back to the original container
sed -i 's/:5433/:5432/g' .env
# Stop the new container
docker-compose stop postgres-vector
# Ensure the original is running
docker-compose up -d postgres-old
echo "✅ Rollback completed. Verify your application."
```

## 📝 Verification Checklist

- [ ] Backup created and verified
- [ ] New pgvector container running
- [ ] pgvector extension installed
- [ ] Data restored correctly
- [ ] Prisma Schema updated
- [ ] Migrations applied without errors
- [ ] Prisma client regenerated
- [ ] Tests are passing
- [ ] Application is working with new vector fields
- [ ] Rollback plan tested

## 🎉  Expected Outcome

Upon completion, you will have:

- PostgreSQL database with pgvector functioning
- All your existing data intact
- Ability to use vector fields in Prisma
- The possibility of performing vector operations (similarity, searches, etc.)