import { Router, Request, Response } from "express";
import { obtenerSede, actualizarSede } from "../data/sede.store";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const sedeRouter = Router();

sedeRouter.use(requireAuth);

sedeRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await obtenerSede());
  })
);

sedeRouter.put(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { nombreComercial, razonSocial, ruc, direccion, distrito, numeroTienda, leyendaPie, latitud, longitud } =
      req.body;

    if (!nombreComercial?.trim() || !razonSocial?.trim() || !direccion?.trim() || !distrito?.trim()) {
      return res.status(400).json({ mensaje: "Nombre comercial, razón social, dirección y distrito son obligatorios." });
    }
    if (/^\d+$/.test(razonSocial.trim())) {
      return res.status(400).json({ mensaje: "La razón social no puede ser solo números." });
    }
    if (ruc && !/^\d{11}$/.test(ruc)) {
      return res.status(400).json({ mensaje: "El RUC debe tener 11 dígitos." });
    }

    const sede = await actualizarSede({
      nombreComercial: nombreComercial.trim(),
      razonSocial: razonSocial.trim(),
      ruc: (ruc ?? "").trim(),
      direccion: direccion.trim(),
      distrito: distrito.trim(),
      numeroTienda: (numeroTienda ?? "001").trim(),
      leyendaPie: (leyendaPie ?? "").trim(),
      latitud: latitud != null ? Number(latitud) : null,
      longitud: longitud != null ? Number(longitud) : null,
    });
    res.json(sede);
  })
);
