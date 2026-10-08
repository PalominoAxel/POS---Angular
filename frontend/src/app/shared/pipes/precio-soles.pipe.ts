import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

registerLocaleData(localeEsPe);

@Pipe({ name: 'precioSoles' })
export class PrecioSolesPipe implements PipeTransform {
  private readonly currencyPipe = new CurrencyPipe('es-PE');

  transform(valor: number | null | undefined): string {
    if (valor == null || isNaN(valor)) return 'S/ 0.00';
    const formateado = this.currencyPipe.transform(valor, 'PEN', 'symbol', '1.2-2', 'es-PE');
    return (formateado ?? 'S/ 0.00').replace(/ /g, ' ');
  }
}
