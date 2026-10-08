import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Producto } from '../../../core/models/producto.model';
import { Categoria } from '../../../core/models/categoria.model';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { CapitalizarPipe } from '../../../shared/pipes/capitalizar.pipe';
import { PrecioSolesPipe } from '../../../shared/pipes/precio-soles.pipe';

const PRODUCTOS_POR_PAGINA = 8;
const NUEVA_CATEGORIA_VALOR = '__nueva__';

export type EstadoStock = 'ALTO' | 'CRITICO' | 'AGOTADO';

@Component({
  selector: 'app-inventario-list',
  imports: [FormsModule, ReactiveFormsModule, CapitalizarPipe, PrecioSolesPipe],
  templateUrl: './inventario-list.html',
})
export class InventarioList implements OnInit {
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly fb = inject(FormBuilder);

  readonly nuevaCategoriaValor = NUEVA_CATEGORIA_VALOR;
  categorias = signal<Categoria[]>([]);
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

  mostrarNuevaCategoria = signal(false);
  nuevaCategoriaNombre = signal('');
  guardandoCategoria = signal(false);
  errorNuevaCategoria = signal<string | null>(null);

  imagenPreview = signal('');
  subiendoImagen = signal(false);
  errorImagen = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['', Validators.required],
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
    this.cargarCategorias();
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

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe((data) => this.categorias.set(data));
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
    this.errorImagen.set(null);
    this.imagenPreview.set('');
    this.form.reset({
      nombre: '',
      categoria: this.categorias()[0]?.nombre ?? '',
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
    this.errorImagen.set(null);
    this.imagenPreview.set(producto.imagenUrl);
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
    this.errorImagen.set(null);
    this.cancelarNuevaCategoria();
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    this.errorImagen.set(null);

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
      this.errorImagen.set('Formato no soportado. Usa JPG, PNG o WEBP.');
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      this.errorImagen.set('La imagen no puede superar los 5 MB.');
      return;
    }

    this.subiendoImagen.set(true);
    this.productoService.subirImagen(archivo).subscribe({
      next: ({ imagenUrl }) => {
        this.form.controls.imagenUrl.setValue(imagenUrl);
        this.form.controls.imagenUrl.markAsTouched();
        this.imagenPreview.set(imagenUrl);
        this.subiendoImagen.set(false);
      },
      error: (err) => {
        this.errorImagen.set(err.error?.mensaje ?? 'No se pudo subir la imagen.');
        this.subiendoImagen.set(false);
      },
    });
  }

  onCategoriaChange(valor: string): void {
    if (valor === this.nuevaCategoriaValor) {
      this.mostrarNuevaCategoria.set(true);
      this.nuevaCategoriaNombre.set('');
      this.errorNuevaCategoria.set(null);
      return;
    }
    this.form.controls.categoria.setValue(valor);
  }

  cancelarNuevaCategoria(): void {
    this.mostrarNuevaCategoria.set(false);
    this.nuevaCategoriaNombre.set('');
    this.errorNuevaCategoria.set(null);
    this.guardandoCategoria.set(false);
  }

  confirmarNuevaCategoria(): void {
    const nombre = this.nuevaCategoriaNombre().trim();
    if (!nombre) {
      this.errorNuevaCategoria.set('Escribe un nombre para la categoría.');
      return;
    }

    this.guardandoCategoria.set(true);
    this.errorNuevaCategoria.set(null);
    this.categoriaService.crear(nombre).subscribe({
      next: (categoria) => {
        this.categorias.update((lista) => [...lista, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.form.controls.categoria.setValue(categoria.nombre);
        this.cancelarNuevaCategoria();
      },
      error: (err) => {
        this.errorNuevaCategoria.set(err.error?.mensaje ?? 'No se pudo crear la categoría.');
        this.guardandoCategoria.set(false);
      },
    });
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
