import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  EvolucionVenta,
  HoraPico,
  ReporteService,
  ResumenDia,
  TopProducto,
  VentaPorCategoria,
  VentaPorMetodoPago,
} from '../../core/services/reporte.service';
import { AuthService } from '../../core/services/auth.service';
import { Producto } from '../../core/models/producto.model';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';
import { CapitalizarPipe } from '../../shared/pipes/capitalizar.pipe';

interface PuntoLinea {
  x: number;
  y: number;
  fecha: string;
  total: number;
}

interface EtiquetaEjeX {
  x: number;
  texto: string;
}

interface EtiquetaEjeY {
  valor: number;
  top: number;
}

type RangoDias = 7 | 30 | 90;

const COLORES_METODO_PAGO: Record<string, string> = {
  EFECTIVO: '#10b981',
  TARJETA: '#6366f1',
  DIGITAL: '#0ea5e9',
};

const ETIQUETAS_METODO_PAGO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  DIGITAL: 'Billetera digital',
};

const PALETA_CATEGORIAS = ['#6366f1', '#0ea5e9', '#10b981', '#f97316', '#ec4899', '#eab308', '#14b8a6', '#8b5cf6'];

const CHART_ANCHO = 300;
const CHART_ALTO = 110;
const CHART_PADDING_X = 10;
const CHART_PADDING_Y = 12;
const CANTIDAD_ETIQUETAS_X_DISPERSAS = 6;

@Component({
  selector: 'app-resumen',
  imports: [PrecioSolesPipe, CapitalizarPipe],
  templateUrl: './resumen.html',
  styleUrl: './resumen.scss',
})
export class Resumen implements OnInit {
  private readonly reporteService = inject(ReporteService);
  private readonly authService = inject(AuthService);

  readonly chartAncho = CHART_ANCHO;
  readonly opcionesRango: readonly RangoDias[] = [7, 30, 90];

  resumen = signal<ResumenDia | null>(null);
  topProductos = signal<TopProducto[]>([]);
  ventasPorCategoria = signal<VentaPorCategoria[]>([]);
  evolucion = signal<EvolucionVenta[]>([]);
  metodosPago = signal<VentaPorMetodoPago[]>([]);
  horasPico = signal<HoraPico[]>([]);
  rangoDias = signal<RangoDias>(7);
  cargando = signal(true);

  mostrarModalStockBajo = signal(false);
  productosStockBajo = signal<Producto[]>([]);
  cargandoStockBajo = signal(false);

  readonly nombreUsuario = computed(() => this.authService.usuarioActual()?.nombre ?? 'Administrador');

  readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  readonly fechaFormateada = computed(() => {
    const texto = new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  readonly etiquetaRango = computed(() => `últimos ${this.rangoDias()} días`);

  readonly maxUnidadesTop = computed(() =>
    Math.max(1, ...this.topProductos().map((p) => p.unidadesVendidas)),
  );

  readonly totalEvolucion = computed(() => this.evolucion().reduce((s, e) => s + e.total, 0));

  /** Máximo real de la serie (sin piso artificial), base para decidir el paso del eje Y. */
  private readonly maxEvolucionReal = computed(() =>
    Math.max(0, ...this.evolucion().map((e) => e.total)),
  );

  /** Regla de escala: paso 500 hasta 4000, 1000 hasta 10000, 2000 en adelante. */
  readonly pasoEjeY = computed(() => {
    const max = this.maxEvolucionReal();
    if (max > 10000) return 2000;
    if (max > 4000) return 1000;
    return 500;
  });

  /** Techo del eje Y: el máximo real redondeado hacia arriba al siguiente paso. */
  readonly maxEjeY = computed(() => {
    const paso = this.pasoEjeY();
    const techo = Math.ceil(this.maxEvolucionReal() / paso) * paso;
    return techo > 0 ? techo : paso;
  });

  readonly ticksEjeY = computed(() => {
    const paso = this.pasoEjeY();
    const max = this.maxEjeY();
    const ticks: number[] = [];
    for (let v = 0; v <= max; v += paso) ticks.push(v);
    return ticks;
  });

  readonly lineasGridY = computed(() => this.ticksEjeY().map((valor) => this.posicionY(valor)));

  readonly etiquetasEjeY = computed<EtiquetaEjeY[]>(() =>
    this.ticksEjeY()
      .slice()
      .reverse()
      .map((valor) => ({ valor, top: (this.posicionY(valor) / CHART_ALTO) * 100 })),
  );

  readonly puntosLinea = computed<PuntoLinea[]>(() => {
    const datos = this.evolucion();
    if (datos.length === 0) return [];

    const pasoX = datos.length > 1 ? (CHART_ANCHO - CHART_PADDING_X * 2) / (datos.length - 1) : 0;

    return datos.map((d, i) => {
      const x = CHART_PADDING_X + pasoX * i;
      const y = this.posicionY(d.total);
      return { x, y, fecha: d.fecha, total: d.total };
    });
  });

  readonly lineaPath = computed(() => {
    const pts = this.puntosLinea();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  readonly areaPath = computed(() => {
    const pts = this.puntosLinea();
    if (pts.length === 0) return '';
    const base = CHART_ALTO - CHART_PADDING_Y;
    const primero = pts[0];
    const ultimo = pts[pts.length - 1];
    return (
      `M ${primero.x} ${base} ` + pts.map((p) => `L ${p.x} ${p.y}`).join(' ') + ` L ${ultimo.x} ${base} Z`
    );
  });

  readonly etiquetasEjeX = computed<EtiquetaEjeX[]>(() => {
    const datos = this.evolucion();
    const puntos = this.puntosLinea();
    if (datos.length === 0) return [];

    if (this.rangoDias() === 7) {
      return puntos.map((p) => ({ x: p.x, texto: this.etiquetaFecha(p.fecha) }));
    }

    const paso = Math.max(1, Math.floor((datos.length - 1) / (CANTIDAD_ETIQUETAS_X_DISPERSAS - 1)));
    const indices: number[] = [];
    for (let i = 0; i < datos.length; i += paso) indices.push(i);
    if (indices[indices.length - 1] !== datos.length - 1) indices.push(datos.length - 1);

    return indices.map((i) => ({ x: puntos[i].x, texto: this.etiquetaMes(datos[i].fecha) }));
  });

  readonly totalMetodosPago = computed(() => this.metodosPago().reduce((s, m) => s + m.total, 0));

  readonly donutGradient = computed(() => {
    const total = this.totalMetodosPago();
    if (total <= 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';

    let acumulado = 0;
    const segmentos = this.metodosPago().map((m) => {
      const inicio = (acumulado / total) * 360;
      acumulado += m.total;
      const fin = (acumulado / total) * 360;
      const color = this.colorMetodoPago(m.metodo);
      return `${color} ${inicio}deg ${fin}deg`;
    });

    return `conic-gradient(${segmentos.join(', ')})`;
  });

  readonly totalCategorias = computed(() => this.ventasPorCategoria().reduce((s, c) => s + c.totalIngresos, 0));

  readonly donutGradientCategorias = computed(() => {
    const total = this.totalCategorias();
    if (total <= 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';

    let acumulado = 0;
    const segmentos = this.ventasPorCategoria().map((c, i) => {
      const inicio = (acumulado / total) * 360;
      acumulado += c.totalIngresos;
      const fin = (acumulado / total) * 360;
      return `${this.colorCategoria(i)} ${inicio}deg ${fin}deg`;
    });

    return `conic-gradient(${segmentos.join(', ')})`;
  });

  readonly maxHoraPico = computed(() => Math.max(1, ...this.horasPico().map((h) => h.cantidadVentas)));

  readonly totalVentasHorasPico = computed(() => this.horasPico().reduce((s, h) => s + h.cantidadVentas, 0));

  ngOnInit(): void {
    this.cargarDatosFijos();
    this.cargarDatosDependientesDeRango();
  }

  private cargarDatosFijos(): void {
    this.reporteService.resumenDia().subscribe((r) => this.resumen.set(r));
    this.reporteService.horasPico().subscribe((h) => this.horasPico.set(h));
  }

  private cargarDatosDependientesDeRango(): void {
    this.cargando.set(true);
    const rango = this.rangoDias();

    forkJoin({
      topProductos: this.reporteService.topProductos(5, rango),
      categorias: this.reporteService.ventasPorCategoria(rango),
      evolucion: this.reporteService.evolucionVentas(rango),
      metodosPago: this.reporteService.ventasPorMetodoPago(rango),
    }).subscribe({
      next: ({ topProductos, categorias, evolucion, metodosPago }) => {
        this.topProductos.set(topProductos);
        this.ventasPorCategoria.set(categorias);
        this.evolucion.set(evolucion);
        this.metodosPago.set(metodosPago);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cambiarRango(rango: RangoDias): void {
    if (this.rangoDias() === rango) return;
    this.rangoDias.set(rango);
    this.cargarDatosDependientesDeRango();
  }

  refrescar(): void {
    this.cargarDatosFijos();
    this.cargarDatosDependientesDeRango();
  }

  private posicionY(valor: number): number {
    const max = this.maxEjeY();
    return CHART_PADDING_Y + (CHART_ALTO - CHART_PADDING_Y * 2) * (1 - valor / max);
  }

  formatoEjeY(valor: number): string {
    return `S/ ${valor.toLocaleString('es-PE')}`;
  }

  porcentajeTop(valor: number): number {
    return Math.round((valor / this.maxUnidadesTop()) * 100);
  }

  barraAltura(cantidad: number): number {
    return Math.round((cantidad / this.maxHoraPico()) * 100);
  }

  etiquetaFecha(fechaIso: string): string {
    const fecha = new Date(`${fechaIso}T00:00:00`);
    const texto = fecha.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit' });
    return texto.replace('.', '');
  }

  etiquetaMes(fechaIso: string): string {
    const fecha = new Date(`${fechaIso}T00:00:00`);
    const texto = fecha.toLocaleDateString('es-PE', { month: 'short' });
    return (texto.charAt(0).toUpperCase() + texto.slice(1)).replace('.', '');
  }

  etiquetaMetodoPago(metodo: string): string {
    return ETIQUETAS_METODO_PAGO[metodo] ?? metodo;
  }

  colorMetodoPago(metodo: string): string {
    return COLORES_METODO_PAGO[metodo] ?? '#94a3b8';
  }

  colorCategoria(indice: number): string {
    return PALETA_CATEGORIAS[indice % PALETA_CATEGORIAS.length];
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
