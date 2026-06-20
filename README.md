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

Aquí tienes instrucciones básicas para contenerizar y ejecutar la aplicación con Docker.

### Dockerfile (ejemplo)

```
FROM python:3.11-slim
WORKDIR /app

# Copiar archivos de requisitos si existen
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt || true

# Copiar el código de la aplicación
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

Notas:
- Ajusta la versión de Python si tu proyecto lo requiere.
- Si no usas `requirements.txt`, elimina la línea `RUN pip install...` y gestiona dependencias de otra forma.

### docker-compose (ejemplo)

```
version: '3.8'
services:
	app:
		build: .
		ports:
			- "5000:5000"
		environment:
			- FLASK_ENV=production
		volumes:
			- .:/app  # útil en desarrollo; elimínalo en producción
```

### Comandos comunes para el proyecto

- Construir imagen:

```
docker build -t trabajo-fundamentos .
```

- Ejecutar con Docker:

```
docker run -p 5000:5000 --env-file .env trabajo-fundamentos
```

- Levantar con docker-compose:

```
docker-compose up --build
```

### Buenas prácticas

- Usa un archivo `.env` para variables sensibles y no lo subas al repositorio.
- En producción, evita montar el código con `volumes:` y usa imágenes construidas reproduciblemente.
- Considera usar un servidor de aplicaciones (Gunicorn, Uvicorn) si la app necesita escalado.

