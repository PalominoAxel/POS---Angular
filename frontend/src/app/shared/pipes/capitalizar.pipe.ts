import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'capitalizar' })
export class CapitalizarPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '';
    return valor
      .split(' ')
      .filter((palabra) => palabra.length > 0)
      .map((palabra) => palabra.charAt(0).toUpperCase().concat(palabra.slice(1).toLowerCase()))
      .join(' ');
  }
}
