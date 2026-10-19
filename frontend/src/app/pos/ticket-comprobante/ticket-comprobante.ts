import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ItemVenta, Venta } from '../../core/models/venta.model';
import { EMPRESA } from '../../core/config/empresa.config';
import { SedeService } from '../../core/services/sede.service';
import { montoEnLetras } from '../../shared/utils/monto-en-letras';

const ETIQUETAS_METODO_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  DIGITAL: 'Yape/Plin',
};

@Component({
  selector: 'app-ticket-comprobante',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './ticket-comprobante.html',
  styleUrl: './ticket-comprobante.scss',
})
export class TicketComprobante implements OnInit {
  private readonly sedeService = inject(SedeService);

  venta = input.required<Venta>();

  // Se inicializa con los valores por defecto y se reemplaza por los datos reales de la sede al cargar.
  readonly empresa = signal(EMPRESA);

  ngOnInit(): void {
    this.sedeService.obtener().subscribe({
      next: (sede) => this.empresa.set(sede),
      error: () => {}, // si falla, se mantiene EMPRESA como respaldo
    });
  }

  readonly esFactura = computed(() => this.venta().tipoComprobante === 'FACTURA');

  readonly titulo = computed(() =>
    this.esFactura() ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA',
  );

  // "F001-000001" -> "F001 - 000001"
  readonly numero = computed(() => this.venta().numeroComprobante.replace('-', ' - '));

  readonly registro = computed(() => `${this.empresa().numeroTienda}-${this.venta().cajaSesionId ?? 1}`);

  readonly opGravada = computed(() => this.venta().totalPagar - this.venta().igvDesglosado);

  readonly montoLetras = computed(() => montoEnLetras(this.venta().totalPagar));

  readonly metodoPago = computed(() => ETIQUETAS_METODO_PAGO[this.venta().metodoPago] ?? this.venta().metodoPago);

  codigo(item: ItemVenta): string {
    return item.producto?.codigo ?? '-';
  }

  precioUnitario(item: ItemVenta): number {
    return item.producto?.precioRegular ?? item.precioUnitario;
  }

  descuentoUnitario(item: ItemVenta): number {
    return Math.max(0, this.precioUnitario(item) - item.precioUnitario);
  }

  imprimir(): void {
    window.print();
  }

  verJson(): void {
    console.clear();
    console.log('=== JSON DEL COMPROBANTE ===');
    console.log(JSON.stringify(this.venta(), null, 2));
  }
}
