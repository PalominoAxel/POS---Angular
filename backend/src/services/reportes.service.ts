import { prisma } from "../lib/prisma";
import { UMBRAL_STOCK_BAJO } from "../models/producto";

function inicioDeHoy(): Date {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
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

export async function topProductos(limite = 5) {
  const agrupado = await prisma.itemVenta.groupBy({
    by: ["productoId", "nombreProducto"],
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

export async function ventasPorCategoriaHoy() {
  const items = await prisma.itemVenta.findMany({
    where: { venta: { fecha: { gte: inicioDeHoy() } } },
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
