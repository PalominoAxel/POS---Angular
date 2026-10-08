import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS, Producto } from '../../../core/models/producto.model';
import { ProductoService } from '../../../core/services/producto.service';
import { CapitalizarPipe } from '../../../shared/pipes/capitalizar.pipe';
import { PrecioSolesPipe } from '../../../shared/pipes/precio-soles.pipe';

const PRODUCTOS_POR_PAGINA = 8;

export type EstadoStock = 'ALTO' | 'CRITICO' | 'AGOTADO';

@Component({
  selector: 'app-inventario-list',
  imports: [FormsModule, ReactiveFormsModule, CapitalizarPipe, PrecioSolesPipe],
  templateUrl: './inventario-list.html',
})
export class InventarioList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly fb = inject(FormBuilder);

  readonly categorias = CATEGORIAS;
  productos = signal<Producto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = signal('');
  categoriaFiltro = signal('TODAS');
  paginaActual = signal(1);

  mostrarModal = signal(false);
  productoEditandoId = signal<number | null>(null);
  guardando = signal(false);
  errorModal = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: [CATEGORIAS[0] as string, Validators.required],
    precioRegular: [0, [Validators.required, Validators.min(0.01)]],
    precioOferta: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    imagenUrl: ['', Validators.required],
    esPrime: [false],
  });

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

  estadoStock(producto: Producto): EstadoStock {
    if (producto.stock === 0) return 'AGOTADO';
    if (producto.stock < 15) return 'CRITICO';
    return 'ALTO';
  }

  agregarStock(producto: Producto): void {
    this.productoService.actualizar(producto.id, { stock: producto.stock + 10 }).subscribe(() => this.cargar());
  }

  eliminar(producto: Producto): void {
    if (!confirm(`¿Eliminar "${producto.nombre}" del inventario? Esta acción no se puede deshacer.`)) return;
    this.productoService.eliminar(producto.id).subscribe(() => this.cargar());
  }

  abrirNuevo(): void {
    this.productoEditandoId.set(null);
    this.errorModal.set(null);
    this.form.reset({
      nombre: '',
      categoria: CATEGORIAS[0],
      precioRegular: 0,
      precioOferta: 0,
      stock: 0,
      imagenUrl: '',
      esPrime: false,
    });
    this.mostrarModal.set(true);
  }

  abrirEditar(producto: Producto): void {
    this.productoEditandoId.set(producto.id);
    this.errorModal.set(null);
    this.form.reset({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precioRegular: producto.precioRegular,
      precioOferta: producto.precioOferta,
      stock: producto.stock,
      imagenUrl: producto.imagenUrl,
      esPrime: producto.esPrime,
    });
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.guardando.set(false);
    this.errorModal.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.value.precioOferta! > this.form.value.precioRegular!) {
      this.errorModal.set('El precio de oferta no puede ser mayor al precio regular.');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);
    const valores = this.form.getRawValue();
    const id = this.productoEditandoId();

    const peticion = id ? this.productoService.actualizar(id, valores) : this.productoService.crear(valores);

    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
      },
      error: (err) => {
        this.errorModal.set(err.error?.mensaje ?? 'No se pudo guardar el producto.');
        this.guardando.set(false);
      },
    });
  }
}
