import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, UsuarioInput } from '../models/usuario.model';

export interface UsuarioEdicion {
  nombre?: string;
  password?: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.baseUrl);
  }

  crear(usuario: UsuarioInput & { token?: string }): Observable<Usuario> {
    return this.http.post<Usuario>(this.baseUrl, usuario);
  }

  cambiarEstado(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}/estado`, { activo });
  }

  editar(id: number, cambios: UsuarioEdicion): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/${id}`, cambios);
  }

  eliminar(id: number, token: string): Observable<void> {
    return this.http.request<void>('DELETE', `${this.baseUrl}/${id}`, { body: { token } });
  }
}
