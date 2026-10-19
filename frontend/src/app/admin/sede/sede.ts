import { Component, OnInit, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { SedeService } from '../../core/services/sede.service';

// Centro por defecto: Lima, Perú (se usa solo si la sede aún no tiene coordenadas guardadas).
const LIMA_LAT = -12.0464;
const LIMA_LNG = -77.0428;

const ICONO_MARCADOR = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

@Component({
  selector: 'app-sede',
  imports: [ReactiveFormsModule],
  templateUrl: './sede.html',
})
export class Sede implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly sedeService = inject(SedeService);
  private readonly http = inject(HttpClient);

  private mapa?: L.Map;
  private marcador?: L.Marker;

  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  guardadoOk = signal(false);
  buscandoDireccion = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombreComercial: ['', Validators.required],
    razonSocial: ['', [Validators.required, Validators.pattern(/^(?!\d+$).+$/)]],
    ruc: ['', Validators.pattern(/^\d{11}$/)],
    direccion: ['', Validators.required],
    distrito: ['', Validators.required],
    numeroTienda: ['001', Validators.required],
    leyendaPie: [''],
    latitud: [LIMA_LAT],
    longitud: [LIMA_LNG],
  });

  readonly controls = this.form.controls;

  ngOnInit(): void {
    this.sedeService.obtener().subscribe({
      next: (sede) => {
        this.form.patchValue({
          ...sede,
          latitud: sede.latitud ?? LIMA_LAT,
          longitud: sede.longitud ?? LIMA_LNG,
        });
        this.cargando.set(false);
        this.centrarMapa();
      },
      error: () => {
        this.error.set('No se pudo cargar la información de la sede.');
        this.cargando.set(false);
      },
    });
  }

  ngAfterViewInit(): void {
    this.mapa = L.map('mapa-sede').setView([LIMA_LAT, LIMA_LNG], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.mapa);

    this.marcador = L.marker([LIMA_LAT, LIMA_LNG], { icon: ICONO_MARCADOR, draggable: true }).addTo(this.mapa);
    this.marcador.on('dragend', () => this.onMarcadorMovido());
    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      this.marcador!.setLatLng(evento.latlng);
      this.onMarcadorMovido();
    });

    this.centrarMapa();
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }

  private centrarMapa(): void {
    if (!this.mapa || !this.marcador) return;
    const lat = this.controls.latitud.value ?? LIMA_LAT;
    const lng = this.controls.longitud.value ?? LIMA_LNG;
    this.mapa.setView([lat, lng], 16);
    this.marcador.setLatLng([lat, lng]);
  }

  private onMarcadorMovido(): void {
    const { lat, lng } = this.marcador!.getLatLng();
    this.form.patchValue({ latitud: lat, longitud: lng });
    this.buscarDireccionPorCoordenadas(lat, lng);
  }

  /** Geocodificación inversa gratuita (Nominatim/OSM) para sugerir la dirección al hacer clic en el mapa. */
  private buscarDireccionPorCoordenadas(lat: number, lng: number): void {
    this.buscandoDireccion.set(true);
    this.http
      .get<{ display_name?: string; address?: Record<string, string> }>('https://nominatim.openstreetmap.org/reverse', {
        params: { format: 'jsonv2', lat: String(lat), lon: String(lng) },
      })
      .subscribe({
        next: (resultado) => {
          const direccion = resultado.display_name;
          if (direccion) this.controls.direccion.setValue(direccion);
          this.buscandoDireccion.set(false);
        },
        error: () => this.buscandoDireccion.set(false),
      });
  }

  guardar(): void {
    this.guardadoOk.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Revisa los campos marcados en rojo.');
      return;
    }
    this.error.set(null);
    this.guardando.set(true);

    this.sedeService.actualizar(this.form.getRawValue()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardadoOk.set(true);
      },
      error: (err) => {
        this.error.set(err.error?.mensaje ?? 'No se pudo guardar la sede.');
        this.guardando.set(false);
      },
    });
  }
}
