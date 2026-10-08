import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { productosRouter } from "./routes/productos.routes";
import { ventasRouter } from "./routes/ventas.routes";
import { reportesRouter } from "./routes/reportes.routes";
import { usuariosRouter } from "./routes/usuarios.routes";
import { cuponesRouter } from "./routes/cupones.routes";
import { cajaRouter } from "./routes/caja.routes";
import { categoriasRouter } from "./routes/categorias.routes";
import { DIRECTORIO_UPLOADS } from "./middleware/upload.middleware";

export function crearApp(): Application {
  const app = express();

  // Railway hace proxy de TLS; sin esto, req.protocol reportaría "http" y las URLs de imagen quedarían mal.
  app.set("trust proxy", true);

  const origenesPermitidos = process.env.FRONTEND_URL?.split(",");
  app.use(cors(origenesPermitidos ? { origin: origenesPermitidos } : undefined));
  app.use(express.json());
  app.use("/uploads/productos", express.static(DIRECTORIO_UPLOADS));

  app.get("/api/health", (_req, res) => res.json({ estado: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/productos", productosRouter);
  app.use("/api/ventas", ventasRouter);
  app.use("/api/reportes", reportesRouter);
  app.use("/api/usuarios", usuariosRouter);
  app.use("/api/cupones", cuponesRouter);
  app.use("/api/caja", cajaRouter);
  app.use("/api/categorias", categoriasRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  });

  return app;
}
