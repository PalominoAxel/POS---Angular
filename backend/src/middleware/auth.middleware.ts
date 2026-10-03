import { Request, Response, NextFunction } from "express";
import { Rol } from "../models/usuario";
import { verificarToken, PayloadToken } from "../auth/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: PayloadToken;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "No autenticado" });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.usuario = verificarToken(token);
    next();
  } catch {
    return res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

export function requireRole(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: "No autenticado" });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: "No tienes permisos para esta acción" });
    }
    next();
  };
}
