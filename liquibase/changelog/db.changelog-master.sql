--liquibase formatted sql

-- =========================================================
-- Esquema LogisticaDB
-- La base de datos LogisticaDB se crea en el servicio db-init
-- (Liquibase se conecta directamente sobre esa base).
-- =========================================================

--changeset logistica:01-usuarios
CREATE TABLE Usuarios(
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
    Usuario VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    NombreCompleto VARCHAR(150) NOT NULL,
    Rol VARCHAR(20) NOT NULL DEFAULT 'OPERADOR',
    Activo BIT NOT NULL DEFAULT 1,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
--rollback DROP TABLE Usuarios;

--changeset logistica:02-categorias
CREATE TABLE Categorias(
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(250)
);
--rollback DROP TABLE Categorias;

--changeset logistica:03-productos
CREATE TABLE Productos(
    IdProducto INT IDENTITY(1,1) PRIMARY KEY,
    SKU VARCHAR(50) NOT NULL UNIQUE,
    Nombre VARCHAR(150) NOT NULL,
    IdCategoria INT NOT NULL,
    PesoKg DECIMAL(10,3),
    Tamano VARCHAR(50),
    Color VARCHAR(50),
    PrecioCosto DECIMAL(12,2) NOT NULL,
    PrecioVenta DECIMAL(12,2) NOT NULL,
    StockActual INT NOT NULL DEFAULT 0,
    StockMinimo INT NOT NULL DEFAULT 5,
    Activo BIT NOT NULL DEFAULT 1,
    FechaRegistro DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Productos_Categorias
        FOREIGN KEY(IdCategoria)
        REFERENCES Categorias(IdCategoria)
);
--rollback DROP TABLE Productos;

--changeset logistica:04-movimientos-inventario
CREATE TABLE MovimientosInventario(
    IdMovimiento INT IDENTITY(1,1) PRIMARY KEY,
    IdProducto INT NOT NULL,
    TipoMovimiento CHAR(1) NOT NULL
        CHECK(TipoMovimiento IN ('E','S')),
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12,2),
    Observacion VARCHAR(250),
    FechaMovimiento DATETIME DEFAULT GETDATE(),
    IdUsuario INT,
    CONSTRAINT FK_Movimientos_Producto
        FOREIGN KEY(IdProducto)
        REFERENCES Productos(IdProducto),
    CONSTRAINT FK_Movimientos_Usuario
        FOREIGN KEY(IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);
--rollback DROP TABLE MovimientosInventario;

--changeset logistica:05-clientes
CREATE TABLE Clientes(
    IdCliente INT IDENTITY(1,1) PRIMARY KEY,
    Documento VARCHAR(20),
    Nombre VARCHAR(150) NOT NULL,
    Telefono VARCHAR(20),
    Correo VARCHAR(100),
    FechaRegistro DATETIME DEFAULT GETDATE()
);
--rollback DROP TABLE Clientes;

--changeset logistica:06-ventas
CREATE TABLE Ventas(
    IdVenta INT IDENTITY(1,1) PRIMARY KEY,
    FechaVenta DATETIME DEFAULT GETDATE(),
    IdCliente INT NULL,
    IdUsuario INT NOT NULL,
    Total DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_Ventas_Cliente
        FOREIGN KEY(IdCliente)
        REFERENCES Clientes(IdCliente),
    CONSTRAINT FK_Ventas_Usuario
        FOREIGN KEY(IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);
--rollback DROP TABLE Ventas;

--changeset logistica:07-detalle-ventas
CREATE TABLE DetalleVentas(
    IdDetalle INT IDENTITY(1,1) PRIMARY KEY,
    IdVenta INT NOT NULL,
    IdProducto INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,
    SubTotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_DetalleVenta_Venta
        FOREIGN KEY(IdVenta)
        REFERENCES Ventas(IdVenta),
    CONSTRAINT FK_DetalleVenta_Producto
        FOREIGN KEY(IdProducto)
        REFERENCES Productos(IdProducto)
);
--rollback DROP TABLE DetalleVentas;

-- =========================================================
-- VISTAS
-- En SQL Server CREATE VIEW debe ser la unica sentencia del
-- batch; cada vista va en su propio changeset (un batch).
-- =========================================================

--changeset logistica:08-vw-productos-stock-bajo splitStatements:false
CREATE VIEW vw_ProductosStockBajo
AS
SELECT
    IdProducto,
    SKU,
    Nombre,
    StockActual,
    StockMinimo
FROM Productos
WHERE StockActual <= StockMinimo;
--rollback DROP VIEW vw_ProductosStockBajo;

--changeset logistica:09-vw-dashboard splitStatements:false
CREATE VIEW vw_Dashboard
AS
SELECT
    (SELECT COUNT(*) FROM Productos) AS TotalProductos,
    (SELECT SUM(StockActual) FROM Productos) AS StockTotal,
    (SELECT COUNT(*)
        FROM Productos
        WHERE StockActual <= StockMinimo) AS ProductosCriticos,
    (SELECT ISNULL(SUM(Total),0) FROM Ventas) AS VentasTotales;
--rollback DROP VIEW vw_Dashboard;

-- =========================================================
-- DATOS DE EJEMPLO (seed)
-- Permiten iniciar sesion y ver el sistema con contenido.
-- Las contrasenas se guardan en texto plano (decision del proyecto).
-- =========================================================

--changeset logistica:10-seed-usuarios
INSERT INTO Usuarios (Usuario, PasswordHash, NombreCompleto, Rol)
VALUES ('admin', 'admin123', 'Administrador General', 'ADMIN');
INSERT INTO Usuarios (Usuario, PasswordHash, NombreCompleto, Rol)
VALUES ('operador', 'operador123', 'Maria Operadora', 'OPERADOR');
--rollback DELETE FROM Usuarios WHERE Usuario IN ('admin','operador');

--changeset logistica:11-seed-categorias
INSERT INTO Categorias (Nombre, Descripcion) VALUES
    ('Cuidado Capilar', 'Shampoo, acondicionador y tratamientos'),
    ('Coloracion',      'Tintes, decolorantes y oxidantes'),
    ('Herramientas',    'Tijeras, secadoras, planchas y maquinas'),
    ('Accesorios',      'Peines, capas, pinzas y otros');
--rollback DELETE FROM Categorias WHERE Nombre IN ('Cuidado Capilar','Coloracion','Herramientas','Accesorios');

--changeset logistica:12-seed-productos
INSERT INTO Productos
    (SKU, Nombre, IdCategoria, PesoKg, Tamano, Color, PrecioCosto, PrecioVenta, StockActual, StockMinimo)
SELECT v.SKU, v.Nombre, c.IdCategoria, v.PesoKg, v.Tamano, v.Color,
       v.PrecioCosto, v.PrecioVenta, v.StockActual, v.StockMinimo
FROM (VALUES
    ('SH-001','Shampoo Hidratante 1L',     'Cuidado Capilar', 1.000, '1L',    'Transparente', 18.00,  32.00, 40, 10),
    ('AC-001','Acondicionador Reparador 1L','Cuidado Capilar', 1.000, '1L',    'Blanco',       20.00,  35.00, 25, 10),
    ('TR-001','Tratamiento Keratina 500ml', 'Cuidado Capilar', 0.500, '500ml', 'Ambar',        30.00,  55.00,  4,  5),
    ('TN-001','Tinte Rubio Ceniza',         'Coloracion',      0.120, '120ml', 'Rubio',        12.00,  25.00, 30,  8),
    ('TN-002','Tinte Negro Intenso',        'Coloracion',      0.120, '120ml', 'Negro',        12.00,  25.00,  5,  8),
    ('DC-001','Decolorante en Polvo 500g',  'Coloracion',      0.500, '500g',  'Blanco',       15.00,  28.00, 18,  6),
    ('TJ-001','Tijera Profesional 6"',      'Herramientas',    0.150, '6 pulg','Plateado',     40.00,  85.00,  6,  3),
    ('SE-001','Secadora 2000W',             'Herramientas',    0.800, 'Estandar','Negro',      90.00, 160.00,  4,  2),
    ('PL-001','Plancha Ceramica',           'Herramientas',    0.400, 'Estandar','Rosa',       70.00, 130.00,  3,  2),
    ('PE-001','Peine de Carbono',           'Accesorios',      0.050, '22cm',  'Negro',         3.00,   8.00, 50, 15),
    ('CA-001','Capa de Corte Impermeable',  'Accesorios',      0.300, 'Unico', 'Negro',         8.00,  18.00, 12,  5)
) AS v(SKU,Nombre,CategoriaNombre,PesoKg,Tamano,Color,PrecioCosto,PrecioVenta,StockActual,StockMinimo)
JOIN Categorias c ON c.Nombre = v.CategoriaNombre;
--rollback DELETE FROM Productos WHERE SKU IN ('SH-001','AC-001','TR-001','TN-001','TN-002','DC-001','TJ-001','SE-001','PL-001','PE-001','CA-001');

--changeset logistica:13-seed-movimientos
INSERT INTO MovimientosInventario
    (IdProducto, TipoMovimiento, Cantidad, PrecioUnitario, Observacion, IdUsuario)
SELECT p.IdProducto, m.Tipo, m.Cant, m.Precio, m.Obs,
       (SELECT IdUsuario FROM Usuarios WHERE Usuario = 'admin')
FROM (VALUES
    ('SH-001','E',40,18.00,'Carga inicial de inventario'),
    ('AC-001','E',25,20.00,'Carga inicial de inventario'),
    ('TN-001','E',30,12.00,'Carga inicial de inventario'),
    ('SH-001','S', 5,32.00,'Venta en mostrador'),
    ('TN-001','S', 3,25.00,'Venta en mostrador'),
    ('TJ-001','S', 1,85.00,'Uso interno del salon')
) AS m(SKU,Tipo,Cant,Precio,Obs)
JOIN Productos p ON p.SKU = m.SKU;
--rollback DELETE FROM MovimientosInventario;
