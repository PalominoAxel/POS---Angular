import { Router, Request, Response } from "express";
import { ROLES } from "../models/usuario";
import {
  listarUsuarios,
  crearUsuario,
  obtenerUsuarioPorNombre,
  cambiarEstadoUsuario,
} from "../data/usuarios.store";
import { aUsuarioPublico } from "../models/usuario";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const usuariosRouter = Router();

usuariosRouter.use(requireAuth, requireRole("ADMIN"));

usuariosRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const usuarios = await listarUsuarios();
    res.json(usuarios.map(aUsuarioPublico));
  })
);

usuariosRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { nombreUsuario, password, nombre, rol } = req.body;
    if (!nombreUsuario || !password || !nombre || !rol) {
      return res.status(400).json({ mensaje: "Datos de usuario incompletos" });
    }
    if (!(ROLES as readonly string[]).includes(rol)) {
      return res.status(400).json({ mensaje: "Rol inválido" });
    }
    if (await obtenerUsuarioPorNombre(nombreUsuario)) {
      return res.status(409).json({ mensaje: "El nombre de usuario ya existe" });
    }

    const usuario = await crearUsuario({ nombreUsuario, password, nombre, rol });
    res.status(201).json(aUsuarioPublico(usuario));
  })
);

usuariosRouter.patch(
  "/:id/estado",
  asyncHandler(async (req: Request, res: Response) => {
    const { activo } = req.body;
    if (typeof activo !== "boolean") {
      return res.status(400).json({ mensaje: "El campo 'activo' debe ser booleano" });
    }
    const usuario = await cambiarEstadoUsuario(Number(req.params.id), activo);
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(aUsuarioPublico(usuario));
  })
);
