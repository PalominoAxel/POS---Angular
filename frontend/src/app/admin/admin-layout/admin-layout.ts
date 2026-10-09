import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly items = [
    { path: 'resumen', icon: 'bi-grid-1x2-fill', label: 'Resumen' },
    { path: 'inventario', icon: 'bi-box-seam-fill', label: 'Inventario' },
    { path: 'categorias', icon: 'bi-tags-fill', label: 'Categorías' },
    { path: 'ventas', icon: 'bi-receipt', label: 'Ventas' },
    { path: 'caja', icon: 'bi-cash-coin', label: 'Caja' },
    { path: 'cupones', icon: 'bi-ticket-perforated-fill', label: 'Cupones' },
    { path: 'usuarios', icon: 'bi-people-fill', label: 'Usuarios' },
  ];

  readonly usuario = this.auth.usuarioActual;

  readonly iniciales = computed(() => {
    const nombre = this.usuario()?.nombre ?? '';
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  cerrarSesion(): void {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
