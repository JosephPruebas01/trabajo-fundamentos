/* =========================================================
   Peluquería Mary - Sistema de Logística (versión simple)
   100% navegador: sin servidor, sin base de datos.
   Los datos viven en memoria y se guardan en localStorage.
   ========================================================= */
(function () {
    'use strict';

    const STORAGE_KEY = 'peluqueriaMary_v1';
    const MONEDA = 'S/';

    /* -------------------- Datos de ejemplo (seed) -------------------- */
    function seed() {
        const hoy = new Date().toISOString();
        const P = (id, sku, nombre, categoria, tamano, color, costo, venta, stock, min) =>
            ({ id, sku, nombre, categoria, peso: 0, tamano, color, costo, venta, stock, min });

        return {
            categorias: ['Cuidado Capilar', 'Coloración', 'Herramientas', 'Accesorios'],
            usuarios: [
                { usuario: 'admin', password: 'admin123', nombre: 'Administrador General', rol: 'ADMIN', fecha: '15/01/2026' },
                { usuario: 'operador', password: 'operador123', nombre: 'María Operadora', rol: 'OPERADOR', fecha: '01/02/2026' }
            ],
            productos: [
                P(1, 'SH-001', 'Shampoo Hidratante 1L', 'Cuidado Capilar', '1L', 'Transparente', 18, 32, 40, 10),
                P(2, 'AC-001', 'Acondicionador Reparador 1L', 'Cuidado Capilar', '1L', 'Blanco', 20, 35, 25, 10),
                P(3, 'TR-001', 'Tratamiento Keratina 500ml', 'Cuidado Capilar', '500ml', 'Ámbar', 30, 55, 4, 5),
                P(4, 'TN-001', 'Tinte Rubio Ceniza', 'Coloración', '120ml', 'Rubio', 12, 25, 30, 8),
                P(5, 'TN-002', 'Tinte Negro Intenso', 'Coloración', '120ml', 'Negro', 12, 25, 5, 8),
                P(6, 'DC-001', 'Decolorante en Polvo 500g', 'Coloración', '500g', 'Blanco', 15, 28, 18, 6),
                P(7, 'TJ-001', 'Tijera Profesional 6"', 'Herramientas', '6 pulg', 'Plateado', 40, 85, 6, 3),
                P(8, 'SE-001', 'Secadora 2000W', 'Herramientas', 'Estándar', 'Negro', 90, 160, 4, 2),
                P(9, 'PL-001', 'Plancha Cerámica', 'Herramientas', 'Estándar', 'Rosa', 70, 130, 3, 2),
                P(10, 'PE-001', 'Peine de Carbono', 'Accesorios', '22cm', 'Negro', 3, 8, 50, 15),
                P(11, 'CA-001', 'Capa de Corte', 'Accesorios', 'Único', 'Negro', 8, 18, 12, 5)
            ],
            movimientos: [
                { id: 1, fecha: hoy, productoId: 1, sku: 'SH-001', producto: 'Shampoo Hidratante 1L', tipo: 'E', cantidad: 40, precio: 18, usuario: 'admin' },
                { id: 2, fecha: hoy, productoId: 2, sku: 'AC-001', producto: 'Acondicionador Reparador 1L', tipo: 'E', cantidad: 25, precio: 20, usuario: 'admin' },
                { id: 3, fecha: hoy, productoId: 4, sku: 'TN-001', producto: 'Tinte Rubio Ceniza', tipo: 'E', cantidad: 30, precio: 12, usuario: 'admin' },
                { id: 4, fecha: hoy, productoId: 1, sku: 'SH-001', producto: 'Shampoo Hidratante 1L', tipo: 'S', cantidad: 5, precio: 32, usuario: 'admin' },
                { id: 5, fecha: hoy, productoId: 4, sku: 'TN-001', producto: 'Tinte Rubio Ceniza', tipo: 'S', cantidad: 3, precio: 25, usuario: 'admin' },
                { id: 6, fecha: hoy, productoId: 7, sku: 'TJ-001', producto: 'Tijera Profesional 6"', tipo: 'S', cantidad: 1, precio: 85, usuario: 'admin' }
            ],
            nextProductoId: 12,
            nextMovId: 7
        };
    }

    /* -------------------- Persistencia -------------------- */
    let db, sesion = null;

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* file:// o modo privado: usamos memoria */ }
        const s = seed();
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { }
        return s;
    }
    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) { }
    }

    /* -------------------- Utilidades -------------------- */
    const $ = (id) => document.getElementById(id);
    const money = (n) => MONEDA + ' ' + Number(n || 0).toFixed(2);
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function fmtFecha(iso) {
        const d = new Date(iso);
        const p = (x) => String(x).padStart(2, '0');
        return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
    function toast(msg, tipo = 'success') {
        const iconos = { success: 'check-circle', danger: 'x-circle', warning: 'exclamation-triangle', info: 'info-circle' };
        const el = document.createElement('div');
        el.className = `toast align-items-center text-bg-${tipo} border-0 show`;
        el.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${iconos[tipo] || 'info-circle'}"></i> ${esc(msg)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
        $('toastZone').appendChild(el);
        const t = new bootstrap.Toast(el, { delay: 3200 });
        t.show();
        el.addEventListener('hidden.bs.toast', () => el.remove());
    }
    function filaVacia(cols, msg = 'Sin registros.') {
        return `<tr><td colspan="${cols}" class="text-center text-muted py-3">${msg}</td></tr>`;
    }
    function animar(el, valor) {
        const dur = 650, ini = performance.now();
        (function tick(now) {
            const t = Math.min(1, (now - ini) / dur);
            el.textContent = Math.round(valor * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(tick); else el.textContent = valor;
        })(ini);
    }

    /* -------------------- Navegación -------------------- */
    const TITULOS = { dashboard: 'Dashboard', usuario: 'Mi Usuario', kardex: 'Kardex - Detalle de Productos', productos: 'Gestión de Productos', reportes: 'Reportes' };
    const RENDERS = { dashboard: renderDashboard, usuario: renderUsuario, kardex: renderKardex, productos: () => renderProductos(), reportes: renderReportes };

    function showView(nombre) {
        document.querySelectorAll('[data-section]').forEach(s =>
            s.classList.toggle('d-none', s.dataset.section !== nombre));
        document.querySelectorAll('.sidebar .nav-link[data-view]').forEach(a =>
            a.classList.toggle('active', a.dataset.view === nombre));
        $('pageTitle').textContent = TITULOS[nombre] || '';
        const sec = document.querySelector(`[data-section="${nombre}"]`);
        if (sec) { sec.classList.remove('section-fade'); void sec.offsetWidth; sec.classList.add('section-fade'); }
        (RENDERS[nombre] || function () { })();
        $('sidebar').classList.remove('open');
    }

    /* -------------------- Render: Dashboard -------------------- */
    function renderDashboard() {
        const hoy = new Date().toDateString();
        const esHoy = (m) => new Date(m.fecha).toDateString() === hoy;
        animar($('kpiProductos'), db.productos.length);
        animar($('kpiEntradas'), db.movimientos.filter(m => m.tipo === 'E' && esHoy(m)).reduce((s, m) => s + m.cantidad, 0));
        animar($('kpiSalidas'), db.movimientos.filter(m => m.tipo === 'S' && esHoy(m)).reduce((s, m) => s + m.cantidad, 0));
        animar($('kpiStockBajo'), db.productos.filter(p => p.stock <= p.min).length);

        const ult = [...db.movimientos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 10);
        $('tablaMovimientos').innerHTML = ult.length ? ult.map(m => `
            <tr>
                <td>${fmtFecha(m.fecha)}</td>
                <td><code>${esc(m.sku)}</code></td>
                <td>${esc(m.producto)}</td>
                <td>${m.tipo === 'E' ? '<span class="badge bg-success">Entrada</span>' : '<span class="badge bg-danger">Salida</span>'}</td>
                <td class="text-end fw-semibold">${m.cantidad}</td>
            </tr>`).join('') : filaVacia(5);
    }

    /* -------------------- Render: Usuario -------------------- */
    function renderUsuario() {
        $('perfNombre').textContent = sesion.nombre;
        $('perfRol').textContent = sesion.rol;
        $('perfRol2').textContent = sesion.rol;
        $('perfUsuario').textContent = sesion.usuario;
        $('perfFecha').textContent = sesion.fecha;
    }

    /* -------------------- Render: Kardex -------------------- */
    function renderKardex() {
        const ps = [...db.productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
        $('kardexCount').textContent = ps.length + ' productos';
        $('tablaKardex').innerHTML = ps.length ? ps.map(p => {
            const bajo = p.stock <= p.min;
            return `<tr class="${bajo ? 'table-warning-soft' : ''}">
                <td><code>${esc(p.sku)}</code></td>
                <td>${esc(p.nombre)}</td>
                <td>${esc(p.categoria)}</td>
                <td>${esc(p.tamano || '-')}</td>
                <td>${esc(p.color || '-')}</td>
                <td class="text-end fw-bold">${p.stock}</td>
                <td class="text-end">${p.min}</td>
                <td class="text-end">${money(p.costo)}</td>
                <td class="text-end">${money(p.venta)}</td>
                <td class="text-center">${bajo ? '<span class="badge bg-danger">Stock bajo</span>' : '<span class="badge bg-success">OK</span>'}</td>
            </tr>`;
        }).join('') : filaVacia(10);
    }

    /* -------------------- Render: Productos -------------------- */
    function renderProductos(filtro = '') {
        const q = filtro.trim().toLowerCase();
        let ps = [...db.productos].sort((a, b) => a.nombre.localeCompare(b.nombre));
        if (q) ps = ps.filter(p => (p.sku + ' ' + p.nombre + ' ' + p.categoria).toLowerCase().includes(q));

        $('tablaProductos').innerHTML = ps.length ? ps.map(p => {
            const bajo = p.stock <= p.min;
            return `<tr class="${bajo ? 'table-warning-soft' : ''}">
                <td><code>${esc(p.sku)}</code></td>
                <td>${esc(p.nombre)}</td>
                <td>${esc(p.categoria)}</td>
                <td class="text-end fw-bold">${p.stock}</td>
                <td class="text-end">${p.min}</td>
                <td class="text-end">${money(p.venta)}</td>
                <td class="text-center text-nowrap">
                    <button class="btn btn-sm btn-success btn-mov" data-id="${p.id}" data-tipo="E"><i class="bi bi-box-arrow-in-down"></i> Ingreso</button>
                    <button class="btn btn-sm btn-danger btn-mov" data-id="${p.id}" data-tipo="S"><i class="bi bi-box-arrow-up"></i> Salida</button>
                </td>
            </tr>`;
        }).join('') : filaVacia(7, 'No se encontraron productos.');
    }

    /* -------------------- Render: Reportes -------------------- */
    function llenarSelect(sel, items, valueFn, textFn, placeholder) {
        sel.innerHTML = `<option value="">${placeholder}</option>` +
            items.map(i => `<option value="${esc(valueFn(i))}">${esc(textFn(i))}</option>`).join('');
    }
    function renderReportes() {
        llenarSelect($('fCategoria'), db.categorias, c => c, c => c, 'Todas');
        llenarSelect($('fProducto'), [...db.productos].sort((a, b) => a.nombre.localeCompare(b.nombre)),
            p => p.id, p => p.nombre, 'Todos');
        $('panelPreview').classList.add('d-none');
    }
    function toggleFiltrosReporte() {
        const stock = $('repStock').checked;
        $('filtrosMov').classList.toggle('d-none', stock);
        $('filtrosStock').classList.toggle('d-none', !stock);
    }
    function construirReporte() {
        const tipo = document.querySelector('input[name="tipoReporte"]:checked').value;
        const cat = $('fCategoria').value;
        if (tipo === 'stock') {
            const soloBajo = $('fSoloBajo').value === '1';
            const filas = db.productos
                .filter(p => (!cat || p.categoria === cat) && (!soloBajo || p.stock <= p.min))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
            return {
                nombre: 'Reporte_Stock',
                headers: ['SKU', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Precio Venta', 'Valor Total'],
                rows: filas.map(p => [p.sku, p.nombre, p.categoria, p.stock, p.min, p.venta, +(p.stock * p.venta).toFixed(2)])
            };
        }
        const desde = $('fDesde').value, hasta = $('fHasta').value, prod = $('fProducto').value, t = $('fTipo').value;
        const filas = db.movimientos.filter(m => {
            const f = m.fecha.slice(0, 10);
            if (desde && f < desde) return false;
            if (hasta && f > hasta) return false;
            if (prod && String(m.productoId) !== prod) return false;
            if (t && m.tipo !== t) return false;
            if (cat) { const p = db.productos.find(x => x.id === m.productoId); if (!p || p.categoria !== cat) return false; }
            return true;
        }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        return {
            nombre: 'Reporte_Movimientos',
            headers: ['Fecha', 'SKU', 'Producto', 'Tipo', 'Cantidad', 'Precio Unit.', 'Usuario'],
            rows: filas.map(m => [fmtFecha(m.fecha), m.sku, m.producto, m.tipo === 'E' ? 'Entrada' : 'Salida', m.cantidad, m.precio || 0, m.usuario])
        };
    }
    function previsualizar() {
        const r = construirReporte();
        $('repHead').innerHTML = '<tr>' + r.headers.map(h => `<th>${esc(h)}</th>`).join('') + '</tr>';
        $('repBody').innerHTML = r.rows.length
            ? r.rows.map(f => '<tr>' + f.map(c => `<td>${esc(c)}</td>`).join('') + '</tr>').join('')
            : filaVacia(r.headers.length, 'Sin resultados para los filtros seleccionados.');
        $('repCount').textContent = r.rows.length + ' filas';
        $('panelPreview').classList.remove('d-none');
    }
    function exportarExcel() {
        const r = construirReporte();
        if (!r.rows.length) { toast('No hay datos para exportar con esos filtros.', 'warning'); return; }
        const datos = [r.headers, ...r.rows];
        if (window.XLSX) {
            const ws = XLSX.utils.aoa_to_sheet(datos);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
            XLSX.writeFile(wb, r.nombre + '.xlsx');
            toast('Excel generado: ' + r.nombre + '.xlsx');
        } else {
            const csv = datos.map(fila => fila.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
            a.download = r.nombre + '.csv'; a.click();
            toast('No se pudo cargar Excel; se descargó CSV.', 'info');
        }
    }

    /* -------------------- Acciones de datos -------------------- */
    function crearProducto(d) {
        if (!d.sku || !d.nombre) throw 'SKU y nombre son obligatorios.';
        if (db.productos.some(p => p.sku.toLowerCase() === d.sku.toLowerCase())) throw 'Ya existe un producto con ese SKU.';
        db.productos.push({
            id: db.nextProductoId++, sku: d.sku, nombre: d.nombre, categoria: d.categoria,
            peso: d.peso || 0, tamano: d.tamano, color: d.color, costo: d.costo, venta: d.venta,
            stock: d.stock || 0, min: d.min || 0
        });
        save();
    }
    function aplicarMovimiento(id, tipo, cantidad, precio, obs) {
        const p = db.productos.find(x => x.id === id);
        if (!p) throw 'El producto no existe.';
        if (!(cantidad > 0)) throw 'La cantidad debe ser mayor a cero.';
        if (tipo === 'S' && cantidad > p.stock) throw `Stock insuficiente. Disponible: ${p.stock}, solicitado: ${cantidad}.`;
        p.stock += (tipo === 'E' ? cantidad : -cantidad);
        db.movimientos.push({
            id: db.nextMovId++, fecha: new Date().toISOString(), productoId: p.id, sku: p.sku,
            producto: p.nombre, tipo, cantidad, precio: precio || null, usuario: sesion.usuario, obs: obs || ''
        });
        save();
    }

    /* -------------------- Arranque + eventos -------------------- */
    document.addEventListener('DOMContentLoaded', function () {
        db = load();

        // LOGIN
        $('loginForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const u = $('loginUser').value.trim(), p = $('loginPass').value;
            const user = db.usuarios.find(x => x.usuario === u && x.password === p);
            if (!user) {
                const box = $('loginError');
                box.textContent = 'Usuario o contraseña incorrectos.';
                box.classList.remove('d-none');
                return;
            }
            sesion = { usuario: user.usuario, nombre: user.nombre, rol: user.rol, fecha: user.fecha };
            $('loginError').classList.add('d-none');
            $('loginView').classList.add('d-none');
            $('appView').classList.remove('d-none');
            $('chipNombre').textContent = sesion.nombre;
            $('chipRol').textContent = sesion.rol;
            showView('dashboard');
        });

        // LOGOUT
        $('btnLogout').addEventListener('click', function (e) {
            e.preventDefault();
            sesion = null;
            $('appView').classList.add('d-none');
            $('loginView').classList.remove('d-none');
            $('loginForm').reset();
        });

        // Menú
        document.querySelectorAll('.sidebar .nav-link[data-view]').forEach(a =>
            a.addEventListener('click', e => { e.preventDefault(); showView(a.dataset.view); }));
        $('btnMenu').addEventListener('click', () => $('sidebar').classList.toggle('open'));

        // Restaurar demo
        $('btnReset').addEventListener('click', function () {
            if (!confirm('¿Restaurar los datos de ejemplo? Se perderán tus cambios.')) return;
            db = seed(); save();
            showView('dashboard');
            toast('Datos de ejemplo restaurados.', 'info');
        });

        // Cambiar contraseña
        $('formPassword').addEventListener('submit', function (e) {
            e.preventDefault();
            const actual = $('passActual').value, nueva = $('passNueva').value, conf = $('passConfirmar').value;
            const user = db.usuarios.find(x => x.usuario === sesion.usuario);
            if (user.password !== actual) return toast('La contraseña actual no es correcta.', 'danger');
            if (!nueva) return toast('La nueva contraseña no puede estar vacía.', 'warning');
            if (nueva !== conf) return toast('La nueva contraseña y su confirmación no coinciden.', 'warning');
            user.password = nueva; save();
            this.reset();
            toast('Contraseña actualizada correctamente.');
        });

        // Buscar productos (en vivo)
        $('buscarProducto').addEventListener('input', e => renderProductos(e.target.value));

        // Nuevo producto: al abrir el modal, cargar las categorías
        document.getElementById('modalNuevo').addEventListener('show.bs.modal', function () {
            $('nCategoria').innerHTML = db.categorias.map(c => `<option>${esc(c)}</option>`).join('');
        });
        $('formNuevo').addEventListener('submit', function (e) {
            e.preventDefault();
            try {
                crearProducto({
                    sku: $('nSku').value.trim(), nombre: $('nNombre').value.trim(), categoria: $('nCategoria').value,
                    peso: parseFloat($('nPeso').value) || 0, tamano: $('nTamano').value.trim(), color: $('nColor').value.trim(),
                    costo: parseFloat($('nCosto').value) || 0, venta: parseFloat($('nVenta').value) || 0,
                    stock: parseInt($('nStock').value) || 0, min: parseInt($('nMin').value) || 0
                });
                bootstrap.Modal.getInstance(document.getElementById('modalNuevo')).hide();
                this.reset();
                renderProductos($('buscarProducto').value);
                toast('Producto creado correctamente.');
            } catch (err) { toast(err, 'danger'); }
        });

        // Modal de movimiento (ingreso/salida)
        const modalMov = new bootstrap.Modal(document.getElementById('modalMov'));
        $('tablaProductos').addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-mov');
            if (!btn) return;
            const p = db.productos.find(x => x.id === Number(btn.dataset.id));
            const tipo = btn.dataset.tipo, ingreso = tipo === 'E';
            $('movId').value = p.id; $('movTipo').value = tipo;
            $('movNombre').textContent = p.nombre; $('movStock').textContent = p.stock;
            $('movPrecio').value = ingreso ? p.costo : p.venta;
            $('movCantidad').value = '';
            $('movTitulo').textContent = (ingreso ? 'Ingreso' : 'Salida') + ' de producto';
            const sb = $('movSubmit');
            sb.className = 'btn ' + (ingreso ? 'btn-success' : 'btn-danger');
            sb.textContent = ingreso ? 'Registrar ingreso' : 'Registrar salida';
            modalMov.show();
        });
        $('formMov').addEventListener('submit', function (e) {
            e.preventDefault();
            try {
                aplicarMovimiento(Number($('movId').value), $('movTipo').value,
                    parseInt($('movCantidad').value), parseFloat($('movPrecio').value) || null, $('movObs').value.trim());
                modalMov.hide(); this.reset();
                renderProductos($('buscarProducto').value);
                toast('Movimiento registrado correctamente.');
            } catch (err) { toast(err, 'warning'); }
        });

        // Reportes
        document.querySelectorAll('input[name="tipoReporte"]').forEach(r =>
            r.addEventListener('change', () => { toggleFiltrosReporte(); $('panelPreview').classList.add('d-none'); }));
        $('btnGenerar').addEventListener('click', previsualizar);
        $('btnExcel').addEventListener('click', exportarExcel);
    });
})();
