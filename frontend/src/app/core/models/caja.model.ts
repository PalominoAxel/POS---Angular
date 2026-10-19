import { MetodoPago } from './venta.model';

export type EstadoCaja = 'ABIERTA' | 'CERRADA';

export interface CajaSesion {
  id: number;
  montoApertura: number;
  fechaApertura: string;
  estado: EstadoCaja;
  fechaCierre: string | null;
  montoCierreDeclarado: number | null;
  usuarioApertura: { id: number; nombre: string } | null;
  usuarioCierre: { id: number; nombre: string } | null;
  nombreApertura: string;
  nombreCierre: string | null;
}

export interface ResumenCaja {
  caja: CajaSesion;
  numeroVentas: number;
  totalVentas: number;
  porMetodoPago: Record<MetodoPago, number>;
  montoEfectivoEsperado: number;
  montoCierreDeclarado?: number;
  diferencia?: number;
}
