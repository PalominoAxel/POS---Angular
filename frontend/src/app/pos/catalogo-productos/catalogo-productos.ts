import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Producto } from '../../core/models/producto.model';
import { Categoria } from '../../core/models/categoria.model';
import { ProductoService } from '../../core/services/producto.service';
import { CategoriaService } from '../../core/services/categoria.service';
import { TarjetaProducto } from '../tarjeta-producto/tarjeta-producto';

@Component({
  selector: 'app-catalogo-productos',
  imports: [TarjetaProducto],
  templateUrl: './catalogo-productos.html',
})
export class CatalogoProductos implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  categorias = signal<Categoria[]>([]);
  productos = signal<Producto[]>([]);
  cargando = signal(true);
  categoriaSeleccionada = signal<string>('TODAS');
  busqueda = signal<string>('');

  productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const texto = this.busqueda().trim().toLowerCase();
    let lista = this.productos();
    if (categoria !== 'TODAS') lista = lista.filter((p) => p.categoria === categoria);
    if (texto) {
      lista = lista.filter(
        (p) => p.nombre.toLowerCase().includes(texto) || p.codigo.toLowerCase().includes(texto),
      );
    }
    return lista;
  });

  onBusquedaInput(valor: string): void {
    this.busqueda.set(valor);
  }

  ngOnInit(): void {
    this.cargar();
    this.categoriaService.listar().subscribe((data) => this.categorias.set(data));
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
