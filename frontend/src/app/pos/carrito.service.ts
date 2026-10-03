import { Injectable, computed, inject, signal } from '@angular/core';
import { Producto } from '../core/models/producto.model';
import { Cupon, ItemCarrito, MetodoPago } from '../core/models/venta.model';
import { CuponService } from '../core/services/cupon.service';

const DESCUENTO_COMBO_BEBIDA = 1.0;
const IGV_RATE = 0.18;

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly cuponService = inject(CuponService);

  readonly items = signal<ItemCarrito[]>([]);
  readonly cuponAplicado = signal<Cupon | null>(null);
  readonly errorCupon = signal<string | null>(null);
  readonly metodoPago = signal<MetodoPago>('EFECTIVO');

  readonly totalProductos = computed(() =>
    this.items().reduce((suma, i) => suma + i.precioRegular * i.cantidad, 0),
  );

  private readonly totalOfertas = computed(() =>
    this.items().reduce((suma, i) => suma + i.precioOferta * i.cantidad, 0),
  );

  readonly tieneBebida = computed(() => this.items().some((i) => i.categoria === 'Bebidas'));

  /** Descuento de catálogo (ofertas + combo bebida), sin cupón. Vista previa; el backend recalcula al pagar. */
  readonly descuentoBase = computed(() => {
    const base = this.totalProductos() - this.totalOfertas();
    return this.tieneBebida() ? base + DESCUENTO_COMBO_BEBIDA : base;
  });

  readonly subtotalDisponibleParaCupon = computed(() =>
    Math.max(0, this.totalProductos() - this.descuentoBase()),
  );

  readonly montoDescuentoCupon = computed(() => {
    const cupon = this.cuponAplicado();
    return cupon ? Math.min(cupon.montoDescuento, this.subtotalDisponibleParaCupon()) : 0;
  });

  readonly descuentoTotal = computed(() => this.descuentoBase() + this.montoDescuentoCupon());

  readonly totalEstimado = computed(() => Math.max(0, this.totalProductos() - this.descuentoTotal()));

  aplicarCupon(codigo: string): void {
    this.errorCupon.set(null);

    if (this.cuponAplicado()) {
      this.errorCupon.set('Ya tienes un cupón activo. Quítalo para aplicar otro.');
      return;
    }
    if (!codigo.trim()) {
      this.errorCupon.set('Ingresa un número de cupón.');
      return;
    }
    if (this.subtotalDisponibleParaCupon() <= 0) {
      this.errorCupon.set('El cupón no puede aplicarse: el total de la venta es S/ 0.00.');
      return;
    }

    this.cuponService.validar(codigo.trim()).subscribe({
      next: (cupon) => this.cuponAplicado.set(cupon),
      error: () => this.errorCupon.set('Cupón inválido o expirado.'),
    });
  }

  quitarCupon(): void {
    this.cuponAplicado.set(null);
    this.errorCupon.set(null);
  }

  agregar(producto: Producto): void {
    this.items.update((lista) => {
      const existente = lista.find((i) => i.productoId === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) return lista;
        return lista.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      if (producto.stock <= 0) return lista;
      return [
        ...lista,
        {
          productoId: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          categoria: producto.categoria,
          precioRegular: producto.precioRegular,
          precioOferta: producto.precioOferta,
          stockDisponible: producto.stock,
          cantidad: 1,
        },
      ];
    });
  }

  cambiarCantidad(productoId: number, delta: number): void {
    this.items.update((lista) =>
      lista
        .map((i) =>
          i.productoId === productoId
            ? { ...i, cantidad: Math.min(i.stockDisponible, Math.max(0, i.cantidad + delta)) }
            : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  }

  quitar(productoId: number): void {
    this.items.update((lista) => lista.filter((i) => i.productoId !== productoId));
  }

  vaciar(): void {
    this.items.set([]);
    this.cuponAplicado.set(null);
    this.errorCupon.set(null);
    this.metodoPago.set('EFECTIVO');
  }

  cantidadEnCarrito(productoId: number): number {
    return this.items().find((i) => i.productoId === productoId)?.cantidad ?? 0;
  }
}

export { IGV_RATE };
