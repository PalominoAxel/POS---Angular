import { Venta, ItemVenta } from "@prisma/client";

export type { Venta, ItemVenta };

export const TIPOS_COMPROBANTE = ["BOLETA", "FACTURA"] as const;
export type TipoComprobante = (typeof TIPOS_COMPROBANTE)[number];

export const METODOS_PAGO = ["EFECTIVO", "TARJETA", "DIGITAL"] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export interface ItemCarritoInput {
  productoId: number;
  cantidad: number;
}

export interface ClienteBoletaInput {
  tipoDocumento?: "DNI" | "CE" | null;
  numeroDocumento?: string | null;
}

export interface ClienteFacturaInput {
  ruc: string;
  razonSocial: string;
}

export interface VentaInput {
  tipoComprobante: TipoComprobante;
  metodoPago: MetodoPago;
  items: ItemCarritoInput[];
  cuponCodigo?: string;
  cliente: ClienteBoletaInput | ClienteFacturaInput;
}

export interface TotalesCalculados {
  totalProductos: number;
  descuentoAplicado: number;
  cuponMontoDescuento: number;
  totalPagar: number;
  igvDesglosado: number;
}
