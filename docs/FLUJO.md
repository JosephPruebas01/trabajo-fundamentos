# 🔄 Flujo del Sistema — Peluquería Mary

> Documento para entender **cómo se usa** el sistema y **qué pasa por dentro**
> en cada acción. Paso a paso, pensado para un junior.

📂 Diagrama editable en draw.io: [diagramas/flujo.drawio](diagramas/flujo.drawio)

> Si aún no entiendes *cómo está armado* el sistema (contenedores, base de datos),
> lee primero [ARQUITECTURA.md](ARQUITECTURA.md).

---

## 1. Mapa general del recorrido del usuario

Este es el "viaje" completo: desde que entras hasta que sales.

```mermaid
flowchart TD
    L["🔐 Login<br/>(usuario + contraseña)"] --> V{"¿Credenciales<br/>correctas?"}
    V -- "No ❌" --> L2["Vuelve al Login<br/>con mensaje de error"]
    L2 --> L
    V -- "Sí ✅" --> D["📊 Dashboard<br/>(KPIs + últimos movimientos)"]

    D --> U["👤 Usuario<br/>perfil, rol y<br/>cambiar contraseña"]
    D --> K["📋 Kardex<br/>tabla con TODOS<br/>los productos"]
    D --> P["📦 Productos<br/>buscar / crear /<br/>ingreso / salida"]
    D --> R["📈 Reportes<br/>filtros +<br/>exportar a Excel"]
    D --> X["🚪 Cerrar sesión"]

    X --> L

    P --> P2["Registrar movimiento<br/>→ actualiza el stock"]
    R --> R2["Descargar archivo .xlsx"]
```

**Las 5 opciones del menú lateral** (lo que pediste):

| Botón | Qué hace |
|---|---|
| **Usuario** | Muestra tus datos, tu **rol**, y permite **cambiar la contraseña**. |
| **Kardex** | Tabla con el **detalle total** de productos (stock, precios, estado). |
| **Productos** | **Buscar**, **crear** productos y registrar **ingresos/salidas**. |
| **Reportes** | **Filtrar** y **exportar a Excel** (movimientos o stock). |
| **Cerrar sesión** | Borra la sesión y **regresa al login**. |

---

## 2. Flujo de LOGIN (paso a paso, por dentro)

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant B as 🌐 Navegador
    participant F as 📦 Flask (app.py)
    participant DB as 🗄️ SQL Server

    U->>B: Abre http://localhost:8000
    B->>F: GET /
    F-->>B: Muestra login.html
    U->>B: Escribe usuario + contraseña y da "Ingresar"
    B->>F: POST / (usuario, password)
    F->>DB: Buscar usuario activo con esa clave
    DB-->>F: Devuelve la fila (o nada)

    alt Credenciales correctas
        F->>F: Guarda en la sesión: usuario, nombre, rol
        F-->>B: Redirige a /dashboard
        B-->>U: Muestra el Dashboard
    else Credenciales incorrectas
        F-->>B: login.html + aviso "Usuario o contraseña incorrectos"
        B-->>U: Vuelve a ver el login con el error
    end
```

**En palabras simples:**
1. Entras a la página → Flask te muestra el formulario de login.
2. Envías usuario y contraseña.
3. Flask le pregunta a la base si existe un usuario **activo** con esa clave.
4. Si **sí**: guarda tus datos en la *sesión* (para recordarte) y te lleva al dashboard.
5. Si **no**: te muestra de nuevo el login con un mensaje de error.

> 🔒 **Sesión** = la forma en que el sistema "te recuerda" mientras navegas. Si
> intentas entrar a `/kardex` sin haber iniciado sesión, te devuelve al login
> (esto lo hace el decorador `login_required` en [app.py](../app.py)).

---

## 3. Flujo de PRODUCTOS: registrar un ingreso o salida

Esta es la parte más importante porque **modifica el stock** y debe ser segura.

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant B as 🌐 Navegador
    participant F as 📦 Flask (app.py)
    participant D as 🧩 db.py
    participant DB as 🗄️ SQL Server

    U->>B: En "Productos", clic en Ingreso o Salida
    B->>U: Abre ventana (modal) y pide cantidad
    U->>B: Escribe cantidad y confirma
    B->>F: POST /productos/movimiento (id, tipo E/S, cantidad)
    F->>F: Valida: cantidad > 0 y tipo válido
    F->>D: registrar_movimiento(...)

    Note over D,DB: Todo dentro de UNA transacción
    D->>DB: Leer stock actual del producto
    alt Es SALIDA y no hay stock suficiente
        D-->>F: Error "Stock insuficiente"
        F-->>B: Dashboard de productos + aviso (no cambia nada)
    else Hay stock (o es ingreso)
        D->>DB: INSERT del movimiento
        D->>DB: UPDATE del stock (+ entra / - sale)
        D->>DB: COMMIT (confirmar)
        D-->>F: OK
        F-->>B: Productos + aviso "Movimiento registrado"
    end
```

