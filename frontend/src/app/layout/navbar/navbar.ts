import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  cerrarSesion(): void {
    if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
