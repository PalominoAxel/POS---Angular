import jwt from "jsonwebtoken";
import { Rol } from "../models/usuario";

const JWT_SECRET = process.env.JWT_SECRET || "tambo-pos-dev-secret-cambiar-en-produccion";
const EXPIRACION = "12h";

export interface PayloadToken {
  usuarioId: number;
  nombreUsuario: string;
  nombre: string;
  rol: Rol;
}

export function generarToken(payload: PayloadToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRACION });
}

export function verificarToken(token: string): PayloadToken {
  return jwt.verify(token, JWT_SECRET) as PayloadToken;
}
