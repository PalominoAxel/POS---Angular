import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'precioSoles' })
export class PrecioSolesPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    if (valor == null || isNaN(valor)) return 'S/ 0.00';
    return `S/ ${valor.toFixed(2)}`;
  }
}
