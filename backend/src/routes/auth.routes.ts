import { Router, Request, Response } from "express";
import { obtenerUsuarioPorNombre } from "../data/usuarios.store";
import { compararPassword } from "../auth/password";
import { generarToken } from "../auth/jwt";
import { aUsuarioPublico, Rol } from "../models/usuario";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { nombreUsuario, password } = req.body;
    if (!nombreUsuario || !password) {
      return res.status(400).json({ mensaje: "Usuario y contraseña son requeridos" });
    }

    const usuario = await obtenerUsuarioPorNombre(nombreUsuario);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const coincide = await compararPassword(password, usuario.passwordHash);
    if (!coincide) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const token = generarToken({
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      nombre: usuario.nombre,
      rol: usuario.rol as Rol,
    });

    res.json({ token, usuario: aUsuarioPublico(usuario) });
  })
);

authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json(req.usuario);
});