**Paso a paso, en palabras:**
1. En la página de Productos haces clic en **Ingreso** (E) o **Salida** (S).
2. Se abre una ventanita pidiendo la **cantidad**.
3. Al confirmar, Flask **valida** que la cantidad sea mayor a cero.
4. `db.py` abre una **transacción** (un bloque "todo o nada"):
   - Lee el stock actual.
   - Si es **salida** y pides más de lo que hay → **rechaza** y no toca nada.
   - Si todo bien → inserta el movimiento, ajusta el stock y **confirma** (commit).
5. Vuelves a la lista de productos con un mensaje de éxito o de error.

> 💡 **¿Por qué una transacción?** Para que sea imposible que se registre el
> movimiento pero el stock quede sin actualizar (o viceversa). O pasan **las dos
> cosas**, o **ninguna**.

---

## 4. Flujo de REPORTES: filtrar y exportar a Excel

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant B as 🌐 Navegador
    participant F as 📦 Flask (app.py)
    participant DB as 🗄️ SQL Server
    participant XL as 📑 openpyxl

    U->>B: Elige tipo (Movimientos o Stock) y filtros
    B->>F: POST /reportes (filtros)
    F->>DB: Consulta con los filtros aplicados
    DB-->>F: Filas resultantes
    F-->>B: Muestra la vista previa en tabla

    U->>B: Clic en "Exportar a Excel"
    B->>F: POST /reportes/exportar (mismos filtros)
    F->>DB: Vuelve a consultar con los filtros
    DB-->>F: Filas resultantes
    F->>XL: Crea el archivo .xlsx (encabezados + filas)
    XL-->>F: Archivo en memoria
    F-->>B: Descarga del archivo Reporte.xlsx
    B-->>U: Se descarga el Excel
```

**Paso a paso:**
1. Eliges el **tipo de reporte**: *Movimientos* (entradas/salidas) o *Stock* (inventario actual).
2. Aplicas filtros (fechas, categoría, producto, tipo…).
3. "Generar vista previa" → ves los resultados en pantalla.
4. "Exportar a Excel" → Flask vuelve a consultar con esos filtros, arma un
   archivo `.xlsx` con **openpyxl** y te lo **descarga**.

---

## 5. Flujo de CAMBIO DE CONTRASEÑA (botón Usuario)

```mermaid
flowchart TD
    A["👤 Usuario → formulario<br/>cambiar contraseña"] --> B["Envía: actual, nueva, confirmar"]
    B --> C{"¿La contraseña actual<br/>es correcta?"}
    C -- "No ❌" --> E1["Aviso: 'contraseña actual incorrecta'"]
    C -- "Sí ✅" --> D{"¿nueva == confirmar<br/>y no está vacía?"}
    D -- "No ❌" --> E2["Aviso: 'no coinciden / vacía'"]
    D -- "Sí ✅" --> G["UPDATE en la base<br/>+ aviso de éxito"]
    E1 --> A
    E2 --> A
```

1. Escribes tu contraseña **actual** + la **nueva** (dos veces).
2. El sistema verifica que la actual sea correcta.
3. Verifica que la nueva no esté vacía y que ambas coincidan.
4. Si todo está bien, **actualiza** la contraseña y te avisa.

---

## 6. Flujo de CERRAR SESIÓN

```mermaid
flowchart LR
    A["🚪 Clic en 'Cerrar sesión'"] --> B["Flask borra la sesión<br/>(session.clear)"]
    B --> C["🔐 Redirige al Login"]
```

Simple: se borra la sesión (el sistema "te olvida") y vuelves al login. Si
intentas volver atrás a una página interna, te pedirá iniciar sesión otra vez.

---

## 7. Resumen de rutas (para ubicarte en el código)

| Acción del usuario | Ruta (URL) | Método | Dónde está |
|---|---|---|---|
| Ver login / iniciar sesión | `/` | GET / POST | [app.py](../app.py) |
| Dashboard | `/dashboard` | GET | [app.py](../app.py) |
| Usuario (perfil) | `/usuarios` | GET | [app.py](../app.py) |
| Cambiar contraseña | `/usuarios/password` | POST | [app.py](../app.py) |
| Kardex | `/kardex` | GET | [app.py](../app.py) |
| Productos (lista/buscar) | `/productos` | GET | [app.py](../app.py) |
| Crear producto | `/productos/crear` | POST | [app.py](../app.py) |
| Ingreso / Salida | `/productos/movimiento` | POST | [app.py](../app.py) |
| Reportes (vista previa) | `/reportes` | GET / POST | [app.py](../app.py) |
| Exportar Excel | `/reportes/exportar` | POST | [app.py](../app.py) |
| Cerrar sesión | `/logout` | GET | [app.py](../app.py) |
