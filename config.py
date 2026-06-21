import os

# -------------------------------------------------------------------
# Conexion a la base de datos.
#
# Por defecto apunta al SQL Server que corre en Docker (servicio
# "sqlserver" expuesto en localhost,1433 con usuario sa). Todo se puede
# sobrescribir con variables de entorno sin tocar el codigo.
#
# Para usar la instancia LocalDB de Windows en su lugar:
#     set DB_TRUSTED=1
#     set DB_SERVER=(localdb)\FUNDAMENTOS
# -------------------------------------------------------------------

SERVER = os.environ.get("DB_SERVER", "localhost,1433")
DATABASE = os.environ.get("DB_DATABASE", "LogisticaDB")
DB_USER = os.environ.get("DB_USER", "sa")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "Logistica#2024")
DB_DRIVER = os.environ.get("DB_DRIVER", "ODBC Driver 18 for SQL Server")

# DB_TRUSTED=1 -> autenticacion de Windows (LocalDB). Si no, usuario/clave.
USE_TRUSTED = os.environ.get("DB_TRUSTED", "0") == "1"

if USE_TRUSTED:
    CONNECTION_STRING = (
        f"DRIVER={{{DB_DRIVER}}};"
        f"SERVER={SERVER};"
        f"DATABASE={DATABASE};"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    )
else:
    CONNECTION_STRING = (
        f"DRIVER={{{DB_DRIVER}}};"
        f"SERVER={SERVER};"
        f"DATABASE={DATABASE};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD};"
        "TrustServerCertificate=yes;"
    )

SECRET_KEY = os.environ.get("SECRET_KEY", "Logistica2026")
