import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';

export function roleGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      router.navigate(['/login']);
      return false;
    }
    if (!auth.tieneRol(...roles)) {
      router.navigate(['/pos']);
      return false;
    }
    return true;
  };
}
