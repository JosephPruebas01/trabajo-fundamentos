"""Helpers de acceso a datos.

Centraliza la conexion a SQL Server y expone funciones simples que
devuelven las filas como diccionarios, para no repetir cursores ni
SELECT * por toda la aplicacion.
"""

import pyodbc
from config import CONNECTION_STRING


def get_connection():
    return pyodbc.connect(CONNECTION_STRING)


def fetch_all(query, params=()):
    """Devuelve una lista de diccionarios (una por fila)."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        columnas = [c[0] for c in cursor.description]
        return [dict(zip(columnas, fila)) for fila in cursor.fetchall()]
    finally:
        conn.close()


def fetch_one(query, params=()):
    """Devuelve un diccionario con la primera fila, o None."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        columnas = [c[0] for c in cursor.description]
        fila = cursor.fetchone()
        return dict(zip(columnas, fila)) if fila else None
    finally:
        conn.close()


def execute(query, params=()):
    """Ejecuta INSERT/UPDATE/DELETE y confirma. Devuelve filas afectadas."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()


def registrar_movimiento(id_producto, tipo, cantidad, precio_unitario,
                         observacion, id_usuario):
    """Registra un movimiento (E/S) y ajusta el stock en una sola
    transaccion. Si es salida valida que haya stock suficiente.

    Lanza ValueError con un mensaje claro si algo no cuadra.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT StockActual FROM Productos WHERE IdProducto = ?",
            (id_producto,),
        )
        fila = cursor.fetchone()
        if fila is None:
            raise ValueError("El producto no existe.")

        stock_actual = fila[0]
        if tipo == "S" and cantidad > stock_actual:
            raise ValueError(
                f"Stock insuficiente. Disponible: {stock_actual}, solicitado: {cantidad}."
            )

        cursor.execute(
            """
            INSERT INTO MovimientosInventario
                (IdProducto, TipoMovimiento, Cantidad, PrecioUnitario, Observacion, IdUsuario)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (id_producto, tipo, cantidad, precio_unitario, observacion, id_usuario),
        )

        delta = cantidad if tipo == "E" else -cantidad
        cursor.execute(
            "UPDATE Productos SET StockActual = StockActual + ? WHERE IdProducto = ?",
            (delta, id_producto),
        )

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
