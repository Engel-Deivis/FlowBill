-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPERADMIN', 'ADMIN', 'CAJERO');

-- CreateEnum
CREATE TYPE "TipoNcf" AS ENUM ('B01', 'B02', 'B14', 'B15', 'B16');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PAGADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rnc" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CAJERO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT,
    "rnc" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "costo" DECIMAL(10,2),
    "itbis" DECIMAL(4,2) NOT NULL DEFAULT 0.18,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "categoriaId" TEXT,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secuencias_ncf" (
    "id" TEXT NOT NULL,
    "tipoNcf" "TipoNcf" NOT NULL,
    "prefijo" TEXT NOT NULL,
    "secuenciaMin" INTEGER NOT NULL,
    "secuenciaMax" INTEGER NOT NULL,
    "secuenciaActual" INTEGER NOT NULL DEFAULT 0,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" TEXT NOT NULL,

    CONSTRAINT "secuencias_ncf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ncf" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vencimiento" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "empresaId" TEXT NOT NULL,
    "clienteId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "secuenciaNcfId" TEXT,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_factura" (
    "id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "itbis" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "facturaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "items_factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_rnc_key" ON "empresas"("rnc");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_empresaId_key" ON "usuarios"("email", "empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "secuencias_ncf_empresaId_tipoNcf_key" ON "secuencias_ncf"("empresaId", "tipoNcf");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secuencias_ncf" ADD CONSTRAINT "secuencias_ncf_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_secuenciaNcfId_fkey" FOREIGN KEY ("secuenciaNcfId") REFERENCES "secuencias_ncf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_factura" ADD CONSTRAINT "items_factura_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
