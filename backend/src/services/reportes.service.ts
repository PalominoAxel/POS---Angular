import { prisma } from "../lib/prisma";
import { UMBRAL_STOCK_BAJO } from "../models/producto";

function inicioDeHoy(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
}

function inicioHaceDias(dias: number): Date {
  const inicio = inicioDeHoy();
  inicio.setDate(inicio.getDate() - (dias - 1));
  return inicio;
}

export async function resumenDia() {
  const ventasHoy = await prisma.venta.findMany({
    where: { fecha: { gte: inicioDeHoy() } },
    select: { totalPagar: true, igvDesglosado: true },
  });

  const ventasDelDia = ventasHoy.reduce((suma, v) => suma + v.totalPagar, 0);
  const igvRecaudadoDia = ventasHoy.reduce((suma, v) => suma + v.igvDesglosado, 0);
  const ticketPromedio = ventasHoy.length ? ventasDelDia / ventasHoy.length : 0;

  const alertasStockBajo = await prisma.producto.count({
    where: { activo: true, stock: { lt: UMBRAL_STOCK_BAJO } },
  });

  return {
    ventasDelDia: Math.round(ventasDelDia * 100) / 100,
    ticketPromedio: Math.round(ticketPromedio * 100) / 100,
    igvRecaudadoDia: Math.round(igvRecaudadoDia * 100) / 100,
    numeroVentas: ventasHoy.length,
    alertasStockBajo,
  };
}

export function productosStockBajo() {
  return prisma.producto.findMany({
    where: { activo: true, stock: { lt: UMBRAL_STOCK_BAJO } },
    orderBy: { stock: "asc" },
  });
}

export async function topProductos(limite = 5, dias?: number) {
  const where = dias ? { venta: { fecha: { gte: inicioHaceDias(dias) } } } : undefined;

  const agrupado = await prisma.itemVenta.groupBy({
    by: ["productoId", "nombreProducto"],
    where,
    _sum: { cantidad: true },
    orderBy: { _sum: { cantidad: "desc" } },
    take: limite,
  });

  return agrupado.map((g) => ({
    productoId: g.productoId,
    nombre: g.nombreProducto,
    unidadesVendidas: g._sum.cantidad ?? 0,
  }));
}

export async function ventasPorCategoria(dias = 7) {
  const desde = inicioHaceDias(dias);

  const items = await prisma.itemVenta.findMany({
    where: { venta: { fecha: { gte: desde } } },
    select: { categoria: true, subtotal: true },
  });

  const totales = new Map<string, number>();
  for (const item of items) {
    totales.set(item.categoria, (totales.get(item.categoria) ?? 0) + item.subtotal);
  }

  return Array.from(totales.entries()).map(([categoria, totalIngresos]) => ({
    categoria,
    totalIngresos: Math.round(totalIngresos * 100) / 100,
  }));
}

export async function evolucionVentas(dias = 7) {
  const desde = inicioHaceDias(dias);

  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: desde } },
    select: { fecha: true, totalPagar: true },
  });

  const totalesPorDia = new Map<string, number>();
  for (let i = 0; i < dias; i++) {
    const dia = new Date(desde);
    dia.setDate(desde.getDate() + i);
    totalesPorDia.set(dia.toISOString().slice(0, 10), 0);
  }

  for (const venta of ventas) {
    const clave = venta.fecha.toISOString().slice(0, 10);
    if (totalesPorDia.has(clave)) {
      totalesPorDia.set(clave, (totalesPorDia.get(clave) ?? 0) + venta.totalPagar);
    }
  }

  return Array.from(totalesPorDia.entries()).map(([fecha, total]) => ({
    fecha,
    total: Math.round(total * 100) / 100,
  }));
}

export async function ventasPorMetodoPago(dias = 7) {
  const desde = inicioHaceDias(dias);

  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: desde } },
    select: { metodoPago: true, totalPagar: true },
  });

  const totales = new Map<string, number>();
  for (const venta of ventas) {
    totales.set(venta.metodoPago, (totales.get(venta.metodoPago) ?? 0) + venta.totalPagar);
  }

  return Array.from(totales.entries()).map(([metodo, total]) => ({
    metodo,
    total: Math.round(total * 100) / 100,
  }));
}

/** Cantidad de ventas por hora del día (0-23), agregando siempre los últimos 30 días. */
export async function horasPico() {
  const desde = inicioHaceDias(30);

  const ventas = await prisma.venta.findMany({
    where: { fecha: { gte: desde } },
    select: { fecha: true },
  });

  const conteo: number[] = new Array(24).fill(0);
  for (const venta of ventas) {
    conteo[venta.fecha.getHours()]++;
  }

  return conteo.map((cantidadVentas, hora) => ({ hora, cantidadVentas }));
}
