import { prisma } from "../lib/prisma";
import { Rol } from "../models/usuario";
import { hashPassword } from "../auth/password";

export function listarUsuarios() {
  return prisma.usuario.findMany({ orderBy: { id: "asc" } });
}

export function obtenerUsuarioPorNombre(nombreUsuario: string) {
  return prisma.usuario.findUnique({ where: { nombreUsuario } });
}

export function obtenerUsuario(id: number) {
  return prisma.usuario.findUnique({ where: { id } });
}

export async function crearUsuario(input: {
  nombreUsuario: string;
  password: string;
  nombre: string;
  rol: Rol;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.usuario.create({
    data: {
      nombreUsuario: input.nombreUsuario,
      passwordHash,
      nombre: input.nombre,
      rol: input.rol,
    },
  });
}

export async function cambiarEstadoUsuario(id: number, activo: boolean) {
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) return undefined;
  return prisma.usuario.update({ where: { id }, data: { activo } });
}
