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

## Despliegue con Docker

El `Dockerfile` de la raíz construye una imagen basada en `python:3.12-slim` que incluye el
driver `ODBC Driver 18 for SQL Server` (necesario para `pyodbc`) y sirve la aplicación con
Gunicorn en el puerto **8000**.

Construir la imagen:

```
docker build -t trabajo-fundamentos .
```

Ejecutarla:

```
docker run -p 8000:8000 -e DB_CONNECTION_STRING="..." trabajo-fundamentos
```

La aplicación queda disponible en `http://localhost:8000`.

### Conexión a la base de datos desde el contenedor

`config.py` usa por defecto `(localdb)\FUNDAMENTOS` con `Trusted_Connection=yes`, que es
autenticación integrada de Windows y **no funciona dentro del contenedor** (la imagen es
Linux y LocalDB no es accesible desde ahí). Para desplegar hay que apuntar a una instancia
real de SQL Server pasando la cadena completa por variable de entorno:

```
docker run -p 8000:8000 \
  -e DB_CONNECTION_STRING="DRIVER={ODBC Driver 18 for SQL Server};SERVER=mi-servidor,1433;DATABASE=LogisticaDB;UID=usuario;PWD=contraseña;TrustServerCertificate=yes;" \
  trabajo-fundamentos
```

Sin esa variable, la app arranca y sirve la pantalla de login, pero el inicio de sesión
fallará al intentar conectarse.

## Integración continua

El workflow `.github/workflows/ci.yml` se ejecuta en cada push a `main`, `develop` y
`feature/**`, y en cada pull request hacia `main` o `develop`. Comprueba tres cosas:

1. **Lint** — `ruff check .` sobre todo el código.
2. **Arranque** — instala las dependencias y verifica que la aplicación se importa y registra sus rutas.
3. **Docker** — construye la imagen para garantizar que el `Dockerfile` sigue siendo válido.

Los scripts `test_db.py` y `test_driver.py` no se ejecutan en CI porque requieren una base
de datos SQL Server accesible.

