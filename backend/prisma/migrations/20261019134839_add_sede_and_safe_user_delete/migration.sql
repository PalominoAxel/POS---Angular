-- DropForeignKey
ALTER TABLE "CajaSesion" DROP CONSTRAINT "CajaSesion_usuarioAperturaId_fkey";

-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_usuarioId_fkey";

-- AlterTable
ALTER TABLE "CajaSesion" ADD COLUMN     "nombreApertura" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nombreCierre" TEXT,
ALTER COLUMN "usuarioAperturaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "propina",
ADD COLUMN     "cajeroNombre" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "usuarioId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Sede" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombreComercial" TEXT NOT NULL DEFAULT 'TAMBO +',
    "razonSocial" TEXT NOT NULL DEFAULT 'TIENDAS TAMBO S.A.C.',
    "ruc" TEXT NOT NULL DEFAULT '20000000000',
    "direccion" TEXT NOT NULL DEFAULT 'AV. EJEMPLO NRO. 000',
    "distrito" TEXT NOT NULL DEFAULT 'LIMA - LA MOLINA - LIMA',
    "numeroTienda" TEXT NOT NULL DEFAULT '001',
    "leyendaPie" TEXT NOT NULL DEFAULT 'Documento de demostración, sin validez tributaria.',
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CajaSesion" ADD CONSTRAINT "CajaSesion_usuarioAperturaId_fkey" FOREIGN KEY ("usuarioAperturaId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

