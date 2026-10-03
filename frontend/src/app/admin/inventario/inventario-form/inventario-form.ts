import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CATEGORIAS } from '../../../core/models/producto.model';
import { ProductoService } from '../../../core/services/producto.service';

@Component({
  selector: 'app-inventario-form',
  imports: [ReactiveFormsModule],
  templateUrl: './inventario-form.html',
})
export class InventarioForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly categorias = CATEGORIAS;
  enviando = signal(false);
  error = signal<string | null>(null);
  productoId = signal<number | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: [CATEGORIAS[0] as string, Validators.required],
    precioRegular: [0, [Validators.required, Validators.min(0.01)]],
    precioOferta: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    esPrime: [false],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    const id = Number(idParam);
    this.productoId.set(id);

    this.productoService.obtener(id).subscribe((producto) => {
      this.form.patchValue({
        nombre: producto.nombre,
        categoria: producto.categoria,
        precioRegular: producto.precioRegular,
        precioOferta: producto.precioOferta,
        stock: producto.stock,
        esPrime: producto.esPrime,
      });
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.value.precioOferta! > this.form.value.precioRegular!) {
      this.error.set('El precio de oferta no puede ser mayor al precio regular.');
      return;
    }

    if (this.productoId() !== null) {
      const nombre = this.form.value.nombre;
      if (!confirm(`¿Guardar los cambios realizados en "${nombre}"? Esto actualizará el producto en el inventario.`)) {
        return;
      }
    }

    this.enviando.set(true);
    this.error.set(null);
    const valores = this.form.getRawValue();
    const id = this.productoId();

    const peticion = id ? this.productoService.actualizar(id, valores) : this.productoService.crear(valores);

    peticion.subscribe({
      next: () => this.router.navigate(['/admin/inventario']),
      error: (err) => {
        this.error.set(err.error?.mensaje ?? 'No se pudo guardar el producto.');
        this.enviando.set(false);
      },
    });
  }
}
