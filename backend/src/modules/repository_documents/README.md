# Repository Documents Module

Este módulo maneja la gestión de documentos y la generación de embeddings para el sistema de aprendizaje inteligente.

## Configuración del Entorno

### 1. Detener servicios existentes
```bash
docker compose down
```
**¿Qué hace?** Detiene todos los contenedores Docker que estén ejecutándose para evitar conflictos de puertos y recursos.

### 2. Iniciar MinIO (Almacenamiento de archivos)
```bash
docker compose -f minio.compose.yml up
```
**¿Qué hace?** Inicia el servicio MinIO que actúa como almacenamiento de objetos compatible con S3 para guardar los documentos PDF subidos.

**¿Por qué?** MinIO proporciona una interfaz de almacenamiento escalable y compatible con Amazon S3 para manejar archivos de forma eficiente.

### 3. Iniciar servicios de desarrollo
```bash
docker compose -f compose.dev.yml up
```
**¿Qué hace?** Inicia todos los servicios necesarios para el entorno de desarrollo (base de datos PostgreSQL, Redis, etc.).

**¿Por qué?** Estos servicios son fundamentales para el funcionamiento del backend y la gestión de datos.

### 4. Ejecutar migraciones de base de datos
```bash
npx prisma migrate dev
```
**¿Qué hace?** Aplica las migraciones de Prisma para crear o actualizar el esquema de la base de datos.

**¿Por qué?** Necesario para que las tablas de documentos, usuarios y embeddings estén disponibles en la base de datos.

## Configuración de Variables de Entorno

Antes de ejecutar el sistema, debes configurar las siguientes variables de entorno en tu archivo `.env`:

### Variables de Base de Datos y APIs
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
```

**DATABASE_URL:** Cadena de conexión a PostgreSQL. Reemplaza `username`, `password`, y `database_name` con tus credenciales reales de base de datos.

**OPENAI_API_KEY:** Tu clave API de OpenAI obtenida desde [platform.openai.com](https://platform.openai.com). Es esencial para generar embeddings y respuestas de IA.

**OPENAI_EMBEDDING_MODEL:** Modelo de embeddings de OpenAI. Se recomienda `text-embedding-3-small` por su balance entre calidad y costo.

### Configuración de MinIO
```bash
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=documents
MINIO_REGION=us-east-1
```

**MINIO_ENDPOINT:** Dirección del servidor MinIO. Para desarrollo local usar `localhost:9000`.

**MINIO_ACCESS_KEY/SECRET_KEY:** Credenciales de acceso a MinIO. Los valores por defecto son `minioadmin` para ambos en desarrollo.

**MINIO_BUCKET_NAME:** Nombre del bucket donde se almacenarán los documentos PDF subidos.

### Configuración Adicional
```bash
HF_API_TOKEN=hf_your-hugging-face-token-here
REDIS_HOST=localhost
REDIS_PORT=6379

CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_CONCURRENT_PROCESSING=5

PORT=3000
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_ACCESS_SECRET=your-jwt-access-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
GEMINI_API_KEY=your-gemini-api-key
AI_MODEL=gpt-3.5-turbo
AI_MAX_OUTPUT_TOKENS=4096
AI_TEMPERATURE=0.7
```

**HF_API_TOKEN:** Token de Hugging Face para modelos alternativos de embeddings. Opcional si solo usas OpenAI.

**REDIS_HOST/PORT:** Configuración de Redis para caché y sesiones. Para desarrollo local usar `localhost:6379`.

**CHUNK_SIZE/OVERLAP:** Configuración del procesamiento de texto. `CHUNK_SIZE` define el tamaño máximo de cada fragmento de texto, `CHUNK_OVERLAP` el solapamiento entre fragmentos para mantener contexto.

## Configuración de Datos Iniciales

### Script SQL para crear roles y usuario de prueba

Ejecuta el siguiente script SQL en tu base de datos PostgreSQL:

```sql
-- 1. Crear roles del sistema
INSERT INTO "Role" (id, name, description, "createdAt", "updatedAt")
VALUES
 ('role-docente-id', 'docente', 'Docente que dicta materias', NOW(), NOW()),
 ('role-estudiante-id', 'estudiante', 'Estudiante inscrito en materias', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. Crear usuario de prueba
INSERT INTO "User" (
 id,
 name,
 lastname,
 email,
 password,
 "isActive",
 "createdAt",
 "updatedAt"
) VALUES (
 'user-123',
 'Usuario',
 'Prueba',
 'usuario.prueba@test.com',
 '$2b$10$rQYmF8Fv7aDqkPr1jJ8Xv.QKGZHWxQWpFj1QGZHWx', -- password: "test123"
 true,
 NOW(),
 NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Consulta para obtener el ID del usuario creado
SELECT id, name, lastname, email FROM "User" WHERE email = 'usuario.prueba@test.com';
```

**¿Por qué es necesario?** El controlador actualmente tiene hardcodeado el ID del usuario. Necesitas obtener el ID real del usuario creado en la base de datos para usar en los endpoints.

## Endpoints Disponibles

### 1. Subir documento
```
POST: localhost:3000/api/documents/upload
```
**¿Qué hace?** Sube un archivo PDF al sistema y lo almacena en MinIO.

### 2. Procesar texto del documento
```
POST: localhost:3000/api/documents/{DOCUMENT_ID}/process-text
```
**¿Qué hace?** Extrae el texto del PDF subido y lo procesa para análisis posterior.

**Nota:** Reemplaza `{DOCUMENT_ID}` con el ID real del documento obtenido del endpoint anterior.

### 3. Procesar chunks del documento
```
POST: localhost:3000/api/documents/{DOCUMENT_ID}/process-chunks
```
**¿Qué hace?** Divide el texto extraído en fragmentos (chunks) más pequeños para facilitar el procesamiento de embeddings.

### 4. Generar embeddings
```
POST: localhost:3000/api/repository-documents/embeddings/generate/{DOCUMENT_ID}
```
**¿Qué hace?** Genera embeddings vectoriales del contenido del documento usando IA para permitir búsquedas semánticas.

**¿Por qué?** Los embeddings permiten realizar búsquedas inteligentes basadas en el significado del contenido, no solo palabras clave.

### 5. Buscar en embeddings
```
POST: localhost:3000/api/repository-documents/embeddings/search/
```
**¿Qué hace?** Realiza búsquedas semánticas en el repositorio de documentos usando los embeddings generados.

## Flujo de Trabajo Completo

1. **Configurar entorno** (pasos 1-4 arriba)
2. **Ejecutar script SQL** para crear datos iniciales
3. **Obtener ID de usuario** de la consulta SQL
4. **Subir documento** usando el endpoint de upload
5. **Procesar texto** del documento subido
6. **Procesar chunks** para dividir el contenido
7. **Generar embeddings** para habilitar búsquedas inteligentes
8. **Realizar búsquedas** usando el endpoint de search

Este flujo permite tener un sistema completo de gestión de documentos con capacidades de búsqueda semántica avanzada.

    