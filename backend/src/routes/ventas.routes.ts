import { Router, Request, Response } from "express";
import { listarVentas, obtenerVenta, registrarVenta, VentaError } from "../services/ventas.service";
import { METODOS_PAGO, TIPOS_COMPROBANTE } from "../models/venta";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const ventasRouter = Router();

ventasRouter.use(requireAuth);

ventasRouter.get(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { fechaInicio, fechaFin } = req.query;
    const inicio = typeof fechaInicio === "string" && fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : undefined;
    const fin = typeof fechaFin === "string" && fechaFin ? new Date(`${fechaFin}T23:59:59.999`) : undefined;
    res.json(await listarVentas(inicio, fin));
  })
);

ventasRouter.get(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const venta = await obtenerVenta(Number(req.params.id));
    if (!venta) return res.status(404).json({ mensaje: "Venta no encontrada" });
    res.json(venta);
  })
);

ventasRouter.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { tipoComprobante, metodoPago, items, cuponCodigo, cliente } = req.body;

    if (!tipoComprobante || !metodoPago || !Array.isArray(items) || items.length === 0 || !cliente) {
      return res.status(400).json({ mensaje: "Datos de venta incompletos" });
    }
    if (!(TIPOS_COMPROBANTE as readonly string[]).includes(tipoComprobante)) {
      return res.status(400).json({ mensaje: `Tipo de comprobante inválido. Use: ${TIPOS_COMPROBANTE.join(", ")}` });
    }
    if (!(METODOS_PAGO as readonly string[]).includes(metodoPago)) {
      return res.status(400).json({ mensaje: `Método de pago inválido. Use: ${METODOS_PAGO.join(", ")}` });
    }

    try {
      const venta = await registrarVenta(
        { tipoComprobante, metodoPago, items, cuponCodigo, cliente },
        req.usuario!.usuarioId
      );
      res.status(201).json(venta);
    } catch (error) {
      if (error instanceof VentaError) {
        return res.status(error.status).json({ mensaje: error.message });
      }
      throw error;
    }
  })
);
