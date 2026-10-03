import { Usuario } from "@prisma/client";

export type { Usuario };

export const ROLES = ["ADMIN", "CAJERO"] as const;
export type Rol = (typeof ROLES)[number];

export type UsuarioPublico = Omit<Usuario, "passwordHash">;

export interface UsuarioInput {
  nombreUsuario: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export function aUsuarioPublico(usuario: Usuario): UsuarioPublico {
  const { passwordHash: _passwordHash, ...resto } = usuario;
  return resto;
}
