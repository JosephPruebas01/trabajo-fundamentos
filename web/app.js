/* Front: consume la API de Flask (/api/...). Sin librerías 3D. */

const el = (id) => document.getElementById(id);
const money = (n) => "S/ " + Number(n || 0).toFixed(2);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fecha = (iso) => { const d = new Date(iso), z = (x) => String(x).padStart(2, "0");
    return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()} ${z(d.getHours())}:${z(d.getMinutes())}`; };

/** Llama a la API. Con cuerpo => POST JSON. Lanza el mensaje de error del backend. */
const api = (ruta, cuerpo) => fetch("/api/" + ruta, cuerpo
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) }
    : undefined).then(async r => { const d = await r.json(); if (!r.ok) throw d.error || "Error"; return d; });

let datos = { categorias: [], productos: [], movimientos: [] };
let sesion = null;
let vista = "dashboard";

/* ---------- UI ---------- */
function aviso(mensaje, tipo = "success") {
    const icono = { success: "check-circle", danger: "x-circle", warning: "exclamation-triangle", info: "info-circle" }[tipo];
    const t = document.createElement("div");
    t.className = `toast align-items-center text-bg-${tipo} border-0 show`;
    t.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${icono}"></i> ${esc(mensaje)}</div>
        <button class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    el("toastZone").appendChild(t);
    new bootstrap.Toast(t, { delay: 3200 }).show();
    t.addEventListener("hidden.bs.toast", () => t.remove());
}
const vacia = (cols, msg = "Sin registros.") => `<tr><td colspan="${cols}" class="text-center text-muted py-3">${msg}</td></tr>`;
function contar(elemento, fin) {
    const dur = 650, ini = performance.now();
    (function paso(t) {
        const p = Math.min(1, (t - ini) / dur);
        elemento.textContent = Math.round(fin * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(paso); else elemento.textContent = fin;
    })(ini);
}
const opciones = (sel, items, valor, texto, todos) =>
    sel.innerHTML = `<option value="">${todos}</option>` + items.map(i => `<option value="${esc(valor(i))}">${esc(texto(i))}</option>`).join("");

/* ---------- Navegación ---------- */
const TITULOS = { dashboard: "Dashboard", usuario: "Mi Usuario", kardex: "Kardex - Detalle de Productos", productos: "Gestión de Productos", reportes: "Reportes" };
const PINTAR = { dashboard: pintarDashboard, usuario: pintarUsuario, kardex: pintarKardex, productos: () => pintarProductos(), reportes: pintarReportes };

function mostrar(nombre) {
    vista = nombre;
    document.querySelectorAll("[data-section]").forEach(s => s.classList.toggle("d-none", s.dataset.section !== nombre));
    document.querySelectorAll(".sidebar .nav-link[data-view]").forEach(a => a.classList.toggle("active", a.dataset.view === nombre));
    el("pageTitle").textContent = TITULOS[nombre];
    const sec = document.querySelector(`[data-section="${nombre}"]`);
    sec.classList.remove("section-fade"); void sec.offsetWidth; sec.classList.add("section-fade");
    PINTAR[nombre]();
    el("sidebar").classList.remove("open");
}

/* ---------- Vistas ---------- */
function pintarDashboard() {
    const hoy = new Date().toDateString();
    const esHoy = (m) => new Date(m.fecha).toDateString() === hoy;
    const suma = (tipo) => datos.movimientos.filter(m => m.tipo === tipo && esHoy(m)).reduce((s, m) => s + m.cantidad, 0);
    contar(el("kpiProductos"), datos.productos.length);
    contar(el("kpiEntradas"), suma("E"));
    contar(el("kpiSalidas"), suma("S"));
    contar(el("kpiStockBajo"), datos.productos.filter(p => p.stock <= p.minimo).length);

    const ult = [...datos.movimientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);
    el("tablaMovimientos").innerHTML = ult.length ? ult.map(m => `<tr>
        <td>${fecha(m.fecha)}</td><td><code>${esc(m.sku)}</code></td><td>${esc(m.producto)}</td>
        <td>${m.tipo === "E" ? '<span class="badge bg-success">Entrada</span>' : '<span class="badge bg-danger">Salida</span>'}</td>
        <td class="text-end fw-semibold">${m.cantidad}</td></tr>`).join("") : vacia(5);
}

function pintarUsuario() {
    el("perfNombre").textContent = sesion.nombre;
    el("perfRol").textContent = sesion.rol;
    el("perfRol2").textContent = sesion.rol;
    el("perfUsuario").textContent = sesion.usuario;
}

function pintarKardex() {
    const ps = [...datos.productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
    el("kardexCount").textContent = ps.length + " productos";
    el("tablaKardex").innerHTML = ps.map(p => `<tr class="${p.stock <= p.minimo ? "table-warning-soft" : ""}">
        <td><code>${esc(p.sku)}</code></td><td>${esc(p.nombre)}</td><td>${esc(p.categoria)}</td>
        <td>${esc(p.tamano || "-")}</td><td>${esc(p.color || "-")}</td>
        <td class="text-end fw-bold">${p.stock}</td><td class="text-end">${p.minimo}</td>
        <td class="text-end">${money(p.costo)}</td><td class="text-end">${money(p.venta)}</td>
        <td class="text-center">${p.stock <= p.minimo ? '<span class="badge bg-danger">Stock bajo</span>' : '<span class="badge bg-success">OK</span>'}</td>
        </tr>`).join("") || vacia(10);
}

function pintarProductos(filtro = "") {
    const q = filtro.trim().toLowerCase();
    let ps = [...datos.productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
    if (q) ps = ps.filter(p => `${p.sku} ${p.nombre} ${p.categoria}`.toLowerCase().includes(q));
    el("tablaProductos").innerHTML = ps.length ? ps.map(p => `<tr class="${p.stock <= p.minimo ? "table-warning-soft" : ""}">
        <td><code>${esc(p.sku)}</code></td><td>${esc(p.nombre)}</td><td>${esc(p.categoria)}</td>
        <td class="text-end fw-bold">${p.stock}</td><td class="text-end">${p.minimo}</td><td class="text-end">${money(p.venta)}</td>
        <td class="text-center text-nowrap">
            <button class="btn btn-sm btn-success btn-mov" data-id="${p.id}" data-tipo="E"><i class="bi bi-box-arrow-in-down"></i> Ingreso</button>
            <button class="btn btn-sm btn-danger btn-mov" data-id="${p.id}" data-tipo="S"><i class="bi bi-box-arrow-up"></i> Salida</button>
        </td></tr>`).join("") : vacia(7, "No se encontraron productos.");
}

function pintarReportes() {
    opciones(el("fCategoria"), datos.categorias, c => c, c => c, "Todas");
    opciones(el("fProducto"), [...datos.productos].sort((a, b) => a.nombre.localeCompare(b.nombre)), p => p.id, p => p.nombre, "Todos");
    el("panelPreview").classList.add("d-none");
}

/* ---------- Reportes (se calculan en el front a partir de los datos) ---------- */
function armarReporte() {
    const cat = el("fCategoria").value;
    if (el("repStock").checked) {
        const soloBajo = el("fSoloBajo").value === "1";
        const filas = datos.productos
            .filter(p => (!cat || p.categoria === cat) && (!soloBajo || p.stock <= p.minimo))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
            .map(p => [p.sku, p.nombre, p.categoria, p.stock, p.minimo, p.venta, +(p.stock * p.venta).toFixed(2)]);
        return { nombre: "Reporte_Stock", cabecera: ["SKU", "Producto", "Categoría", "Stock", "Mínimo", "Precio Venta", "Valor Total"], filas };
    }
    const desde = el("fDesde").value, hasta = el("fHasta").value, prod = el("fProducto").value, tipo = el("fTipo").value;
    const categoriaDe = (sku) => (datos.productos.find(p => p.sku === sku) || {}).categoria;
    const filas = datos.movimientos.filter(m => {
        const f = m.fecha.slice(0, 10);
        return (!desde || f >= desde) && (!hasta || f <= hasta) && (!tipo || m.tipo === tipo)
            && (!prod || String((datos.productos.find(p => p.sku === m.sku) || {}).id) === prod)
            && (!cat || categoriaDe(m.sku) === cat);
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(m => [fecha(m.fecha), m.sku, m.producto, m.tipo === "E" ? "Entrada" : "Salida", m.cantidad, m.precio || 0, m.usuario]);
    return { nombre: "Reporte_Movimientos", cabecera: ["Fecha", "SKU", "Producto", "Tipo", "Cantidad", "Precio Unit.", "Usuario"], filas };
}
function previsualizar() {
    const r = armarReporte();
    el("repHead").innerHTML = "<tr>" + r.cabecera.map(h => `<th>${esc(h)}</th>`).join("") + "</tr>";
    el("repBody").innerHTML = r.filas.length
        ? r.filas.map(f => "<tr>" + f.map(c => `<td>${esc(c)}</td>`).join("") + "</tr>").join("")
        : vacia(r.cabecera.length, "Sin resultados para los filtros seleccionados.");
    el("repCount").textContent = r.filas.length + " filas";
    el("panelPreview").classList.remove("d-none");
}
function exportar() {
    const r = armarReporte();
    if (!r.filas.length) return aviso("No hay datos para exportar con esos filtros.", "warning");
    const hoja = XLSX.utils.aoa_to_sheet([r.cabecera, ...r.filas]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte");
    XLSX.writeFile(libro, r.nombre + ".xlsx");
    aviso("Excel generado: " + r.nombre + ".xlsx");
}

/* ---------- Eventos ---------- */
document.addEventListener("DOMContentLoaded", () => {
    el("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            sesion = await api("login", { usuario: el("loginUser").value.trim(), clave: el("loginPass").value });
            datos = await api("estado");
            el("loginError").classList.add("d-none");
            el("loginView").classList.add("d-none");
            el("appView").classList.remove("d-none");
            el("chipNombre").textContent = sesion.nombre;
            el("chipRol").textContent = sesion.rol;
            mostrar("dashboard");
        } catch (err) {
            el("loginError").textContent = err;
            el("loginError").classList.remove("d-none");
        }
    });

    el("btnLogout").addEventListener("click", (e) => {
        e.preventDefault(); sesion = null;
        el("appView").classList.add("d-none");
        el("loginView").classList.remove("d-none");
        el("loginForm").reset();
    });

    document.querySelectorAll(".sidebar .nav-link[data-view]").forEach(a =>
        a.addEventListener("click", (e) => { e.preventDefault(); mostrar(a.dataset.view); }));
    el("btnMenu").addEventListener("click", () => el("sidebar").classList.toggle("open"));

    el("formPassword").addEventListener("submit", async function (e) {
        e.preventDefault();
        const nueva = el("passNueva").value;
        if (nueva !== el("passConfirmar").value) return aviso("La nueva contraseña y su confirmación no coinciden.", "warning");
        try {
            await api("clave", { usuario: sesion.usuario, actual: el("passActual").value, nueva });
            this.reset(); aviso("Contraseña actualizada correctamente.");
        } catch (err) { aviso(err, "danger"); }
    });

    el("buscarProducto").addEventListener("input", (e) => pintarProductos(e.target.value));

    document.getElementById("modalNuevo").addEventListener("show.bs.modal", () =>
        el("nCategoria").innerHTML = datos.categorias.map(c => `<option>${esc(c)}</option>`).join(""));
    el("formNuevo").addEventListener("submit", async function (e) {
        e.preventDefault();
        try {
            await api("productos", {
                sku: el("nSku").value.trim(), nombre: el("nNombre").value.trim(), categoria: el("nCategoria").value,
                tamano: el("nTamano").value.trim(), color: el("nColor").value.trim(),
                costo: el("nCosto").value, venta: el("nVenta").value, stock: el("nStock").value, minimo: el("nMin").value,
            });
            datos = await api("estado");
            bootstrap.Modal.getInstance(document.getElementById("modalNuevo")).hide();
            this.reset(); pintarProductos(el("buscarProducto").value); aviso("Producto creado correctamente.");
        } catch (err) { aviso(err, "danger"); }
    });

    const modalMov = new bootstrap.Modal(document.getElementById("modalMov"));
    el("tablaProductos").addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-mov");
        if (!btn) return;
        const p = datos.productos.find(x => x.id === Number(btn.dataset.id));
        const ingreso = btn.dataset.tipo === "E";
        el("movId").value = p.id; el("movTipo").value = btn.dataset.tipo;
        el("movNombre").textContent = p.nombre; el("movStock").textContent = p.stock;
        el("movPrecio").value = ingreso ? p.costo : p.venta; el("movCantidad").value = "";
        el("movTitulo").textContent = (ingreso ? "Ingreso" : "Salida") + " de producto";
        el("movSubmit").className = "btn " + (ingreso ? "btn-success" : "btn-danger");
        el("movSubmit").textContent = ingreso ? "Registrar ingreso" : "Registrar salida";
        modalMov.show();
    });
    el("formMov").addEventListener("submit", async function (e) {
        e.preventDefault();
        try {
            await api("movimientos", {
                producto_id: Number(el("movId").value), tipo: el("movTipo").value,
                cantidad: el("movCantidad").value, precio: parseFloat(el("movPrecio").value) || null,
                usuario: sesion.usuario,
            });
            datos = await api("estado");
            modalMov.hide(); this.reset(); pintarProductos(el("buscarProducto").value);
            aviso("Movimiento registrado correctamente.");
        } catch (err) { aviso(err, "warning"); }
    });

    document.querySelectorAll('input[name="tipoReporte"]').forEach(r => r.addEventListener("change", () => {
        el("filtrosMov").classList.toggle("d-none", el("repStock").checked);
        el("filtrosStock").classList.toggle("d-none", !el("repStock").checked);
        el("panelPreview").classList.add("d-none");
    }));
    el("btnGenerar").addEventListener("click", previsualizar);
    el("btnExcel").addEventListener("click", exportar);
});
