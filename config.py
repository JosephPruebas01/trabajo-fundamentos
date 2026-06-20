SERVER = r"(localdb)\FUNDAMENTOS"
DATABASE = "LogisticaDB"

CONNECTION_STRING = (
    f"DRIVER={{ODBC Driver 18 for SQL Server}};"
    f"SERVER={SERVER};"
    f"DATABASE={DATABASE};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

SECRET_KEY = "Logistica2026"