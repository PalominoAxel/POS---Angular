import { Producto } from "@prisma/client";

export type { Producto };

export const UMBRAL_STOCK_BAJO = 15;

export type ProductoInput = {
  codigo: string;
  nombre: string;
  categoria: string;
  precioRegular: number;
  precioOferta: number;
  stock: number;
  esPrime?: boolean;
  imagenUrl?: string;
};

export type ProductoUpdateInput = Partial<ProductoInput> & { activo?: boolean };
