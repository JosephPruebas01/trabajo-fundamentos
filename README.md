# Trabajo - Fundamentos

Este repositorio contiene una pequeña aplicación de ejemplo usada para ejercicios y prácticas de fundamentos de programación y desarrollo web en Python. El objetivo principal es proporcionar una base clara y reproducible para probar componentes como la conexión a base de datos, lógica de negocio y una interfaz web sencilla usando plantillas en la carpeta `templates`.

## Objetivo

El objetivo del repositorio es servir como entorno de aprendizaje y prueba para:

- Probar la lógica de acceso a datos y drivers (tests: `test_db.py`, `test_driver.py`).
- Mostrar una aplicación web ligera con rutas y plantillas en `app.py` y `templates/`.
- Demostrar organización mínima de un proyecto: configuración centralizada en `config.py`, archivos estáticos en `static/` y código ejecutable en `app.py`.

## Características

- Estructura sencilla y fácil de entender.
- Tests unitarios básicos para la lógica de datos y drivers.
- Plantillas HTML en `templates/` y recursos estáticos en `static/src`.

## Estructura del proyecto

- `app.py` - Punto de entrada de la aplicación (servidor / rutas).
- `config.py` - Configuración y variables globales.
- `templates/` - Plantillas HTML (por ejemplo, `dashboard.html`, `login.html`).
- `static/` - Archivos estáticos (CSS, JS, imágenes).
- `test_db.py`, `test_driver.py` - Pruebas automáticas.

## Requisitos

- Python 3.8+ recomendado.
- (Opcional) `virtualenv` o `venv` para entornos aislados.

## Instalación y ejecución

1. Crear y activar un entorno virtual:

	- En Windows PowerShell:

```
python -m venv venv
.\venv\Scripts\Activate.ps1
```

	- En WSL o macOS/Linux:

```
python3 -m venv venv
source venv/bin/activate
```

2. Instalar dependencias (si existe `requirements.txt`):

```
pip install -r requirements.txt
```

3. Ejecutar la aplicación:

```
python app.py
```

La aplicación por defecto escucha en `localhost` y el puerto configurado en `config.py`.

## Pruebas

Ejecutar las pruebas unitarias con `pytest` (o `python -m pytest`):

```
pytest
```

## Contribuciones

Si quieres contribuir:

- Abre una issue describiendo el cambio o la mejora.
- Crea una rama con un nombre descriptivo y un PR con la explicación de los cambios.
- Asegúrate de que las pruebas existentes pasan y añade nuevas pruebas cuando corresponda.

## Notas adicionales

- Revisa `config.py` para ajustar variables de entorno, rutas o puertos.
- Las plantillas y estilos están en `templates/` y `static/src/` respectivamente; si añades recursos estáticos sigue la estructura existente.

## Licencia y contacto

Incluye la licencia del proyecto aquí (por ejemplo, MIT) y un correo o referencia de contacto si procede.

---

Si quieres que adapte el README a un estilo más formal, añada secciones de despliegue u otro idioma, dímelo y lo actualizo.

## Ejecutar todo con Docker

El `docker-compose.yml` levanta el sistema completo con un solo comando:

```bash
docker compose up --build
```

Arranca en orden, con healthchecks:

1. **sqlserver** — SQL Server 2022.
2. **db-init** — crea la base `LogisticaDB`.
3. **liquibase** — aplica el esquema y los datos de ejemplo (ver [liquibase/README.md](liquibase/README.md)).
4. **app** — la aplicación Flask.

Luego abre **http://localhost:8000**.

### Usuarios de ejemplo

| Usuario    | Contraseña    | Rol      |
|------------|---------------|----------|
| `admin`    | `admin123`    | ADMIN    |
| `operador` | `operador123` | OPERADOR |

### Funcionalidades

- **Login** con sesión y rutas protegidas.
- **Dashboard** con KPIs (productos, entradas/salidas del día, stock bajo) y últimos movimientos.
- **Usuario**: datos del perfil, rol y cambio de contraseña.
- **Kardex**: detalle total de productos con resaltado de stock bajo.
- **Productos**: búsqueda, alta de productos e ingresos/salidas (ajustan el stock en una transacción).
- **Reportes**: filtros (movimientos o stock) con exportación a Excel.
- Efectos 3D con **Vanta.js** (fondo animado) y **VanillaTilt** (tarjetas).

### Notas

- La app se ejecuta en `linux/amd64` (igual que SQL Server) e incluye el driver
  `ODBC Driver 18`. La conexión se configura por variables de entorno (`DB_SERVER`,
  `DB_USER`, etc.) en el servicio `app` del compose.
- El puerto del host es **8000** (el 5000 suele estar ocupado por AirPlay en macOS).
- Para empezar de cero: `docker compose down -v` y vuelve a `docker compose up --build`.

