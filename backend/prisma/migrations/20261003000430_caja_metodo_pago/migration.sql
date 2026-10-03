-- CreateTable
CREATE TABLE "CajaSesion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "montoApertura" REAL NOT NULL,
    "fechaApertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioAperturaId" INTEGER NOT NULL,
    "fechaCierre" DATETIME,
    "montoCierreDeclarado" REAL,
    "usuarioCierreId" INTEGER,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    CONSTRAINT "CajaSesion_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CajaSesion_usuarioCierreId_fkey" FOREIGN KEY ("usuarioCierreId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numeroComprobante" TEXT NOT NULL,
    "tipoComprobante" TEXT NOT NULL,
    "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "clienteTipoDocumento" TEXT,
    "clienteNumeroDocumento" TEXT,
    "clienteRuc" TEXT,
    "clienteRazonSocial" TEXT,
    "cuponId" INTEGER,
    "cuponMontoDescuento" REAL NOT NULL DEFAULT 0,
    "totalProductos" REAL NOT NULL,
    "descuentoAplicado" REAL NOT NULL,
    "igvDesglosado" REAL NOT NULL,
    "totalPagar" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" INTEGER NOT NULL,
    "cajaSesionId" INTEGER,
    CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_cuponId_fkey" FOREIGN KEY ("cuponId") REFERENCES "Cupon" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Venta_cajaSesionId_fkey" FOREIGN KEY ("cajaSesionId") REFERENCES "CajaSesion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Venta" ("clienteNumeroDocumento", "clienteRazonSocial", "clienteRuc", "clienteTipoDocumento", "cuponId", "cuponMontoDescuento", "descuentoAplicado", "fecha", "id", "igvDesglosado", "numeroComprobante", "tipoComprobante", "totalPagar", "totalProductos", "usuarioId") SELECT "clienteNumeroDocumento", "clienteRazonSocial", "clienteRuc", "clienteTipoDocumento", "cuponId", "cuponMontoDescuento", "descuentoAplicado", "fecha", "id", "igvDesglosado", "numeroComprobante", "tipoComprobante", "totalPagar", "totalProductos", "usuarioId" FROM "Venta";
DROP TABLE "Venta";
ALTER TABLE "new_Venta" RENAME TO "Venta";
CREATE UNIQUE INDEX "Venta_numeroComprobante_key" ON "Venta"("numeroComprobante");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
