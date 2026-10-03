import { PrecioSolesPipe } from './precio-soles.pipe';

describe('PrecioSolesPipe', () => {
  const pipe = new PrecioSolesPipe();

  it('formatea un número como soles con dos decimales', () => {
    expect(pipe.transform(24.9)).toBe('S/ 24.90');
  });

  it('devuelve S/ 0.00 para valores nulos', () => {
    expect(pipe.transform(null)).toBe('S/ 0.00');
  });
});
