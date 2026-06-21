# Peluquería Mary — Sistema de Logística (front JS + back Python, sin BD)

Versión **ligera**: **JavaScript** en el front y **Python (Flask)** en el back,
**sin base de datos** (los datos viven en memoria del servidor). Código mínimo,
sin redundancias y con nombres claros.

> Rama `feature/tst`. La versión completa (Flask + SQL Server + Docker + Liquibase)
> está en `feature/alex`.

## ▶️ Cómo ejecutarlo

```bash
pip install -r requirements.txt
python app.py
# abre: http://localhost:5000
```

### Usuarios de ejemplo

| Usuario    | Contraseña    | Rol      |
|------------|---------------|----------|
| `admin`    | `admin123`    | ADMIN    |
| `operador` | `operador123` | OPERADOR |

## 🧩 Arquitectura (simple)

```
Navegador (JS)  ──fetch──▶  Flask (app.py)  ──▶  datos en memoria
   web/                       /api/...              (listas Python)
```

- **Front** (`web/`): HTML + Bootstrap + JS. Pinta la interfaz y llama a la API.
- **Back** (`app.py`): expone una API JSON, valida la lógica (ej. stock) y guarda
  los datos en memoria. Sin base de datos.

## 🔌 API

| Método | Ruta | Para qué |
|---|---|---|
| POST | `/api/login` | Validar usuario/contraseña |
| GET  | `/api/estado` | Traer categorías, productos y movimientos |
| POST | `/api/productos` | Crear un producto |
| POST | `/api/movimientos` | Registrar ingreso/salida (valida stock) |
| POST | `/api/clave` | Cambiar contraseña |

## ✨ Funcionalidades

- **Login / cerrar sesión**.
- **Dashboard** con KPIs animados + últimos movimientos.
- **Usuario**: perfil, rol y **cambiar contraseña**.
- **Kardex**: detalle total de productos (resalta stock bajo).
- **Productos**: búsqueda en vivo, alta e **ingresos/salidas** (validan stock).
- **Reportes**: filtros (movimientos o stock) + **exportar a Excel** (.xlsx).

## 📁 Estructura

```
app.py             → backend Flask (API + sirve el front), datos en memoria
requirements.txt   → Flask
web/index.html     → interfaz (login + secciones)
web/styles.css     → estilos (degradados, sidebar, KPIs) — sin 3D
web/app.js         → lógica del front: navegación, render, llamadas a la API
```

## 🎨 Diseño

Solo **Bootstrap 5** + Bootstrap Icons + CSS propio. **Sin efectos 3D.** Degradados
violeta/rosa, tarjetas con hover, toasts y contadores animados (CSS/JS ligero).

> Nota: los datos se reinician al reiniciar el servidor (no hay base de datos).
