import { Prisma, Producto } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { obtenerCuponPorCodigo } from "../data/cupones.store";
import {
  ClienteBoletaInput,
  ClienteFacturaInput,
  ItemCarritoInput,
  METODOS_PAGO,
  TipoComprobante,
  VentaInput,
} from "../models/venta";
import { obtenerCajaAbierta } from "./caja.service";

const IGV_RATE = 0.18;
const DESCUENTO_COMBO_BEBIDA = 1.0;

export class VentaError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function esFactura(cliente: ClienteBoletaInput | ClienteFacturaInput): cliente is ClienteFacturaInput {
  return "ruc" in cliente;
}

async function cargarProductosCarrito(items: ItemCarritoInput[]): Promise<Map<number, Producto>> {
  if (!items.length) throw new VentaError("La venta debe incluir al menos un producto");

  const ids = items.map((i) => i.productoId);
  const productos = await prisma.producto.findMany({ where: { id: { in: ids } } });
  const mapa = new Map(productos.map((p) => [p.id, p]));

  for (const item of items) {
    const producto = mapa.get(item.productoId);
    if (!producto || !producto.activo) {
      throw new VentaError(`Producto ${item.productoId} no existe`);
    }
    if (item.cantidad <= 0) {
      throw new VentaError(`Cantidad inválida para ${producto.nombre}`);
    }
    if (item.cantidad > producto.stock) {
      throw new VentaError(`Stock insuficiente de "${producto.nombre}" (disponible: ${producto.stock})`);
    }
  }

  return mapa;
}

async function calcularTotales(items: ItemCarritoInput[], productos: Map<number, Producto>, cuponCodigo?: string) {
  const totalProductos = items.reduce((suma, i) => suma + productos.get(i.productoId)!.precioRegular * i.cantidad, 0);
  const totalOfertas = items.reduce((suma, i) => suma + productos.get(i.productoId)!.precioOferta * i.cantidad, 0);

  let descuentoBase = totalProductos - totalOfertas;

  const tieneBebida = items.some((i) => productos.get(i.productoId)!.categoria === "Bebidas");
  if (tieneBebida) descuentoBase += DESCUENTO_COMBO_BEBIDA;

  const subtotalDisponible = Math.max(0, totalProductos - descuentoBase);

  let cuponId: number | null = null;
  let cuponMontoDescuento = 0;

  if (cuponCodigo) {
    const cupon = await obtenerCuponPorCodigo(cuponCodigo);
    if (!cupon) throw new VentaError("Cupón inválido o expirado");
    if (subtotalDisponible <= 0) {
      throw new VentaError("El cupón no puede aplicarse: el total de la venta es S/ 0.00");
    }
    cuponId = cupon.id;
    cuponMontoDescuento = Math.min(cupon.montoDescuento, subtotalDisponible);
  }

  const descuentoAplicado = redondear(descuentoBase + cuponMontoDescuento);
  const totalPagar = redondear(Math.max(0, totalProductos - descuentoAplicado));
  // El IGV ya está incluido en los precios: se extrae del total, es solo informativo.
  const igvDesglosado = redondear(totalPagar - totalPagar / (1 + IGV_RATE));

  return {
    totalProductos: redondear(totalProductos),
    descuentoAplicado,
    cuponId,
    cuponMontoDescuento: redondear(cuponMontoDescuento),
    totalPagar,
    igvDesglosado,
  };
}

async function siguienteCorrelativo(tx: Prisma.TransactionClient, tipo: TipoComprobante): Promise<string> {
  const correlativo = await tx.correlativoComprobante.upsert({
    where: { tipo },
    create: { tipo, ultimoNumero: 1 },
    update: { ultimoNumero: { increment: 1 } },
  });

  const prefijo = tipo === "FACTURA" ? "F001" : "B001";
  return `${prefijo}-${String(correlativo.ultimoNumero).padStart(6, "0")}`;
}

