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






## PostgreSQL to pgvector Migration

## Prerequisites

Before starting, ensure you have:
- Docker and Docker Compose installed
- Current PostgreSQL container running
- Node.js and npm for Prisma

## Set-up

First, identify your current container:

```bash
docker ps
```

Create migration scripts folder:

```bash
mkdir migration-scripts
cd migration-scripts
```

## Backup Script

Create `backup_db.sh` file:

```bash
#!/bin/bash
CONTAINER_NAME="your-postgres-container"  # Replace with actual name
DB_NAME="your-database"                   # Replace with actual database
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p $BACKUP_DIR
docker exec $CONTAINER_NAME pg_dump -U postgres -d $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql"
```

## Docker Compose Update

Update your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg15
    container_name: postgres-pgvector
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: your-database        # Use same values as before
      POSTGRES_USER: postgres           
      POSTGRES_PASSWORD: your-password  
    volumes:
      - postgres_pgvector_data:/var/lib/postgresql/data
      - ./init-pgvector.sql:/docker-entrypoint-initdb.d/init-pgvector.sql

volumes:
  postgres_pgvector_data:
```

Create `init-pgvector.sql` file:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
SELECT 'pgvector extension installed successfully' as status;
```

## Migration Execution

Execute the migration:

```bash
# Run backup
cd migration-scripts
bash backup_db.sh
```

```bash
# Stop current container and start new one
cd ..
docker-compose down
docker-compose up -d
```

Wait for container initialization, then restore data:

```bash
# Replace TIMESTAMP with actual backup file name
docker exec -i postgres-pgvector psql -U postgres -d your-database < migration-scripts/backups/backup_TIMESTAMP.sql
```

Verify pgvector installation:

```bash
docker exec postgres-pgvector psql -U postgres -d your-database -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

## Prisma Schema Update

Add vector fields to your `schema.prisma`:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  embedding Unsupported("vector(1536)")?  // Add after migration
  
  @@map("users")
}
```

Apply Prisma migrations:

```bash
npx prisma generate
npx prisma migrate dev --name add-vector-fields
```

## Complete Migration Script

Create `migrate.sh` for automated migration:

```bash
#!/bin/bash
set -e

OLD_CONTAINER="your-postgres-container"
DB_NAME="your-database"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Starting migration to pgvector..."

# Backup
./backup_db.sh

# Stop and rename old container
docker stop $OLD_CONTAINER
docker rename $OLD_CONTAINER "${OLD_CONTAINER}_backup_$TIMESTAMP"

# Start new container
docker-compose up -d
sleep 10

# Restore data
LATEST_BACKUP=$(ls -t ./backups/backup_*.sql | head -n1)
docker exec -i postgres-pgvector psql -U postgres -d $DB_NAME < $LATEST_BACKUP

echo "Migration completed successfully"
```

Execute:

```bash
chmod +x migrate.sh
./migrate.sh
```

## Rollback Script

Create `rollback.sh` for emergency rollback:

```bash
#!/bin/bash
set -e

echo "Starting rollback..."

# Stop new container
docker stop postgres-pgvector || true
docker rm postgres-pgvector || true

# Find backup container
BACKUP_CONTAINER=$(docker ps -a --filter "name=your-postgres-container_backup" --format "{{.Names}}" | sort -r | head -n1)

# Restore original container
ORIGINAL_NAME=$(echo $BACKUP_CONTAINER | sed 's/_backup_[0-9]*$//')
docker rename $BACKUP_CONTAINER $ORIGINAL_NAME
docker start $ORIGINAL_NAME

echo "Rollback completed successfully"
```

Execute if needed:

```bash
chmod +x rollback.sh
./rollback.sh
```

## Verification

Check everything is working from your project root folder:

**Both Windows and Mac/Linux:**
```bash
docker ps
```

Test database connection:

**Both Windows and Mac/Linux:**
```bash
docker exec postgres-pgvector psql -U postgres -d your-database -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

Test your application (from your backend folder):

**Windows:**
```cmd
cd backend
npm run dev
```

**Mac/Linux:**
```bash
cd backend
npm run dev
```

## Important Notes

- Replace `your-postgres-container` and `your-database` with actual values
- Always backup before migration
- Test in development environment first
- Keep backup files until migration is confirmed successful

