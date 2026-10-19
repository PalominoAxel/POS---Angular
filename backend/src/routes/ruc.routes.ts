import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";

export const rucRouter = Router();

rucRouter.use(requireAuth);

rucRouter.get(
  "/:numero",
  asyncHandler(async (req: Request, res: Response) => {
    const numero = req.params.numero;
    if (!/^\d{11}$/.test(numero)) {
      return res.status(400).json({ mensaje: "El RUC debe tener 11 dígitos." });
    }

    const token = process.env.DECOLECTA_API_TOKEN;
    if (!token) {
      return res.status(503).json({ mensaje: "La consulta automática de RUC no está configurada." });
    }

    let respuesta;
    try {
      respuesta = await fetch(`https://api.decolecta.com/v1/sunat/ruc?numero=${numero}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      return res.status(502).json({ mensaje: "No se pudo contactar el servicio de consulta de RUC." });
    }

    if (respuesta.status === 404) {
      return res.status(404).json({ mensaje: "RUC no encontrado." });
    }
    if (!respuesta.ok) {
      return res.status(502).json({ mensaje: "No se pudo consultar el RUC en este momento." });
    }

    const datos = (await respuesta.json()) as Record<string, string | undefined>;
    res.json({
      ruc: datos.ruc ?? numero,
      razonSocial: datos.razon_social ?? datos.nombre_o_razon_social ?? datos.razonSocial ?? "",
      estado: datos.estado ?? null,
      condicion: datos.condicion ?? null,
      direccion: datos.direccion ?? null,
    });
  })
);
