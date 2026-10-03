import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Venta } from '../../core/models/venta.model';
import { VentaService } from '../../core/services/venta.service';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';
import { TicketComprobante } from '../../pos/ticket-comprobante/ticket-comprobante';

@Component({
  selector: 'app-ventas',
  imports: [DatePipe, FormsModule, PrecioSolesPipe, TicketComprobante],
  templateUrl: './ventas.html',
})
export class Ventas implements OnInit {
  private readonly ventaService = inject(VentaService);

  ventas = signal<Venta[]>([]);
  cargando = signal(true);
  ventaSeleccionada = signal<Venta | null>(null);

  fechaInicio = signal('');
  fechaFin = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.ventaService.listar(this.fechaInicio() || undefined, this.fechaFin() || undefined).subscribe({
      next: (data) => {
        this.ventas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  filtrarHoy(): void {
    const hoy = new Date().toISOString().slice(0, 10);
    this.fechaInicio.set(hoy);
    this.fechaFin.set(hoy);
    this.cargar();
  }

  limpiarFiltro(): void {
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.cargar();
  }

  ver(venta: Venta): void {
    this.ventaSeleccionada.set(venta);
  }

  cerrarModal(): void {
    this.ventaSeleccionada.set(null);
  }
}
