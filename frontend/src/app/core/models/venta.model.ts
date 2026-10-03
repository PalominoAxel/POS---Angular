export type TipoComprobante = 'BOLETA' | 'FACTURA';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'DIGITAL';
export const METODOS_PAGO: MetodoPago[] = ['EFECTIVO', 'TARJETA', 'DIGITAL'];

export interface ItemCarrito {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precioRegular: number;
  precioOferta: number;
  stockDisponible: number;
  cantidad: number;
}

export interface ClienteBoleta {
  tipoDocumento?: 'DNI' | 'CE' | null;
  numeroDocumento?: string | null;
}

export interface ClienteFactura {
  ruc: string;
  razonSocial: string;
}

export interface VentaInput {
  tipoComprobante: TipoComprobante;
  metodoPago: MetodoPago;
  items: { productoId: number; cantidad: number }[];
  cuponCodigo?: string;
  cliente: ClienteBoleta | ClienteFactura;
}

export interface ItemVenta {
  id: number;
  productoId: number;
  nombreProducto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  numeroComprobante: string;
  tipoComprobante: TipoComprobante;
  metodoPago: MetodoPago;
  clienteTipoDocumento: string | null;
  clienteNumeroDocumento: string | null;
  clienteRuc: string | null;
  clienteRazonSocial: string | null;
  cuponMontoDescuento: number;
  totalProductos: number;
  descuentoAplicado: number;
  igvDesglosado: number;
  totalPagar: number;
  fecha: string;
  items: ItemVenta[];
  usuario: { id: number; nombre: string };
  cupon: { codigo: string } | null;
}

export interface Cupon {
  id: number;
  codigo: string;
  montoDescuento: number;
}
