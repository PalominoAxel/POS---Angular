import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Venta, VentaInput } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ventas`;

  listar(fechaInicio?: string, fechaFin?: string): Observable<Venta[]> {
    const params: Record<string, string> = {};
    if (fechaInicio) params['fechaInicio'] = fechaInicio;
    if (fechaFin) params['fechaFin'] = fechaFin;
    return this.http.get<Venta[]>(this.baseUrl, { params });
  }

  obtener(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.baseUrl}/${id}`);
  }

  registrar(venta: VentaInput): Observable<Venta> {
    return this.http.post<Venta>(this.baseUrl, venta);
  }
}
