import { Component, OnInit, inject, signal } from '@angular/core';
import { CuponService } from '../../core/services/cupon.service';
import { Cupon } from '../../core/models/venta.model';
import { PrecioSolesPipe } from '../../shared/pipes/precio-soles.pipe';

@Component({
  selector: 'app-cupones',
  imports: [PrecioSolesPipe],
  templateUrl: './cupones.html',
})
export class Cupones implements OnInit {
  private readonly cuponService = inject(CuponService);

  cupones = signal<Cupon[]>([]);
  cargando = signal(true);

  ngOnInit(): void {
    this.cuponService.listar().subscribe({
      next: (data) => {
        this.cupones.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
