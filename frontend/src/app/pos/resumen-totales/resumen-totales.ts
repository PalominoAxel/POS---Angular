import { Component, inject } from '@angular/core';
import { CarritoService } from '../carrito.service';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';

@Component({
  selector: 'app-resumen-totales',
  imports: [PrecioSolesPipe],
  templateUrl: './resumen-totales.html',
})
export class ResumenTotales {
  readonly carrito = inject(CarritoService);
}
