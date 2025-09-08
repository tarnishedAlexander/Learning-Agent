# Chunked Upload Implementation

Sistema de subida de archivos por chunks con progreso, cancelación y reintentos.

## Estructura

```
client/src/
├── components/shared/
│   └── ChunkedUploadButton.tsx      # Componente principal
├── services/
│   └── chunkedUpload.service.ts     # Servicio de upload
├── hooks/
│   └── useChunkedDocumentUpload.ts  # Hook de integración
└── pages/documents/
    └── UploadDocumentPage.tsx       # Página implementada
```

## Características

- Upload chunked con progreso detallado
- Cancelación en tiempo real
- Reintentos automáticos para chunks fallidos
- Información de velocidad y tiempo restante
- Responsive design
- Soporte para temas claro/oscuro
- Integración con sistema de documentos existente

## Uso Básico

```tsx
<ChunkedUploadButton
  fileConfig={{
    accept: ".pdf",
    maxSize: 100 * 1024 * 1024,
    chunkSize: 2 * 1024 * 1024,
    validationMessage: "Solo archivos PDF de máximo 100MB"
  }}
  processingConfig={{
    steps: [
      { key: 'validate', title: 'Validación', description: 'Validando archivo...' },
      { key: 'upload', title: 'Subida', description: 'Subiendo por chunks...' },
      { key: 'process', title: 'Procesamiento', description: 'Procesando...' }
    ]
  }}
  onPostUploadProcess={processDocumentComplete}
  onUploadSuccess={handleSuccess}
/>
```

## Configuración

### FileConfig
- `accept`: Tipos de archivo (ej: ".pdf", ".docx")
- `maxSize`: Tamaño máximo en bytes
- `chunkSize`: Tamaño de chunk (default: 2MB)
- `validationMessage`: Mensaje de validación personalizado

### ProcessingConfig
- `steps`: Array de pasos del procesamiento
- `processingText`: Texto durante procesamiento
- `successText`: Texto de éxito

### ButtonConfig
- `showText`: Mostrar texto del botón
- `variant`: Estilo ('fill', 'ghost', 'text', 'link')
- `size`: Tamaño ('small', 'middle', 'large')
- `shape`: Forma ('default', 'circle', 'round')

## Progreso Detallado

El componente muestra:
- Porcentaje de progreso por chunks
- Bytes subidos vs total
- Velocidad de subida en tiempo real
- Tiempo restante estimado
- Número de chunks completados

## Control de Flujo

### Estados
- `idle`: Esperando selección de archivo
- `uploading`: Subiendo chunks
- `processing`: Procesando archivo
- `success`: Completado exitosamente
- `error`: Error con opción de reintentar

### Controles
- Botón "Cancelar" durante upload
- Botón "Reintentar" en caso de error
- Cierre automático al completar

## Integración

El sistema se integra perfectamente con:
- Hook `useDocuments` existente
- Servicio `documentService` para procesamiento
- Sistema de autenticación actual
- Componentes de UI de Ant Design

## Arquitectura

### ChunkedUploadButton
Componente React principal que maneja la UI y el flujo de upload.

### chunkedUploadService
Servicio que gestiona la lógica de chunks, cancelaciones y progreso.

### useChunkedDocumentUpload
Hook que integra el upload chunked con el procesamiento de documentos.

## Estados de Procesamiento

Cada paso puede estar en:
- `wait`: Esperando ejecución
- `process`: En progreso
- `finish`: Completado
- `error`: Error ocurrido

## Cancelación

La cancelación está disponible durante:
- Subida de chunks
- Procesamiento (parcial)

No disponible durante:
- Finalización exitosa
- Estados de error

## Reintentos

Sistema automático de reintentos:
- Máximo 3 intentos por chunk
- Backoff exponencial entre reintentos
- Botón manual para reintentar todo el proceso

## Responsividad

Adaptación automática para:
- Pantallas pequeñas (móviles)
- Tablets
- Desktop
- Ajuste de textos y tamaños
- Modal responsive

## Compatibilidad

- React 18+
- TypeScript 4.5+
- Ant Design 5.x
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Dispositivos móviles y tablets
- Temas claro y oscuro

## Próximos Pasos

- Implementar chunked upload real en el backend
- Agregar compresión de archivos antes del upload
- Implementar upload de múltiples archivos
- Agregar previsualización de archivos PDF
- Mejorar el sistema de notificaciones
- Implementar upload por drag & drop
- Agregar soporte para otros tipos de archivo

## Notas de Implementación

El componente mantiene compatibilidad total con el `UploadButton` original, permitiendo un upgrade transparente sin cambios en otros componentes.

El nuevo componente es completamente compatible con el sistema existente:

- Mantiene la misma interfaz de props del `UploadButton` original
- Se integra sin problemas con `useDocuments` hook
- Usa los mismos servicios de backend para procesamiento
- Mantiene el mismo flujo de trabajo para el usuario final

El upgrade es transparente y no requiere cambios en otros componentes.
