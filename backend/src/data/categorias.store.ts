import { prisma } from "../lib/prisma";

export function listarCategorias() {
  return prisma.categoria.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } });
}

export async function existeCategoriaActiva(nombre: string): Promise<boolean> {
  const categoria = await prisma.categoria.findUnique({ where: { nombre } });
  return !!categoria && categoria.activo;
}

export class CategoriaDuplicadaError extends Error {}

export async function crearCategoria(nombre: string) {
  const nombreLimpio = nombre.trim();
  const existente = await prisma.categoria.findUnique({ where: { nombre: nombreLimpio } });
  if (existente) {
    if (existente.activo) throw new CategoriaDuplicadaError(`La categoría "${nombreLimpio}" ya existe`);
    return prisma.categoria.update({ where: { id: existente.id }, data: { activo: true } });
  }
  return prisma.categoria.create({ data: { nombre: nombreLimpio } });
}

export async function eliminarCategoria(id: number) {
  const existente = await prisma.categoria.findUnique({ where: { id } });
  if (!existente) return false;
  await prisma.categoria.update({ where: { id }, data: { activo: false } });
  return true;
}
