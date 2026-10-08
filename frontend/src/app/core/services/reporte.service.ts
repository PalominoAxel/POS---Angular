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

export interface EvolucionVenta {
  fecha: string;
  total: number;
}

export interface VentaPorMetodoPago {
  metodo: string;
  total: number;
}

export interface HoraPico {
  hora: number;
  cantidadVentas: number;
}

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reportes`;

  resumenDia(): Observable<ResumenDia> {
    return this.http.get<ResumenDia>(`${this.baseUrl}/resumen-dia`);
  }

  topProductos(limite = 5, dias?: number): Observable<TopProducto[]> {
    const query = dias ? `?limite=${limite}&dias=${dias}` : `?limite=${limite}`;
    return this.http.get<TopProducto[]>(`${this.baseUrl}/top-productos${query}`);
  }

  ventasPorCategoria(dias = 7): Observable<VentaPorCategoria[]> {
    return this.http.get<VentaPorCategoria[]>(`${this.baseUrl}/ventas-por-categoria?dias=${dias}`);
  }

  stockBajo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.baseUrl}/stock-bajo`);
  }

  evolucionVentas(dias = 7): Observable<EvolucionVenta[]> {
    return this.http.get<EvolucionVenta[]>(`${this.baseUrl}/evolucion-ventas?dias=${dias}`);
  }

  ventasPorMetodoPago(dias = 7): Observable<VentaPorMetodoPago[]> {
    return this.http.get<VentaPorMetodoPago[]>(`${this.baseUrl}/ventas-por-metodo-pago?dias=${dias}`);
  }

  horasPico(): Observable<HoraPico[]> {
    return this.http.get<HoraPico[]>(`${this.baseUrl}/horas-pico`);
  }
}
