export interface Sede {
  id: number;
  nombreComercial: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  distrito: string;
  numeroTienda: string;
  leyendaPie: string;
  latitud: number | null;
  longitud: number | null;
}

export type SedeInput = Omit<Sede, 'id'>;
