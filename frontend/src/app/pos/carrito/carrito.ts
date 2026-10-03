import { Component, inject } from '@angular/core';
import { CarritoService } from '../carrito.service';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';

@Component({
  selector: 'app-carrito',
  imports: [PrecioSolesPipe],
  templateUrl: './carrito.html',
})
export class Carrito {
  readonly carrito = inject(CarritoService);

  incrementar(productoId: number): void {
    this.carrito.cambiarCantidad(productoId, 1);
  }

  decrementar(productoId: number): void {
    this.carrito.cambiarCantidad(productoId, -1);
  }

  quitar(productoId: number): void {
    this.carrito.quitar(productoId);
  }
}
