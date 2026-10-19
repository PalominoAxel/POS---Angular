import { Request, Response, NextFunction } from "express";

// Token secundario que el administrador debe ingresar para confirmar acciones
// sensibles sobre usuarios (crear/editar/eliminar administradores, editar o
// eliminar cajeros). Debe configurarse vía la variable de entorno
// ADMIN_ACTION_TOKEN (ver backend/.env) — intencionalmente sin valor por
// defecto en el código para no filtrar el secreto en el repositorio.
const ADMIN_ACTION_TOKEN = process.env.ADMIN_ACTION_TOKEN;

export function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  if (!ADMIN_ACTION_TOKEN) {
    return res.status(500).json({ mensaje: "ADMIN_ACTION_TOKEN no está configurado en el servidor." });
  }
  const token = req.body?.token ?? req.header("x-admin-token");
  if (!token || token !== ADMIN_ACTION_TOKEN) {
    return res.status(403).json({ mensaje: "Token de administrador inválido." });
  }
  next();
}
