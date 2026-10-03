import { prisma } from "../lib/prisma";
import { ProductoInput, ProductoUpdateInput } from "../models/producto";

export function listarProductos() {
  return prisma.producto.findMany({ where: { activo: true }, orderBy: { id: "asc" } });
}

export function obtenerProducto(id: number) {
  return prisma.producto.findUnique({ where: { id } });
}

export async function siguienteCodigo(): Promise<string> {
  const ultimo = await prisma.producto.findFirst({ orderBy: { id: "desc" } });
  const siguiente = (ultimo?.id ?? 0) + 1;
  return `P${String(siguiente).padStart(3, "0")}`;
}

export async function crearProducto(input: ProductoInput) {
  const codigo = input.codigo ?? (await siguienteCodigo());
  return prisma.producto.create({
    data: {
      codigo,
      nombre: input.nombre,
      categoria: input.categoria,
      precioRegular: input.precioRegular,
      precioOferta: input.precioOferta,
      stock: input.stock,
      esPrime: input.esPrime ?? false,
      imagenUrl: input.imagenUrl ?? `img/productos/${codigo.toLowerCase()}.jpg`,
    },
  });
}

export async function actualizarProducto(id: number, input: ProductoUpdateInput) {
  const existente = await prisma.producto.findUnique({ where: { id } });
  if (!existente) return undefined;
  return prisma.producto.update({ where: { id }, data: input });
}

export async function eliminarProducto(id: number) {
  const existente = await prisma.producto.findUnique({ where: { id } });
  if (!existente) return false;
  await prisma.producto.update({ where: { id }, data: { activo: false } });
  return true;
}
