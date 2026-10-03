import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { CatalogoProductos } from '../catalogo-productos/catalogo-productos';
import { Carrito } from '../carrito/carrito';
import { FormularioComprobante } from '../formulario-comprobante/formulario-comprobante';
import { CuponBox } from '../cupon-box/cupon-box';
import { ResumenTotales } from '../resumen-totales/resumen-totales';
import { TicketComprobante } from '../ticket-comprobante/ticket-comprobante';
import { CarritoService } from '../carrito.service';
import { VentaService } from '../../core/services/venta.service';
import { CajaService } from '../../core/services/caja.service';
import { METODOS_PAGO, MetodoPago, Venta } from '../../core/models/venta.model';
import { CajaSesion } from '../../core/models/caja.model';

@Component({
  selector: 'app-pos-page',
  imports: [CatalogoProductos, Carrito, FormularioComprobante, CuponBox, ResumenTotales, TicketComprobante],
  templateUrl: './pos-page.html',
})
export class PosPage implements OnInit {
  readonly carrito = inject(CarritoService);
  private readonly ventaService = inject(VentaService);
  private readonly cajaService = inject(CajaService);

  private readonly formularioComprobante = viewChild.required(FormularioComprobante);
  private readonly catalogo = viewChild.required(CatalogoProductos);

  readonly metodosPago = METODOS_PAGO;

  procesando = signal(false);
  errorPago = signal<string | null>(null);
  ultimaVenta = signal<Venta | null>(null);
  cajaAbierta = signal<CajaSesion | null>(null);
  verificandoCaja = signal(true);

  readonly carritoVacio = () => this.carrito.items().length === 0;

  ngOnInit(): void {
    this.verificarCaja();
  }

  verificarCaja(): void {
    this.verificandoCaja.set(true);
    this.cajaService.actual().subscribe({
      next: (caja) => {
        this.cajaAbierta.set(caja);
        this.verificandoCaja.set(false);
      },
      error: () => this.verificandoCaja.set(false),
    });
  }

  seleccionarMetodoPago(metodo: MetodoPago): void {
    this.carrito.metodoPago.set(metodo);
  }

  procesarPago(): void {
    this.errorPago.set(null);

    if (!this.cajaAbierta()) {
      this.errorPago.set('No hay una caja abierta. Pide a un administrador que abra caja antes de vender.');
      return;
    }
    if (this.carrito.items().length === 0) {
      this.errorPago.set('El carrito está vacío.');
      return;
    }

    const datosComprobante = this.formularioComprobante().obtenerDatos();
    if (!datosComprobante) return;

    this.procesando.set(true);

    this.ventaService
      .registrar({
        tipoComprobante: datosComprobante.tipoComprobante,
        metodoPago: this.carrito.metodoPago(),
        cliente: datosComprobante.cliente,
        cuponCodigo: this.carrito.cuponAplicado()?.codigo,
        items: this.carrito.items().map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
      })
      .subscribe({
        next: (venta) => {
          this.ultimaVenta.set(venta);
          this.carrito.vaciar();
          this.formularioComprobante().reiniciar();
          this.catalogo().cargar();
          this.procesando.set(false);
        },
        error: (err) => {
          this.errorPago.set(err.error?.mensaje ?? 'No se pudo procesar el pago.');
          this.procesando.set(false);
          if (err.status === 409) this.verificarCaja();
        },
      });
  }

  nuevaVenta(): void {
    this.ultimaVenta.set(null);
  }
}
