export const CATEGORIAS = ['Bebidas', 'Snacks', 'Comida Rápida', 'Abarrotes'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const UMBRAL_STOCK_BAJO = 15;

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precioRegular: number;
  precioOferta: number;
  stock: number;
  esPrime: boolean;
  imagenUrl: string;
  activo: boolean;
}

export type ProductoInput = Omit<Producto, 'id' | 'activo' | 'codigo' | 'imagenUrl'> & {
  codigo?: string;
  imagenUrl?: string;
};
