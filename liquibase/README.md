# LogisticaDB — SQL Server + Liquibase en Docker

Levanta SQL Server 2022 en Docker y aplica el esquema con **Liquibase**:
tablas `Usuarios`, `Categorias`, `Productos`, `MovimientosInventario`,
`Clientes`, `Ventas`, `DetalleVentas` y las vistas `vw_ProductosStockBajo`
y `vw_Dashboard`.

## Estructura

```
docker-compose.yml                  # (en la raíz del repo)
liquibase/
  liquibase.properties              # conexión + ruta del changelog
  changelog/
    db.changelog-master.sql         # esquema en formato Liquibase
```

## Cómo correrlo

Desde la raíz del repo:

```bash
docker compose up
```

Qué hace, en orden:

1. **sqlserver**: arranca SQL Server 2022 y espera a estar `healthy`.
2. **db-init**: crea la base `LogisticaDB` (Liquibase necesita que exista).
3. **liquibase**: aplica el changelog (`update`) sobre `LogisticaDB`.

Cuando el contenedor `logistica_liquibase` termina con código 0, el esquema
ya está creado. `db-init` y `liquibase` son de un solo uso y se detienen;
`sqlserver` sigue corriendo.

## Conexión a la base

| Parámetro | Valor |
|-----------|-------|
| Host      | `localhost` |
| Puerto    | `1433` |
| Usuario   | `sa` |
| Password  | `Logistica#2024` |
| Base      | `LogisticaDB` |

Verificar las tablas creadas:

```bash
docker exec -it logistica_sqlserver \
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Logistica#2024" -C \
  -d LogisticaDB -Q "SELECT name FROM sys.tables ORDER BY name;"
```

## Comandos Liquibase útiles

Al usar `docker compose run` hay que pasar el `--defaults-file` (el comando del
servicio se reemplaza por el que escribes):

```bash
DF=--defaults-file=/liquibase/project/liquibase.properties
docker compose run --rm liquibase $DF status --verbose   # qué falta por aplicar
docker compose run --rm liquibase $DF update             # aplicar cambios nuevos
docker compose run --rm liquibase $DF rollback-count 1   # deshacer el último changeset
docker compose run --rm liquibase $DF clear-checksums    # recalcular checksums
```

## Empezar de cero

```bash
docker compose down -v   # borra el volumen y el historial de Liquibase
docker compose up
```

## Correr la app web

El `docker compose up` también construye y levanta el servicio **app** (Flask):

- Abre **http://localhost:5000**
- Login de ejemplo: `admin` / `admin123` (rol ADMIN) u `operador` / `operador123`

La app lee la conexión desde variables de entorno (ver `config.py`); en el
contenedor `app` se le pasa `DB_SERVER=sqlserver,1433` para usar la red interna
de Docker. Para correrla **fuera de Docker** (en tu máquina) necesitas el driver
`ODBC Driver 18 for SQL Server` instalado y luego:

```bash
pip install -r requirements.txt
# config.py ya apunta por defecto a localhost,1433 (sa / Logistica#2024)
python app.py
```

## Notas

- El script original es T-SQL. En Liquibase se quitan `CREATE DATABASE`, `USE`
  y los `GO`: la base la crea `db-init` y cada changeset es su propio batch.
- Cada `CREATE VIEW` va en un changeset aparte (`splitStatements:false`)
  porque en SQL Server debe ser la única sentencia del batch.
- Liquibase registra lo aplicado en `DATABASECHANGELOG` /
  `DATABASECHANGELOGLOCK` dentro de `LogisticaDB`, así que `update` es
  idempotente: no reejecuta lo ya aplicado.
