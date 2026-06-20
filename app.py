from flask import Flask, render_template, request, session, redirect, url_for
import pyodbc
from config import CONNECTION_STRING

app = Flask(__name__)
app.secret_key = "tu_clave_secreta"
@app.route("/", methods=["GET", "POST"])
def login():

    if request.method == "POST":
        print("POST recibido")
        usuario = request.form["usuario"]
        password = request.form["password"]

        conexion = pyodbc.connect(CONNECTION_STRING)

        cursor = conexion.cursor()

        cursor.execute("""
            SELECT *
            FROM Usuarios
            WHERE Usuario = ?
            AND PasswordHash = ?
            AND Activo = 1
        """, (usuario, password))

        usuario_db = cursor.fetchone()

        conexion.close()

        if usuario_db:
            session["usuario"] = usuario
            return render_template("dashboard.html", usuario=usuario)
        return "Usuario o contraseña incorrectos"

    return render_template("login.html")


@app.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True)

