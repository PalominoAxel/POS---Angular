import fs from "fs";
import path from "path";
import multer from "multer";

const DIRECTORIO_UPLOADS = process.env.RAILWAY_VOLUME_MOUNT_PATH
  ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "uploads", "productos")
  : path.join(__dirname, "..", "..", "uploads", "productos");

fs.mkdirSync(DIRECTORIO_UPLOADS, { recursive: true });

const EXTENSIONES_PERMITIDAS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIRECTORIO_UPLOADS),
  filename: (_req, file, cb) => {
    const ext = EXTENSIONES_PERMITIDAS[file.mimetype] ?? path.extname(file.originalname);
    const nombre = `producto-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nombre);
  },
});

export const uploadImagenProducto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!EXTENSIONES_PERMITIDAS[file.mimetype]) {
      cb(new Error("Formato no soportado. Usa JPG, PNG o WEBP."));
      return;
    }
    cb(null, true);
  },
}).single("imagen");

export { DIRECTORIO_UPLOADS };
