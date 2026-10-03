import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Venta } from '../../core/models/venta.model';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';

@Component({
  selector: 'app-ticket-comprobante',
  imports: [DatePipe, PrecioSolesPipe],
  templateUrl: './ticket-comprobante.html',
})
export class TicketComprobante {
  venta = input.required<Venta>();

  imprimir(): void {
    window.print();
  }

  verJson(): void {
    console.clear();
    console.log('=== JSON DEL COMPROBANTE ===');
    console.log(JSON.stringify(this.venta(), null, 2));
  }
}
