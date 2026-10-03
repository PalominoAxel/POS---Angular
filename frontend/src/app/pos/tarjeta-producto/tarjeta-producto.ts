import { Component, computed, inject, input } from '@angular/core';
import { Producto, UMBRAL_STOCK_BAJO } from '../../core/models/producto.model';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';
import { CarritoService } from '../carrito.service';

@Component({
  selector: 'app-tarjeta-producto',
  imports: [PrecioSolesPipe],
  templateUrl: './tarjeta-producto.html',
})
export class TarjetaProducto {
  private readonly carrito = inject(CarritoService);

  producto = input.required<Producto>();

  tieneDescuento = computed(() => this.producto().precioOferta < this.producto().precioRegular);
  porcentajeDescuento = computed(() => {
    const p = this.producto();
    return p.precioRegular > 0 ? Math.round(((p.precioRegular - p.precioOferta) / p.precioRegular) * 100) : 0;
  });

  estadoStock = computed(() => {
    const stock = this.producto().stock;
    if (stock === 0) return { clase: 'text-bg-danger', etiqueta: 'Agotado' };
    if (stock < UMBRAL_STOCK_BAJO) return { clase: 'text-bg-warning', etiqueta: 'Stock bajo' };
    return { clase: 'text-bg-success', etiqueta: 'Stock alto' };
  });

  cantidadEnCarrito = computed(() => this.carrito.cantidadEnCarrito(this.producto().id));

  onImagenError(evento: Event): void {
    (evento.target as HTMLImageElement).src = 'img/productos/default.svg';
  }

  agregar(): void {
    this.carrito.agregar(this.producto());
  }

  incrementar(): void {
    this.carrito.cambiarCantidad(this.producto().id, 1);
  }

  decrementar(): void {
    this.carrito.cambiarCantidad(this.producto().id, -1);
  }
}
