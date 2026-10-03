import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto.model';

export interface ResumenDia {
  ventasDelDia: number;
  ticketPromedio: number;
  igvRecaudadoDia: number;
  numeroVentas: number;
  alertasStockBajo: number;
}

export interface TopProducto {
  productoId: number;
  nombre: string;
  unidadesVendidas: number;
}

export interface VentaPorCategoria {
  categoria: string;
  totalIngresos: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  resumenDia(): Observable<ResumenDia> {
    return this.http.get<ResumenDia>(`${this.baseUrl}/resumen-dia`);
  }

  topProductos(limite = 5): Observable<TopProducto[]> {
    return this.http.get<TopProducto[]>(`${this.baseUrl}/top-productos?limite=${limite}`);
  }

  ventasPorCategoria(): Observable<VentaPorCategoria[]> {
    return this.http.get<VentaPorCategoria[]>(`${this.baseUrl}/ventas-por-categoria`);
  }

  stockBajo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/stock-bajo`);
  }
}
