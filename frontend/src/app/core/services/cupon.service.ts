import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cupon } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class CuponService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cupones`;

  validar(codigo: string): Observable<Cupon> {
    return this.http.get<Cupon>(`${this.baseUrl}/${codigo}`);
  }

  listar(): Observable<Cupon[]> {
    return this.http.get<Cupon[]>(this.baseUrl);
  }
}
