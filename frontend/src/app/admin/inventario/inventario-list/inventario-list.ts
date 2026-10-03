import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIAS, Producto } from '../../../core/models/producto.model';
import { ProductoService } from '../../../core/services/producto.service';
import { CapitalizarPipe } from '../../../shared/pipes/capitalizar.pipe';
import { PrecioSolesPipe } from '../../../shared/pipes/precio-soles.pipe';

const PRODUCTOS_POR_PAGINA = 8;

@Component({
  selector: 'app-inventario-list',
  imports: [FormsModule, RouterLink, CapitalizarPipe, PrecioSolesPipe],
  templateUrl: './inventario-list.html',
})
export class InventarioList implements OnInit {
  private readonly productoService = inject(ProductoService);

  readonly categorias = CATEGORIAS;
  productos = signal<Producto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = signal('');
  categoriaFiltro = signal('TODAS');
  paginaActual = signal(1);

  productosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoria = this.categoriaFiltro();
    return this.productos().filter((p) => {
      const coincideTexto = !texto || p.nombre.toLowerCase().includes(texto);
      const coincideCategoria = categoria === 'TODAS' || p.categoria === categoria;
      return coincideTexto && coincideCategoria;
    });
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.productosFiltrados().length / PRODUCTOS_POR_PAGINA)));
  paginasDisponibles = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i + 1));

  productosPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * PRODUCTOS_POR_PAGINA;
    return this.productosFiltrados().slice(inicio, inicio + PRODUCTOS_POR_PAGINA);
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
      error: () => {
        this.error.set('No se pudo conectar con la API.');
        this.cargando.set(false);
      },
    });
  }

  irAPagina(pagina: number): void {
    this.paginaActual.set(Math.min(Math.max(1, pagina), this.totalPaginas()));
  }

  agregarStock(producto: Producto): void {
    this.productoService.actualizar(producto.id, { stock: producto.stock + 10 }).subscribe(() => this.cargar());
  }

  eliminar(producto: Producto): void {
    if (!confirm(`¿Eliminar "${producto.nombre}" del inventario? Esta acción no se puede deshacer.`)) return;
    this.productoService.eliminar(producto.id).subscribe(() => this.cargar());
  }
}
