import { prisma } from "../lib/prisma";

export function obtenerSede() {
  return prisma.sede.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

export interface SedeInput {
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

export function actualizarSede(input: SedeInput) {
  return prisma.sede.upsert({
    where: { id: 1 },
    create: { id: 1, ...input },
    update: { ...input },
  });
}
