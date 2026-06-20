import pyodbc

try:
    conn = pyodbc.connect(
        r"DRIVER={ODBC Driver 18 for SQL Server};"
        r"SERVER=(localdb)\FUNDAMENTOS;"
        r"DATABASE=LogisticaDB;"
        r"Trusted_Connection=yes;"
        r"TrustServerCertificate=yes;"
    )

    print("Conexión exitosa")

    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM Productos")

    total = cursor.fetchone()[0]

    print(f"Total productos: {total}")

    conn.close()

except Exception as e:
    print("Error:")
    print(e)