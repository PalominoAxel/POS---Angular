import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CajaSesion, ResumenCaja } from '../models/caja.model';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/caja`;

  actual(): Observable<CajaSesion | null> {
    return this.http.get<CajaSesion | null>(`${this.baseUrl}/actual`);
  }

  resumenActual(): Observable<ResumenCaja> {
    return this.http.get<ResumenCaja>(`${this.baseUrl}/actual/resumen`);
  }

  historial(): Observable<CajaSesion[]> {
    return this.http.get<CajaSesion[]>(`${this.baseUrl}/historial`);
  }

  abrir(montoApertura: number): Observable<CajaSesion> {
    return this.http.post<CajaSesion>(`${this.baseUrl}/abrir`, { montoApertura });
  }

  cerrar(montoCierreDeclarado: number): Observable<ResumenCaja> {
    return this.http.post<ResumenCaja>(`${this.baseUrl}/cerrar`, { montoCierreDeclarado });
  }
}
