import { CapitalizarPipe } from './capitalizar.pipe';

describe('CapitalizarPipe', () => {
  const pipe = new CapitalizarPipe();

  it('capitaliza cada palabra de una cadena', () => {
    expect(pipe.transform('lomo de res')).toBe('Lomo De Res');
  });

  it('devuelve cadena vacía cuando el valor es nulo o vacío', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
