import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CATEGORIAS, Producto } from '../../core/models/producto.model';
import { ProductoService } from '../../core/services/producto.service';
import { TarjetaProducto } from '../tarjeta-producto/tarjeta-producto';

@Component({
  selector: 'app-catalogo-productos',
  imports: [TarjetaProducto],
  templateUrl: './catalogo-productos.html',
})
export class CatalogoProductos implements OnInit {
  private readonly productoService = inject(ProductoService);

  readonly categorias = CATEGORIAS;
  productos = signal<Producto[]>([]);
  cargando = signal(true);
  categoriaSeleccionada = signal<string>('TODAS');

  productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const lista = this.productos();
    return categoria === 'TODAS' ? lista : lista.filter((p) => p.categoria === categoria);
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.productoService.listar().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
