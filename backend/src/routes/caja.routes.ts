import { Router, Request, Response } from "express";
import {
  abrirCaja,
  cerrarCaja,
  obtenerCajaAbierta,
  resumenCaja,
  historialCajas,
  CajaError,
} from "../services/caja.service";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const cajaRouter = Router();

cajaRouter.use(requireAuth);

cajaRouter.get(
  "/actual",
  asyncHandler(async (_req: Request, res: Response) => {
    const caja = await obtenerCajaAbierta();
    res.json(caja);
  })
);

cajaRouter.get(
  "/actual/resumen",
  requireRole("ADMIN"),
  asyncHandler(async (_req: Request, res: Response) => {
    const caja = await obtenerCajaAbierta();
    if (!caja) return res.status(404).json({ mensaje: "No hay ninguna caja abierta." });
    res.json(await resumenCaja(caja.id));
  })
);

cajaRouter.get(
  "/historial",
  requireRole("ADMIN"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await historialCajas());
  })
);

cajaRouter.post(
  "/abrir",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { montoApertura } = req.body;
    if (montoApertura == null || Number.isNaN(Number(montoApertura))) {
      return res.status(400).json({ mensaje: "Debe indicar el monto de apertura." });
    }
    try {
      const caja = await abrirCaja(req.usuario!.usuarioId, Number(montoApertura));
      res.status(201).json(caja);
    } catch (error) {
      if (error instanceof CajaError) return res.status(error.status).json({ mensaje: error.message });
      throw error;
    }
  })
);

cajaRouter.post(
  "/cerrar",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { montoCierreDeclarado } = req.body;
    if (montoCierreDeclarado == null || Number.isNaN(Number(montoCierreDeclarado))) {
      return res.status(400).json({ mensaje: "Debe indicar el monto contado al cerrar caja." });
    }
    try {
      const resumen = await cerrarCaja(req.usuario!.usuarioId, Number(montoCierreDeclarado));
      res.json(resumen);
    } catch (error) {
      if (error instanceof CajaError) return res.status(error.status).json({ mensaje: error.message });
      throw error;
    }
  })
);
