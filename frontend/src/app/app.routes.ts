import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pos' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'pos',
    canActivate: [authGuard],
    loadComponent: () => import('./pos/pos-page/pos-page').then((m) => m.PosPage),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      { path: 'resumen', loadComponent: () => import('./admin/resumen/resumen').then((m) => m.Resumen) },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./admin/inventario/inventario-list/inventario-list').then((m) => m.InventarioList),
      },
      {
        path: 'inventario/nuevo',
        loadComponent: () =>
          import('./admin/inventario/inventario-form/inventario-form').then((m) => m.InventarioForm),
      },
      {
        path: 'inventario/:id/editar',
        loadComponent: () =>
          import('./admin/inventario/inventario-form/inventario-form').then((m) => m.InventarioForm),
      },
      { path: 'ventas', loadComponent: () => import('./admin/ventas/ventas').then((m) => m.Ventas) },
      { path: 'caja', loadComponent: () => import('./admin/caja/caja').then((m) => m.Caja) },
      { path: 'cupones', loadComponent: () => import('./admin/cupones/cupones').then((m) => m.Cupones) },
      { path: 'usuarios', loadComponent: () => import('./admin/usuarios/usuarios').then((m) => m.Usuarios) },
    ],
  },
  { path: '**', redirectTo: 'pos' },
];
