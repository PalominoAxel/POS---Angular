import { Router, Request, Response } from "express";
import { listarCategorias, crearCategoria, eliminarCategoria, CategoriaDuplicadaError } from "../data/categorias.store";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const categoriasRouter = Router();

categoriasRouter.use(requireAuth);

categoriasRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await listarCategorias());
  })
);

categoriasRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { nombre } = req.body;
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ mensaje: "El nombre de la categoría es obligatorio" });
    }

    try {
      const categoria = await crearCategoria(nombre);
      res.status(201).json(categoria);
    } catch (error) {
      if (error instanceof CategoriaDuplicadaError) {
        return res.status(400).json({ mensaje: error.message });
      }
      throw error;
    }
  })
);

categoriasRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const eliminada = await eliminarCategoria(Number(req.params.id));
    if (!eliminada) return res.status(404).json({ mensaje: "Categoría no encontrada" });
    res.status(204).send();
  })
);
