import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../carrito.service';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';

@Component({
  selector: 'app-cupon-box',
  imports: [FormsModule, PrecioSolesPipe],
  templateUrl: './cupon-box.html',
})
export class CuponBox {
  readonly carrito = inject(CarritoService);

  visible = signal(false);
  codigo = signal('');

  alternar(): void {
    this.visible.update((v) => !v);
    if (!this.visible()) {
      this.codigo.set('');
    }
  }

  onCodigoInput(valor: string): void {
    this.codigo.set(valor.replace(/\D/g, '').slice(0, 12));
  }

  aplicar(): void {
    this.carrito.aplicarCupon(this.codigo());
  }

  quitar(): void {
    this.carrito.quitarCupon();
    this.codigo.set('');
  }
}
