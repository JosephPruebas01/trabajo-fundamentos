"""Backend del sistema de logística. Front en JS, datos en memoria (sin BD)."""
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder="web", static_url_path="")

CATEGORIAS = ["Cuidado Capilar", "Coloración", "Herramientas", "Accesorios"]
USUARIOS = {
    "admin":    {"clave": "admin123",    "nombre": "Administrador General", "rol": "ADMIN"},
    "operador": {"clave": "operador123", "nombre": "María Operadora",       "rol": "OPERADOR"},
}


def producto(id, sku, nombre, categoria, tamano, color, costo, venta, stock, minimo):
    return locals()


productos = [
    producto(1,  "SH-001", "Shampoo Hidratante 1L",      "Cuidado Capilar", "1L",    "Transparente", 18,  32, 40, 10),
    producto(2,  "AC-001", "Acondicionador Reparador 1L","Cuidado Capilar", "1L",    "Blanco",       20,  35, 25, 10),
    producto(3,  "TR-001", "Tratamiento Keratina 500ml", "Cuidado Capilar", "500ml", "Ámbar",        30,  55,  4,  5),
    producto(4,  "TN-001", "Tinte Rubio Ceniza",         "Coloración",      "120ml", "Rubio",        12,  25, 30,  8),
    producto(5,  "TN-002", "Tinte Negro Intenso",        "Coloración",      "120ml", "Negro",        12,  25,  5,  8),
    producto(6,  "DC-001", "Decolorante en Polvo 500g",  "Coloración",      "500g",  "Blanco",       15,  28, 18,  6),
    producto(7,  "TJ-001", "Tijera Profesional 6\"",     "Herramientas",    "6 pulg","Plateado",     40,  85,  6,  3),
    producto(8,  "SE-001", "Secadora 2000W",             "Herramientas",    "Estd.", "Negro",        90, 160,  4,  2),
    producto(9,  "PL-001", "Plancha Cerámica",           "Herramientas",    "Estd.", "Rosa",         70, 130,  3,  2),
    producto(10, "PE-001", "Peine de Carbono",           "Accesorios",      "22cm",  "Negro",         3,   8, 50, 15),
    producto(11, "CA-001", "Capa de Corte",              "Accesorios",      "Único", "Negro",         8,  18, 12,  5),
]
movimientos = []
secuencia = {"producto": len(productos) + 1, "movimiento": 1}


def registrar(p, tipo, cantidad, precio, usuario):
    movimientos.append({
        "id": secuencia["movimiento"], "fecha": datetime.now().isoformat(timespec="minutes"),
        "sku": p["sku"], "producto": p["nombre"], "tipo": tipo,
        "cantidad": cantidad, "precio": precio, "usuario": usuario,
    })
    secuencia["movimiento"] += 1


# Movimientos de ejemplo (no alteran el stock, son historial inicial)
for sku, tipo, cantidad, precio in [("SH-001", "E", 40, 18), ("AC-001", "E", 25, 20), ("TN-001", "E", 30, 12),
                                    ("SH-001", "S", 5, 32), ("TN-001", "S", 3, 25), ("TJ-001", "S", 1, 85)]:
    registrar(next(p for p in productos if p["sku"] == sku), tipo, cantidad, precio, "admin")


@app.get("/")
def inicio():
    return send_from_directory("web", "index.html")


@app.post("/api/login")
def login():
    d = request.get_json()
    u = USUARIOS.get(d.get("usuario", ""))
    if u and u["clave"] == d.get("clave"):
        return jsonify(usuario=d["usuario"], nombre=u["nombre"], rol=u["rol"])
    return jsonify(error="Usuario o contraseña incorrectos"), 401


@app.get("/api/estado")
def estado():
    return jsonify(categorias=CATEGORIAS, productos=productos, movimientos=movimientos)


@app.post("/api/productos")
def crear_producto():
    d = request.get_json()
    if any(p["sku"].lower() == d["sku"].lower() for p in productos):
        return jsonify(error="Ya existe un producto con ese SKU"), 400
    nuevo = producto(secuencia["producto"], d["sku"], d["nombre"], d["categoria"],
                     d.get("tamano", ""), d.get("color", ""),
                     float(d["costo"]), float(d["venta"]), int(d.get("stock", 0)), int(d.get("minimo", 0)))
    secuencia["producto"] += 1
    productos.append(nuevo)
    return jsonify(nuevo), 201


@app.post("/api/movimientos")
def mover():
    d = request.get_json()
    p = next((x for x in productos if x["id"] == d["producto_id"]), None)
    cantidad, tipo = int(d["cantidad"]), d["tipo"]
    if not p:
        return jsonify(error="Producto no encontrado"), 404
    if cantidad <= 0:
        return jsonify(error="La cantidad debe ser mayor a cero"), 400
    if tipo == "S" and cantidad > p["stock"]:
        return jsonify(error=f"Stock insuficiente. Disponible: {p['stock']}"), 400
    p["stock"] += cantidad if tipo == "E" else -cantidad
    registrar(p, tipo, cantidad, d.get("precio"), d.get("usuario", ""))
    return jsonify(stock=p["stock"])


@app.post("/api/clave")
def cambiar_clave():
    d = request.get_json()
    u = USUARIOS.get(d["usuario"])
    if not u or u["clave"] != d["actual"]:
        return jsonify(error="La contraseña actual no es correcta"), 400
    u["clave"] = d["nueva"]
    return jsonify(ok=True)


if __name__ == "__main__":
    app.run(debug=True)
