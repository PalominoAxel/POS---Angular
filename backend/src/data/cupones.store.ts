import { prisma } from "../lib/prisma";

export function obtenerCuponPorCodigo(codigo: string) {
  return prisma.cupon.findFirst({ where: { codigo, activo: true } });
}

export function listarCupones() {
  return prisma.cupon.findMany({ where: { activo: true } });
}
