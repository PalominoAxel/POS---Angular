import { Router, Request, Response } from "express";
import { productosStockBajo, resumenDia, topProductos, ventasPorCategoriaHoy } from "../services/reportes.service";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const reportesRouter = Router();

reportesRouter.use(requireAuth, requireRole("ADMIN"));

reportesRouter.get(
  "/resumen-dia",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await resumenDia());
  })
);

reportesRouter.get(
  "/top-productos",
  asyncHandler(async (req: Request, res: Response) => {
    const limite = req.query.limite ? Number(req.query.limite) : 5;
    res.json(await topProductos(limite));
  })
);

reportesRouter.get(
  "/ventas-por-categoria",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await ventasPorCategoriaHoy());
  })
);

reportesRouter.get(
  "/stock-bajo",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await productosStockBajo());
  })
);
