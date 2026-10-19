import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Usuario } from '../../core/models/usuario.model';
import { UsuarioService } from '../../core/services/usuario.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly auth = inject(AuthService);

  usuarios = signal<Usuario[]>([]);

  // Sólo cajeros en la lista principal: el administrador se gestiona aparte.
  readonly cajeros = computed(() => this.usuarios().filter((u) => u.rol === 'CAJERO'));
  readonly administradores = computed(() => this.usuarios().filter((u) => u.rol === 'ADMIN'));

  mostrarFormCajero = signal(false);
  mostrarFormAdmin = signal(false);
  enviando = signal(false);
  error = signal<string | null>(null);
  errorAdmin = signal<string | null>(null);

  editando = signal<number | null>(null);
  errorEdicion = signal<string | null>(null);

  formCajero = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    nombre: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  formAdmin = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    nombre: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4)]],
    token: ['', Validators.required],
  });

  formEdicion = this.fb.nonNullable.group({
    nombre: [''],
    password: [''],
    token: ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.usuarioService.listar().subscribe((data) => this.usuarios.set(data));
  }

  crearCajero(): void {
    if (this.formCajero.invalid) {
      this.formCajero.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.usuarioService.crear({ ...this.formCajero.getRawValue(), rol: 'CAJERO' }).subscribe({
      next: () => {
        this.formCajero.reset({ nombreUsuario: '', password: '', nombre: '' });
        this.mostrarFormCajero.set(false);
        this.enviando.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(err.error?.mensaje ?? 'No se pudo crear el cajero.');
        this.enviando.set(false);
      },
    });
  }

  crearAdmin(): void {
    if (this.formAdmin.invalid) {
      this.formAdmin.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.errorAdmin.set(null);

    this.usuarioService.crear({ ...this.formAdmin.getRawValue(), rol: 'ADMIN' }).subscribe({
      next: () => {
        this.formAdmin.reset({ nombreUsuario: '', password: '', nombre: '', token: '' });
        this.mostrarFormAdmin.set(false);
        this.enviando.set(false);
        this.cargar();
      },
      error: (err) => {
        this.errorAdmin.set(err.error?.mensaje ?? 'No se pudo crear el administrador.');
        this.enviando.set(false);
      },
    });
  }

  cambiarEstado(usuario: Usuario): void {
    const vaADesactivar = usuario.activo;

    if (vaADesactivar) {
      const esUnoMismo = usuario.id === this.auth.usuarioActual()?.id;
      let mensaje = `¿Estás seguro de que deseas desactivar al usuario "${usuario.nombreUsuario}"? No podrá iniciar sesión hasta que lo reactives.`;

      if (usuario.rol === 'ADMIN') {
        mensaje =
          `⚠️ "${usuario.nombreUsuario}" es un ADMINISTRADOR. Desactivarlo le quitará todo acceso al sistema.\n\n` +
          mensaje;
      }
      if (esUnoMismo) {
        mensaje = `⚠️ Esta es TU PROPIA cuenta. Si la desactivas, perderás acceso de inmediato.\n\n${mensaje}`;
      }

      if (!confirm(mensaje)) return;
    } else {
      if (!confirm(`¿Reactivar al usuario "${usuario.nombreUsuario}"?`)) return;
    }

    this.usuarioService.cambiarEstado(usuario.id, !usuario.activo).subscribe(() => this.cargar());
  }

  iniciarEdicion(usuario: Usuario): void {
    this.editando.set(usuario.id);
    this.errorEdicion.set(null);
    this.formEdicion.reset({ nombre: usuario.nombre, password: '', token: '' });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.errorEdicion.set(null);
  }

  guardarEdicion(usuario: Usuario): void {
    if (this.formEdicion.invalid) {
      this.formEdicion.markAllAsTouched();
      return;
    }
    const { nombre, password, token } = this.formEdicion.getRawValue();
    if (!nombre.trim() && !password.trim()) {
      this.errorEdicion.set('Indica un nuevo nombre o una nueva contraseña.');
      return;
    }

    this.errorEdicion.set(null);
    this.usuarioService
      .editar(usuario.id, {
        nombre: nombre.trim() || undefined,
        password: password.trim() || undefined,
        token,
      })
      .subscribe({
        next: () => {
          this.editando.set(null);
          this.cargar();
        },
        error: (err) => this.errorEdicion.set(err.error?.mensaje ?? 'No se pudo guardar. Revisa el token.'),
      });
  }

  eliminar(usuario: Usuario): void {
    const esUnoMismo = usuario.id === this.auth.usuarioActual()?.id;
    if (esUnoMismo) {
      alert('No puedes eliminar tu propia cuenta.');
      return;
    }
    if (!confirm(`¿Eliminar por completo a "${usuario.nombreUsuario}" (${usuario.nombre})? Esta acción no se puede deshacer.`)) {
      return;
    }
    const token = prompt('Ingresa el token de administrador para confirmar la eliminación:');
    if (!token) return;

    this.usuarioService.eliminar(usuario.id, token).subscribe({
      next: () => this.cargar(),
      error: (err) => alert(err.error?.mensaje ?? 'No se pudo eliminar al usuario.'),
    });
  }
}
