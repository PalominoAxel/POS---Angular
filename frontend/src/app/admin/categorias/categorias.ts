import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../core/services/categoria.service';
import { Categoria } from '../../core/models/categoria.model';

@Component({
  selector: 'app-categorias',
  imports: [FormsModule],
  templateUrl: './categorias.html',
})
export class Categorias implements OnInit {
  private readonly categoriaService = inject(CategoriaService);

  categorias = signal<Categoria[]>([]);
  cargando = signal(true);

  nombreNueva = signal('');
  guardando = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  crear(): void {
    const nombre = this.nombreNueva().trim();
    if (!nombre) {
      this.error.set('Escribe un nombre para la categoría.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.categoriaService.crear(nombre).subscribe({
      next: (categoria) => {
        this.categorias.update((lista) => [...lista, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.nombreNueva.set('');
        this.guardando.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje ?? 'No se pudo crear la categoría.');
        this.guardando.set(false);
      },
    });
  }

  eliminar(categoria: Categoria): void {
    if (
      !confirm(
        `¿Desactivar la categoría "${categoria.nombre}"? Los productos que ya la usan no se verán afectados, pero no podrás elegirla para productos nuevos.`,
      )
    ) {
      return;
    }

    this.categoriaService.eliminar(categoria.id).subscribe({
      next: () => this.categorias.update((lista) => lista.filter((c) => c.id !== categoria.id)),
      error: (err) => this.error.set(err.error?.mensaje ?? 'No se pudo desactivar la categoría.'),
    });
  }
}
