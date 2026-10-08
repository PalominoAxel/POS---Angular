import { Router, Request, Response } from "express";
import {
  evolucionVentas,
  horasPico,
  productosStockBajo,
  resumenDia,
  topProductos,
  ventasPorCategoria,
  ventasPorMetodoPago,
} from "../services/reportes.service";
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
    const dias = req.query.dias ? Number(req.query.dias) : undefined;
    res.json(await topProductos(limite, dias));
  })
);

reportesRouter.get(
  "/ventas-por-categoria",
  asyncHandler(async (req: Request, res: Response) => {
    const dias = req.query.dias ? Number(req.query.dias) : 7;
    res.json(await ventasPorCategoria(dias));
  })
);

reportesRouter.get(
  "/stock-bajo",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await productosStockBajo());
  })
);

reportesRouter.get(
  "/evolucion-ventas",
  asyncHandler(async (req: Request, res: Response) => {
    const dias = req.query.dias ? Number(req.query.dias) : 7;
    res.json(await evolucionVentas(dias));
  })
);

reportesRouter.get(
  "/ventas-por-metodo-pago",
  asyncHandler(async (req: Request, res: Response) => {
    const dias = req.query.dias ? Number(req.query.dias) : 7;
    res.json(await ventasPorMetodoPago(dias));
  })
);

reportesRouter.get(
  "/horas-pico",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await horasPico());
  })
);
