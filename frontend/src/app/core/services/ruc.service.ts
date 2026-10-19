import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DatosRuc {
  ruc: string;
  razonSocial: string;
  estado: string | null;
  condicion: string | null;
  direccion: string | null;
}

@Injectable({ providedIn: 'root' })
export class RucService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ruc`;

  consultar(numero: string): Observable<DatosRuc> {
    return this.http.get<DatosRuc>(`${this.baseUrl}/${numero}`);
  }
}
