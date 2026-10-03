import { CajaSesion } from "@prisma/client";

export type { CajaSesion };

export const ESTADOS_CAJA = ["ABIERTA", "CERRADA"] as const;
export type EstadoCaja = (typeof ESTADOS_CAJA)[number];
