import os

SERVER = os.environ.get("DB_SERVER", r"(localdb)\FUNDAMENTOS")
DATABASE = os.environ.get("DB_DATABASE", "LogisticaDB")

# Trusted_Connection solo funciona con autenticación integrada de Windows, así
# que fuera de Windows (contenedor, servidor Linux) hay que pasar la cadena
# completa por DB_CONNECTION_STRING.
CONNECTION_STRING = os.environ.get(
    "DB_CONNECTION_STRING",
    (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};"
        f"SERVER={SERVER};"
        f"DATABASE={DATABASE};"
        "Trusted_Connection=yes;"
        "TrustServerCertificate=yes;"
    ),
)

SECRET_KEY = "Logistica2026"