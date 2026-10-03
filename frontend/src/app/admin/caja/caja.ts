import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CajaService } from '../../core/services/caja.service';
import { CajaSesion, ResumenCaja } from '../../core/models/caja.model';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';

@Component({
  selector: 'app-caja',
  imports: [FormsModule, DatePipe, PrecioSolesPipe],
  templateUrl: './caja.html',
})
export class Caja implements OnInit {
  private readonly cajaService = inject(CajaService);

  cajaActual = signal<CajaSesion | null>(null);
  resumen = signal<ResumenCaja | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  montoApertura = signal(0);
  montoCierreDeclarado = signal(0);

  resultadoCierre = signal<ResumenCaja | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.cajaService.actual().subscribe({
      next: (caja) => {
        this.cajaActual.set(caja);
        if (caja) {
          this.cajaService.resumenActual().subscribe((resumen) => {
            this.resumen.set(resumen);
            this.cargando.set(false);
          });
        } else {
          this.cargando.set(false);
        }
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCaja(): void {
    if (this.montoApertura() < 0) {
      this.error.set('El monto de apertura no puede ser negativo.');
      return;
    }
    this.cajaService.abrir(this.montoApertura()).subscribe({
      next: () => {
        this.montoApertura.set(0);
        this.cargar();
      },
      error: (err) => this.error.set(err.error?.mensaje ?? 'No se pudo abrir la caja.'),
    });
  }

  cerrarCaja(): void {
    const resumen = this.resumen();
    if (!resumen) return;

    const confirmado = confirm(
      `¿Estás seguro de cerrar la caja?\n\n` +
        `Ventas registradas: ${resumen.numeroVentas}\n` +
        `Total vendido: S/ ${resumen.totalVentas.toFixed(2)}\n` +
        `Efectivo esperado en caja: S/ ${resumen.montoEfectivoEsperado.toFixed(2)}\n` +
        `Monto que estás declarando: S/ ${this.montoCierreDeclarado().toFixed(2)}\n\n` +
        `Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    this.cajaService.cerrar(this.montoCierreDeclarado()).subscribe({
      next: (resultado) => {
        this.resultadoCierre.set(resultado);
        this.montoCierreDeclarado.set(0);
        this.cargar();
      },
      error: (err) => this.error.set(err.error?.mensaje ?? 'No se pudo cerrar la caja.'),
    });
  }

  cerrarResultadoCierre(): void {
    this.resultadoCierre.set(null);
  }
}
