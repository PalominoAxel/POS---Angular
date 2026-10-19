const UNIDADES = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS',
  'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];

const DECENAS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];

const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

function menorDeMil(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const partes: string[] = [];
  const centenas = Math.floor(n / 100);
  const resto = n % 100;

  if (centenas > 0) partes.push(CENTENAS[centenas]);

  if (resto > 0) {
    if (resto < 30) {
      partes.push(UNIDADES[resto]);
    } else {
      const decena = DECENAS[Math.floor(resto / 10)];
      const unidad = resto % 10;
      partes.push(unidad ? `${decena} Y ${UNIDADES[unidad]}` : decena);
    }
  }

  return partes.join(' ');
}

function entero(n: number): string {
  if (n === 0) return 'CERO';

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];

  if (millones > 0) partes.push(millones === 1 ? 'UN MILLÓN' : `${menorDeMil(millones)} MILLONES`);
  if (miles > 0) partes.push(miles === 1 ? 'MIL' : `${menorDeMil(miles)} MIL`);
  if (resto > 0) partes.push(menorDeMil(resto));

  return partes.join(' ');
}

/** Ej.: 12.4 -> "DOCE CON 40/100 SOLES" */
export function montoEnLetras(monto: number): string {
  const centimosTotales = Math.round((monto || 0) * 100);
  const soles = Math.floor(centimosTotales / 100);
  const centimos = centimosTotales % 100;

  return `${entero(soles)} CON ${String(centimos).padStart(2, '0')}/100 ${soles === 1 ? 'SOL' : 'SOLES'}`;
}
