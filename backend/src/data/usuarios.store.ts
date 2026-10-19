import { prisma } from "../lib/prisma";
import { Rol } from "../models/usuario";
import { hashPassword } from "../auth/password";

export function listarUsuarios() {
  return prisma.usuario.findMany({ orderBy: { nombre: "asc" } });
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

export async function actualizarUsuario(
  id: number,
  input: { nombre?: string; password?: string }
) {
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) return undefined;

  const data: { nombre?: string; passwordHash?: string } = {};
  if (input.nombre?.trim()) data.nombre = input.nombre.trim();
  if (input.password) data.passwordHash = await hashPassword(input.password);

  return prisma.usuario.update({ where: { id }, data });
}

export async function eliminarUsuario(id: number) {
  const existente = await prisma.usuario.findUnique({ where: { id } });
  if (!existente) return undefined;
  await prisma.usuario.delete({ where: { id } });
  return existente;
}

export function contarAdmins() {
  return prisma.usuario.count({ where: { rol: "ADMIN" } });
}
