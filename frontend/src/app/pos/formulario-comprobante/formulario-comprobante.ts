import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClienteBoleta, ClienteFactura, TipoComprobante } from '../../core/models/venta.model';

type TipoDocumento = 'SIN_DOC' | 'DNI' | 'CE';

const LONGITUD_DOCUMENTO: Record<Exclude<TipoDocumento, 'SIN_DOC'>, number> = { DNI: 8, CE: 9 };

@Component({
  selector: 'app-formulario-comprobante',
  imports: [FormsModule],
  templateUrl: './formulario-comprobante.html',
})
export class FormularioComprobante {
  tipoComprobante = signal<TipoComprobante>('BOLETA');

  tipoDocumento = signal<TipoDocumento>('SIN_DOC');
  numeroDocumento = signal('');

  ruc = signal('');
  razonSocial = signal('');

  error = signal<string | null>(null);

  readonly maxLengthDocumento = () =>
    this.tipoDocumento() === 'SIN_DOC' ? 0 : LONGITUD_DOCUMENTO[this.tipoDocumento() as 'DNI' | 'CE'];

  soloNumeros(valor: string, maxLength: number): string {
    return valor.replace(/\D/g, '').slice(0, maxLength);
  }

  /** Bloquea a nivel de teclado cualquier tecla que no sea un dígito o una tecla de control (Backspace, flechas, etc.). */
  bloquearNoNumerico(event: KeyboardEvent): void {
    const teclasPermitidas = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ];
    if (teclasPermitidas.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return; // permitir Ctrl/Cmd+C, V, A, etc.
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onNumeroDocumentoInput(valor: string): void {
    this.numeroDocumento.set(this.soloNumeros(valor, this.maxLengthDocumento()));
  }

  onRucInput(valor: string): void {
    this.ruc.set(this.soloNumeros(valor, 11));
  }

  /** Valida y devuelve los datos listos para enviar, o null si hay errores (mostrados en `error`). */
  obtenerDatos(): { tipoComprobante: TipoComprobante; cliente: ClienteBoleta | ClienteFactura } | null {
    this.error.set(null);

    if (this.tipoComprobante() === 'FACTURA') {
      if (!/^\d{11}$/.test(this.ruc())) {
        this.error.set('El RUC debe contener exactamente 11 dígitos numéricos.');
        return null;
      }
      if (!this.razonSocial().trim()) {
        this.error.set('Ingrese la Razón Social del cliente.');
        return null;
      }
      const cliente: ClienteFactura = { ruc: this.ruc(), razonSocial: this.razonSocial().trim() };
      return { tipoComprobante: 'FACTURA', cliente };
    }

    if (this.tipoDocumento() === 'SIN_DOC') {
      return { tipoComprobante: 'BOLETA', cliente: { tipoDocumento: null, numeroDocumento: null } };
    }

    const documento = this.numeroDocumento().trim();
    const longitud = LONGITUD_DOCUMENTO[this.tipoDocumento() as 'DNI' | 'CE'];

    if (!documento) {
      this.error.set(`Ingrese el número de ${this.tipoDocumento()} o seleccione "Sin documento".`);
      return null;
    }
    if (documento.length !== longitud) {
      this.error.set(`${this.tipoDocumento()}: debe contener exactamente ${longitud} dígitos.`);
      return null;
    }

    const cliente: ClienteBoleta = { tipoDocumento: this.tipoDocumento() as 'DNI' | 'CE', numeroDocumento: documento };
    return { tipoComprobante: 'BOLETA', cliente };
  }

  reiniciar(): void {
    this.tipoComprobante.set('BOLETA');
    this.tipoDocumento.set('SIN_DOC');
    this.numeroDocumento.set('');
    this.ruc.set('');
    this.razonSocial.set('');
    this.error.set(null);
  }
}
