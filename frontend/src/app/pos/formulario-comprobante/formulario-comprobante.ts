import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClienteBoleta, ClienteFactura, TipoComprobante } from '../../core/models/venta.model';

export type TipoDocumento = 'SIN_DOC' | 'DNI' | 'CE';

const LONGITUD_DOCUMENTO: Record<Exclude<TipoDocumento, 'SIN_DOC'>, number> = { DNI: 8, CE: 9 };
const PATRON_DOCUMENTO: Record<Exclude<TipoDocumento, 'SIN_DOC'>, RegExp> = {
  DNI: /^\d{8}$/,
  CE: /^\d{9}$/,
};
/** RUC peruano: 11 dígitos, empieza con el tipo de contribuyente (10, 15, 16, 17 o 20). */
const PATRON_RUC = /^(10|15|16|17|20)\d{9}$/;

@Component({
  selector: 'app-formulario-comprobante',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-comprobante.html',
})
export class FormularioComprobante {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    tipoComprobante: this.fb.nonNullable.control<TipoComprobante>('BOLETA'),
    tipoDocumento: this.fb.nonNullable.control<TipoDocumento>('SIN_DOC'),
    numeroDocumento: this.fb.nonNullable.control(''),
    ruc: this.fb.nonNullable.control(''),
    razonSocial: this.fb.nonNullable.control(''),
  });

  readonly controls = this.form.controls;

  error = signal<string | null>(null);

  maxLengthDocumento(): number {
    const tipo = this.controls.tipoDocumento.value;
    return tipo === 'SIN_DOC' ? 0 : LONGITUD_DOCUMENTO[tipo];
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

  onTipoComprobanteChange(): void {
    this.error.set(null);
    this.actualizarValidadores();
  }

  onTipoDocumentoChange(): void {
    this.controls.numeroDocumento.setValue('');
    this.actualizarValidadores();
  }

  onNumeroDocumentoInput(valor: string): void {
    this.controls.numeroDocumento.setValue(valor.replace(/\D/g, '').slice(0, this.maxLengthDocumento()));
  }

  onRucInput(valor: string): void {
    this.controls.ruc.setValue(valor.replace(/\D/g, '').slice(0, 11));
  }

  private actualizarValidadores(): void {
    const tipoDoc = this.controls.tipoDocumento.value;
    if (tipoDoc === 'SIN_DOC') {
      this.controls.numeroDocumento.clearValidators();
    } else {
      this.controls.numeroDocumento.setValidators([Validators.required, Validators.pattern(PATRON_DOCUMENTO[tipoDoc])]);
    }
    this.controls.numeroDocumento.updateValueAndValidity();

    const esFactura = this.controls.tipoComprobante.value === 'FACTURA';
    if (esFactura) {
      this.controls.ruc.setValidators([Validators.required, Validators.pattern(PATRON_RUC)]);
      this.controls.razonSocial.setValidators([Validators.required]);
    } else {
      this.controls.ruc.clearValidators();
      this.controls.razonSocial.clearValidators();
    }
    this.controls.ruc.updateValueAndValidity();
    this.controls.razonSocial.updateValueAndValidity();
  }

  /** Valida y devuelve los datos listos para enviar, o null si hay errores (mostrados en `error`). */
  obtenerDatos(): { tipoComprobante: TipoComprobante; cliente: ClienteBoleta | ClienteFactura } | null {
    this.error.set(null);
    this.actualizarValidadores();
    this.form.markAllAsTouched();

    const valores = this.form.getRawValue();

    if (valores.tipoComprobante === 'FACTURA') {
      if (this.controls.ruc.invalid) {
        this.error.set('El RUC debe contener exactamente 11 dígitos numéricos y empezar con 10, 15, 16, 17 o 20.');
        return null;
      }
      if (this.controls.razonSocial.invalid) {
        this.error.set('Ingrese la Razón Social del cliente.');
        return null;
      }
      const cliente: ClienteFactura = { ruc: valores.ruc, razonSocial: valores.razonSocial.trim() };
      return { tipoComprobante: 'FACTURA', cliente };
    }

    if (valores.tipoDocumento === 'SIN_DOC') {
      return { tipoComprobante: 'BOLETA', cliente: { tipoDocumento: null, numeroDocumento: null } };
    }

    if (this.controls.numeroDocumento.invalid) {
      const longitud = LONGITUD_DOCUMENTO[valores.tipoDocumento];
      this.error.set(
        valores.numeroDocumento.trim()
          ? `${valores.tipoDocumento}: debe contener exactamente ${longitud} dígitos.`
          : `Ingrese el número de ${valores.tipoDocumento} o seleccione "Sin documento".`,
      );
      return null;
    }

    const cliente: ClienteBoleta = {
      tipoDocumento: valores.tipoDocumento,
      numeroDocumento: valores.numeroDocumento.trim(),
    };
    return { tipoComprobante: 'BOLETA', cliente };
  }

  reiniciar(): void {
    this.form.reset({
      tipoComprobante: 'BOLETA',
      tipoDocumento: 'SIN_DOC',
      numeroDocumento: '',
      ruc: '',
      razonSocial: '',
    });
    this.error.set(null);
    this.actualizarValidadores();
  }
}
