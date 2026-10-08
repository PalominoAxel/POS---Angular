import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly items = [
    { path: 'resumen', icon: '📊', label: 'Resumen' },
    { path: 'inventario', icon: '📦', label: 'Inventario' },
    { path: 'ventas', icon: '🧾', label: 'Ventas' },
    { path: 'caja', icon: '💰', label: 'Caja' },
    { path: 'cupones', icon: '🎟️', label: 'Cupones' },
    { path: 'usuarios', icon: '👥', label: 'Usuarios' },
  ];
}
