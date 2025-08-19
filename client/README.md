# Grade Visualizer 📚

Sistema para gestión de cursos y asignación de estudiantes.

---

## 🚀 Instalación Rápida

Ejecuta el script "script.sh" que contendra todas las verificaciones necesarias para levantar el 
frontend, pero primero debemos darle los permisos correspondientes

```bash
chmod +x script.sh
```

```bash
./script.sh
```

## Instalacion Manual

Instala las dependencias:

```bash
npm install
```

---

## ⚠️ Problemas comunes con Vite

Si al ejecutar `npm install` aparece un error relacionado a `vite` como:

```
npm WARN EBADENGINE Unsupported engine {
  package: 'vite@x.x.x',
  required: { node: '^...' }
}
```

Debes **reinstalar Vite con una versión compatible**. Para ello:

```bash
npm uninstall vite
npm install vite@6.0.0
```

O puedes fijar la versión manualmente en `package.json`:

```json
"vite": "^6.0.0"
```

Luego ejecuta:

```bash
npm install
```

---

## 🧑‍💻 Iniciar el proyecto

Antes de iniciar el Proyecto, abra otra terminal y ejecute el siguiente comando:

```bash
json-server --watch db.json --port 3000
```

Nota: Si se enfrenta a un error de **json-server** instale el package con el siguiente comando:

```bash
sudo npm install -g json-server
```


A continuación, cree un archivo `.env` en la raiz del proyecto, debe contener el puerto del localhost en el que se ejecuta su `db.json`, debe tener el siguiente contenido:
```
VITE_URL='http://localhost:3000/'
```

Finalmente, para iniciar la app en modo desarrollo:

```bash
npm run dev
```

La aplicación se abrirá en: [http://localhost:5173](http://localhost:5173)

---

## 📦 Estructura del proyecto

```
src/
├── api/              → Configuración de jsonInstance (axios)
├── components/       → Componentes reutilizables (formularios, tablas, etc.)
├── hooks/            → Hooks personalizados como useClasses
├── interfaces/       → Tipos TS (Clase, Estudiante)
├── pages/            → Páginas del sistema
├── routes/           → Rutas del sistema
├── services/         → Lógica de conexión con la API/JSON-server
├── store/            → Zustand para estado global

```

---

## ✅ Requisitos

- Node.js 18+
- NPM 9+
- Vite ^5.2.8
- JSON server 1.0.0+
