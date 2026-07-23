# Cuaderno — agenda de clases

Aplicación web para anotar lo que mandan en clase: de qué materia es, quién la da, qué día se
entrega y con cuánta antelación conviene empezar a prepararlo.

Funciona en móvil y en ordenador, se puede instalar como app y guarda todo en el propio
dispositivo, sin cuentas ni servidor.

## Cómo arrancarla

```bash
npm install     # solo la primera vez
npm run dev     # http://localhost:5173
```

Versión final:

```bash
npm run build   # genera dist/
npm run preview # sirve dist/ tal como quedará publicada
```

## Secciones

| Sección         | Contenido                                                                            |
| --------------- | ------------------------------------------------------------------------------------ |
| **Hoy**         | Vencidas, entregas de hoy, lo que toca ir preparando, clases del día y cuenta atrás de exámenes. |
| **Actividades** | Todo lo anotado, agrupado por urgencia, con búsqueda y filtros por materia y tipo.    |
| **Calendario**  | Vista mensual con un punto por entrega y el detalle de cada día.                      |
| **Horario**     | Rejilla semanal de clases con hora y aula.                                            |
| **Materias**    | Profesor, aula, horario, pendientes y promedio de notas de cada materia.              |
| **Notas**       | Ideas y recordatorios, opcionalmente ligados a una materia.                           |
| **Ajustes**     | Tema, escala de notas, copia de seguridad y datos de ejemplo.                         |

## Preparación anticipada

Al anotar una actividad se elige **con cuántos días de antelación** empezar (el mismo día, 1, 2, 3,
5 o 7). Desde esa fecha aparece en **Hoy**, bajo _«Toca ir preparando»_, aunque la entrega siga
lejos.

Ejemplo: una exposición el viernes a las 9:00 con «2 días antes» empieza a avisar el miércoles.

## Estructura

```
src/
  types.ts              modelo de datos (materias, clases, actividades, notas, ajustes)
  store.tsx             estado global y guardado en localStorage
  lib/
    dates.ts            utilidades de fechas en español
    ui.ts               paleta, tipos de actividad, niveles de urgencia
    selectors.ts        lógica derivada: urgencia, qué preparar hoy, promedios
    seed.ts             datos de ejemplo y valores por defecto
  components/
    ui.tsx              botones, campos, modales, etiquetas
    Layout.tsx          barra lateral, navegación móvil, tema
    TaskCard.tsx        fila de actividad
    TaskEditor.tsx      formulario de actividad (accesible desde toda la app)
  pages/                una por sección
```

Los datos viven en `localStorage` bajo la clave `cuaderno.data.v1`. Desde **Ajustes** se puede
descargar una copia en JSON y restaurarla en otro dispositivo.

### Diseño

Los colores, tipografía y espaciado salen de variables CSS definidas en `src/index.css`, con
variante para tema claro y oscuro. Las utilidades propias (`panel`, `eyebrow`, `text-muted`,
`divide-hairline`) se declaran ahí mismo con `@utility`, de modo que un cambio de paleta se hace en
un solo archivo.

## Instalarla en el móvil

1. Publica `dist/` en cualquier hosting estático (Netlify, Vercel, GitHub Pages).
2. Ábrela en el móvil y usa **«Añadir a pantalla de inicio»**.

## Tecnologías

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · date-fns · lucide-react
