# anycolor-web · Frontend de AnyColor Salón

Aplicación web en **Next.js + React + Tailwind CSS**. Se comunica con el backend solo por la API REST (`src/lib/api.ts`).

## Ejecutar

```bash
npm install
npm run dev       # http://localhost:3000  (el backend debe estar en http://localhost:3001)
```

## Pantallas

| Ruta | Rol | Qué hace |
|---|---|---|
| `/` | Público | Catálogo de servicios |
| `/ingresar` | Público | Login y registro de clientas |
| `/reservar` | Cliente | Servicio → estilista → horario (bloqueo de 5 min) → confirmar |
| `/mis-citas` | Cliente | Ver y cancelar sus citas |
| `/panel` | Personal | Agenda del día con indicadores y acciones |
