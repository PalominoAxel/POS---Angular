import { Router, Request, Response } from "express";
import { ROLES } from "../models/usuario";
import {
  listarUsuarios,
  crearUsuario,
  obtenerUsuarioPorNombre,
  obtenerUsuario,
  cambiarEstadoUsuario,
  actualizarUsuario,
  eliminarUsuario,
  contarAdmins,
} from "../data/usuarios.store";
import { aUsuarioPublico } from "../models/usuario";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { requireAdminToken } from "../middleware/adminToken.middleware";
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
    if (rol === "ADMIN" && !req.body.token) {
      return res.status(400).json({ mensaje: "Se requiere el token de administrador para crear otro administrador." });
    }
    if (await obtenerUsuarioPorNombre(nombreUsuario)) {
      return res.status(409).json({ mensaje: "El nombre de usuario ya existe" });
    }

    const crear = async () => {
      const usuario = await crearUsuario({ nombreUsuario, password, nombre, rol });
      res.status(201).json(aUsuarioPublico(usuario));
    };

    if (rol === "ADMIN") {
      return requireAdminToken(req, res, crear);
    }
    return crear();
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

usuariosRouter.patch(
  "/:id",
  requireAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { nombre, password } = req.body;
    if (!nombre?.trim() && !password) {
      return res.status(400).json({ mensaje: "Indica un nuevo nombre o una nueva contraseña." });
    }
    if (password && password.length < 4) {
      return res.status(400).json({ mensaje: "La contraseña debe tener al menos 4 caracteres." });
    }

    const usuario = await actualizarUsuario(id, { nombre, password });
    if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    res.json(aUsuarioPublico(usuario));
  })
);

usuariosRouter.delete(
  "/:id",
  requireAdminToken,
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (id === req.usuario!.usuarioId) {
      return res.status(400).json({ mensaje: "No puedes eliminar tu propia cuenta." });
    }

    const objetivo = await obtenerUsuario(id);
    if (!objetivo) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    if (objetivo.rol === "ADMIN" && (await contarAdmins()) <= 1) {
      return res.status(400).json({ mensaje: "No puedes eliminar al último administrador del sistema." });
    }

    await eliminarUsuario(id);
    res.status(204).send();
  })
);
