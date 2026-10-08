import { Router, Request, Response } from "express";
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../data/productos.store";
import { existeCategoriaActiva } from "../data/categorias.store";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { uploadImagenProducto } from "../middleware/upload.middleware";

export const productosRouter = Router();

productosRouter.use(requireAuth);

productosRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(await listarProductos());
  })
);

productosRouter.post("/imagen", requireRole("ADMIN"), (req: Request, res: Response) => {
  uploadImagenProducto(req, res, (error: unknown) => {
    if (error) {
      const mensaje = error instanceof Error ? error.message : "No se pudo subir la imagen.";
      return res.status(400).json({ mensaje });
    }
    if (!req.file) {
      return res.status(400).json({ mensaje: "No se recibió ningún archivo." });
    }
    const imagenUrl = `${req.protocol}://${req.get("host")}/uploads/productos/${req.file.filename}`;
    res.status(201).json({ imagenUrl });
  });
});

productosRouter.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const producto = await obtenerProducto(Number(req.params.id));
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.json(producto);
  })
);

productosRouter.post(
  "/",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const { nombre, categoria, precioRegular, precioOferta, stock, esPrime, codigo, imagenUrl } = req.body;

    if (!nombre || !categoria || precioRegular == null || stock == null) {
      return res.status(400).json({ mensaje: "Datos de producto incompletos" });
    }
    if (!(await existeCategoriaActiva(categoria))) {
      return res.status(400).json({ mensaje: `Categoría inválida: "${categoria}" no existe. Crea la categoría primero.` });
    }
    if (Number(precioRegular) <= 0 || Number(stock) < 0 || !Number.isInteger(Number(stock))) {
      return res.status(400).json({ mensaje: "Precio regular debe ser mayor a 0 y stock un entero ≥ 0" });
    }
    const precioOfertaFinal =
      precioOferta != null && Number(precioOferta) > 0 && Number(precioOferta) <= Number(precioRegular)
        ? Number(precioOferta)
        : Number(precioRegular);

    const producto = await crearProducto({
      codigo,
      nombre,
      categoria,
      precioRegular: Number(precioRegular),
      precioOferta: precioOfertaFinal,
      stock: Number(stock),
      esPrime: Boolean(esPrime),
      imagenUrl,
    });
    res.status(201).json(producto);
  })
);

productosRouter.put(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const producto = await actualizarProducto(Number(req.params.id), req.body);
    if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.json(producto);
  })
);

productosRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req: Request, res: Response) => {
    const eliminado = await eliminarProducto(Number(req.params.id));
    if (!eliminado) return res.status(404).json({ mensaje: "Producto no encontrado" });
    res.status(204).send();
  })
);
