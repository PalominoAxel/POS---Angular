import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReporteService, ResumenDia, TopProducto, VentaPorCategoria } from '../../core/services/reporte.service';
import { Producto } from '../../core/models/producto.model';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';
import { CapitalizarPipe } from '../../shared/pipes/capitalizar.pipe';

@Component({
  selector: 'app-resumen',
  imports: [PrecioSolesPipe, CapitalizarPipe],
  templateUrl: './resumen.html',
})
export class Resumen implements OnInit {
  private readonly reporteService = inject(ReporteService);

  resumen = signal<ResumenDia | null>(null);
  topProductos = signal<TopProducto[]>([]);
  ventasPorCategoria = signal<VentaPorCategoria[]>([]);
  cargando = signal(true);

  mostrarModalStockBajo = signal(false);
  productosStockBajo = signal<Producto[]>([]);
  cargandoStockBajo = signal(false);

  readonly maxIngresoCategoria = computed(() =>
    Math.max(1, ...this.ventasPorCategoria().map((v) => v.totalIngresos)),
  );

  ngOnInit(): void {
    this.reporteService.resumenDia().subscribe((r) => this.resumen.set(r));
    this.reporteService.topProductos(5).subscribe((t) => this.topProductos.set(t));
    this.reporteService.ventasPorCategoria().subscribe((v) => {
      this.ventasPorCategoria.set(v);
      this.cargando.set(false);
    });
  }

  porcentajeBarra(valor: number): number {
    return Math.round((valor / this.maxIngresoCategoria()) * 100);
  }

  abrirStockBajo(): void {
    this.mostrarModalStockBajo.set(true);
    this.cargandoStockBajo.set(true);
    this.reporteService.stockBajo().subscribe({
      next: (data) => {
        this.productosStockBajo.set(data);
        this.cargandoStockBajo.set(false);
      },
      error: () => this.cargandoStockBajo.set(false),
    });
  }

  cerrarStockBajo(): void {
    this.mostrarModalStockBajo.set(false);
  }
}
