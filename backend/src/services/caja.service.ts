import { prisma } from "../lib/prisma";
import { METODOS_PAGO, MetodoPago } from "../models/venta";

export class CajaError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function obtenerCajaAbierta() {
  return prisma.cajaSesion.findFirst({
    where: { estado: "ABIERTA" },
    include: { usuarioApertura: { select: { id: true, nombre: true } } },
  });
}

export async function abrirCaja(usuarioId: number, montoApertura: number) {
  const abierta = await obtenerCajaAbierta();
  if (abierta) throw new CajaError("Ya hay una caja abierta. Ciérrala antes de abrir una nueva.", 409);
  if (montoApertura < 0) throw new CajaError("El monto de apertura no puede ser negativo.");

  return prisma.cajaSesion.create({
    data: { montoApertura, usuarioAperturaId: usuarioId },
    include: { usuarioApertura: { select: { id: true, nombre: true } } },
  });
}

export async function resumenCaja(cajaSesionId: number) {
  const caja = await prisma.cajaSesion.findUnique({
    where: { id: cajaSesionId },
    include: {
      usuarioApertura: { select: { id: true, nombre: true } },
      usuarioCierre: { select: { id: true, nombre: true } },
    },
  });
  if (!caja) throw new CajaError("Caja no encontrada", 404);

  const ventas = await prisma.venta.findMany({
    where: { cajaSesionId },
    select: { totalPagar: true, metodoPago: true },
  });

  const porMetodoPago: Record<MetodoPago, number> = { EFECTIVO: 0, TARJETA: 0, DIGITAL: 0 };
  for (const venta of ventas) {
    const metodo = venta.metodoPago as MetodoPago;
    porMetodoPago[metodo] = (porMetodoPago[metodo] ?? 0) + venta.totalPagar;
  }
  for (const metodo of METODOS_PAGO) {
    porMetodoPago[metodo] = redondear(porMetodoPago[metodo]);
  }

  const totalVentas = redondear(ventas.reduce((suma, v) => suma + v.totalPagar, 0));
  const montoEfectivoEsperado = redondear(caja.montoApertura + porMetodoPago.EFECTIVO);

  return {
    caja,
    numeroVentas: ventas.length,
    totalVentas,
    porMetodoPago,
    montoEfectivoEsperado,
  };
}

export async function cerrarCaja(usuarioId: number, montoCierreDeclarado: number) {
  const abierta = await obtenerCajaAbierta();
  if (!abierta) throw new CajaError("No hay ninguna caja abierta.", 409);
  if (montoCierreDeclarado < 0) throw new CajaError("El monto declarado no puede ser negativo.");

  const resumenPrevio = await resumenCaja(abierta.id);

  const cerrada = await prisma.cajaSesion.update({
    where: { id: abierta.id },
    data: {
      estado: "CERRADA",
      fechaCierre: new Date(),
      montoCierreDeclarado,
      usuarioCierreId: usuarioId,
    },
    include: {
      usuarioApertura: { select: { id: true, nombre: true } },
      usuarioCierre: { select: { id: true, nombre: true } },
    },
  });

  const diferencia = redondear(montoCierreDeclarado - resumenPrevio.montoEfectivoEsperado);

  return {
    caja: cerrada,
    numeroVentas: resumenPrevio.numeroVentas,
    totalVentas: resumenPrevio.totalVentas,
    porMetodoPago: resumenPrevio.porMetodoPago,
    montoEfectivoEsperado: resumenPrevio.montoEfectivoEsperado,
    montoCierreDeclarado,
    diferencia,
  };
}

export function historialCajas() {
  return prisma.cajaSesion.findMany({
    where: { estado: "CERRADA" },
    include: {
      usuarioApertura: { select: { id: true, nombre: true } },
      usuarioCierre: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaApertura: "desc" },
  });
}
