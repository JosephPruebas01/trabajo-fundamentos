# Peluquería Mary — Sistema de Logística (versión simple, sin base de datos)

Versión **ligera** del sistema de logística, pensada para ser lo **más simple
posible**: corre 100% en el navegador, **sin servidor, sin Python y sin base de
datos**. Los datos viven en memoria y se guardan en `localStorage` del navegador.

> Esta es la rama `feature/tst`. La versión completa (Flask + SQL Server +
> Docker + Liquibase) está en la rama `feature/alex`.

## ▶️ Cómo ejecutarlo

**Solo abre el archivo `index.html`** con doble clic (o arrástralo al navegador).
No necesitas instalar nada.

> Recomendado: Chrome, Edge o Firefox actualizados.

### Usuarios de ejemplo

| Usuario    | Contraseña    | Rol      |
|------------|---------------|----------|
| `admin`    | `admin123`    | ADMIN    |
| `operador` | `operador123` | OPERADOR |

## ✨ Qué incluye

Cumple **las mismas funciones** que la versión con base de datos:

- **Login** y **cerrar sesión**.
- **Dashboard** con KPIs animados (productos, entradas/salidas de hoy, stock bajo)
  y últimos movimientos.
- **Usuario**: datos del perfil, rol y **cambio de contraseña**.
- **Kardex**: tabla con el detalle total de productos (resalta stock bajo).
- **Productos**: búsqueda en vivo, alta de productos e **ingresos/salidas**
  (validan el stock).
- **Reportes**: filtros (movimientos o stock) con **exportación a Excel** (.xlsx).
- Interacciones: modales, notificaciones *toast*, contadores animados, búsqueda
  instantánea.

## 🎨 Diseño

- **Solo Bootstrap 5** + Bootstrap Icons + CSS propio. **Sin efectos 3D.**
- Estilo vistoso con degradados violeta/rosa, tarjetas con hover y animaciones
  ligeras en CSS (sin librerías 3D).

## 📁 Estructura

```
index.html        → toda la interfaz (login + secciones)
assets/styles.css → estilos propios (degradados, tarjetas, sidebar)
assets/app.js     → lógica: datos de ejemplo, navegación, CRUD, reportes, Excel
```

## 🗂️ Sobre los datos

- Al abrir por primera vez se cargan **datos de ejemplo**.
- Tus cambios (productos, movimientos, contraseña) se guardan en `localStorage`.
- El botón **↺** (arriba a la derecha) **restaura** los datos de ejemplo.

## 📦 Dependencias (vía CDN, no requieren instalación)

- Bootstrap 5 y Bootstrap Icons (estilos e interacciones).
- SheetJS (xlsx) para exportar a Excel. Si no hay internet, exporta en CSV.