function validarCliente(input: VentaInput) {
  if (esFactura(input.cliente)) {
    if (!/^\d{11}$/.test(input.cliente.ruc)) {
      throw new VentaError("El RUC debe contener exactamente 11 dígitos numéricos");
    }
    if (!input.cliente.razonSocial?.trim()) {
      throw new VentaError("Ingrese la Razón Social del cliente");
    }
    return;
  }

  const { tipoDocumento, numeroDocumento } = input.cliente;
  if (!tipoDocumento) return; // Cliente Varios, sin documento

  const longitudes: Record<string, number> = { DNI: 8, CE: 9 };
  const longitud = longitudes[tipoDocumento];
  const documento = (numeroDocumento ?? "").trim();

  if (!documento) throw new VentaError(`Ingrese el número de ${tipoDocumento} o seleccione "Sin documento"`);
  if (!/^\d+$/.test(documento)) throw new VentaError("El documento solo puede contener números");
  if (documento.length !== longitud) {
    throw new VentaError(`${tipoDocumento}: debe contener exactamente ${longitud} dígitos`);
  }
}

export async function registrarVenta(input: VentaInput, usuarioId: number) {
  if (!(METODOS_PAGO as readonly string[]).includes(input.metodoPago)) {
    throw new VentaError(`Método de pago inválido. Use: ${METODOS_PAGO.join(", ")}`);
  }
  const cajaAbierta = await obtenerCajaAbierta();
  if (!cajaAbierta) {
    throw new VentaError("No hay una caja abierta. Un administrador debe abrir caja antes de vender.", 409);
  }

  validarCliente(input);
  const productos = await cargarProductosCarrito(input.items);
  const totales = await calcularTotales(input.items, productos, input.cuponCodigo);

  return prisma.$transaction(async (tx) => {
    const numeroComprobante = await siguienteCorrelativo(tx, input.tipoComprobante);

    const venta = await tx.venta.create({
      data: {
        numeroComprobante,
        tipoComprobante: input.tipoComprobante,
        metodoPago: input.metodoPago,
        cajaSesionId: cajaAbierta.id,
        usuarioId,
        clienteTipoDocumento: esFactura(input.cliente) ? null : input.cliente.tipoDocumento ?? null,
        clienteNumeroDocumento: esFactura(input.cliente) ? null : input.cliente.numeroDocumento ?? null,
        clienteRuc: esFactura(input.cliente) ? input.cliente.ruc : null,
        clienteRazonSocial: esFactura(input.cliente) ? input.cliente.razonSocial : null,
        cuponId: totales.cuponId,
        cuponMontoDescuento: totales.cuponMontoDescuento,
        totalProductos: totales.totalProductos,
        descuentoAplicado: totales.descuentoAplicado,
        igvDesglosado: totales.igvDesglosado,
        totalPagar: totales.totalPagar,
        items: {
          create: input.items.map((item) => {
            const producto = productos.get(item.productoId)!;
            return {
              productoId: producto.id,
              nombreProducto: producto.nombre,
              categoria: producto.categoria,
              cantidad: item.cantidad,
              precioUnitario: producto.precioOferta,
              subtotal: redondear(producto.precioOferta * item.cantidad),
            };
          }),
        },
      },
      include: { items: true, cupon: true, usuario: { select: { id: true, nombre: true, nombreUsuario: true, rol: true } } },
    });

    for (const item of input.items) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: { decrement: item.cantidad } },
      });
    }

    return venta;
  });
}

export function listarVentas(fechaInicio?: Date, fechaFin?: Date) {
  const fecha: Prisma.DateTimeFilter | undefined =
    fechaInicio || fechaFin
      ? { ...(fechaInicio && { gte: fechaInicio }), ...(fechaFin && { lte: fechaFin }) }
      : undefined;

  return prisma.venta.findMany({
    where: fecha ? { fecha } : undefined,
    include: { items: true, cupon: true, usuario: { select: { id: true, nombre: true, nombreUsuario: true, rol: true } } },
    orderBy: { fecha: "desc" },
  });
}

export function obtenerVenta(id: number) {
  return prisma.venta.findUnique({
    where: { id },
    include: { items: true, cupon: true, usuario: { select: { id: true, nombre: true, nombreUsuario: true, rol: true } } },
  });
}
