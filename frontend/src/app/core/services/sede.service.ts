import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sede, SedeInput } from '../models/sede.model';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sede`;

  obtener(): Observable<Sede> {
    return this.http.get<Sede>(this.baseUrl);
  }

  actualizar(input: SedeInput): Observable<Sede> {
    return this.http.put<Sede>(this.baseUrl, input);
  }
}
