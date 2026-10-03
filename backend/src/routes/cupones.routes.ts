import { Router, Request, Response } from "express";
import { listarCupones, obtenerCuponPorCodigo } from "../data/cupones.store";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const cuponesRouter = Router();

cuponesRouter.use(requireAuth);

cuponesRouter.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await listarCupones());
  })
);

cuponesRouter.get(
  "/:codigo",
  asyncHandler(async (req: Request, res: Response) => {
    const cupon = await obtenerCuponPorCodigo(req.params.codigo);
    if (!cupon) return res.status(404).json({ mensaje: "Cupón inválido o expirado" });
    res.json(cupon);
  })
);
