import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRespuesta, Rol, Usuario } from '../models/usuario.model';

const CLAVE_TOKEN = 'tambo_pos_token';
const CLAVE_USUARIO = 'tambo_pos_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());
  readonly estaAutenticado = computed(() => this.usuarioActual() !== null);
  readonly esAdmin = computed(() => this.usuarioActual()?.rol === 'ADMIN');

  private leerUsuarioGuardado(): Usuario | null {
    try {
      const data = localStorage.getItem(CLAVE_USUARIO);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  login(nombreUsuario: string, password: string): Observable<LoginRespuesta> {
    return this.http.post<LoginRespuesta>(`${this.baseUrl}/login`, { nombreUsuario, password }).pipe(
      tap((respuesta) => {
        localStorage.setItem(CLAVE_TOKEN, respuesta.token);
        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
        this.usuarioActual.set(respuesta.usuario);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioActual.set(null);
  }

  tieneRol(...roles: Rol[]): boolean {
    const rol = this.usuarioActual()?.rol;
    return !!rol && roles.includes(rol);
  }
}
