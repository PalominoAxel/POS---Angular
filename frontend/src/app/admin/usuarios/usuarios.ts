import { Component, OnInit, inject, signal } from '@angular/core';
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
  mostrarForm = signal(false);
  enviando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4)]],
    nombre: ['', Validators.required],
    rol: ['CAJERO' as 'ADMIN' | 'CAJERO', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.usuarioService.listar().subscribe((data) => this.usuarios.set(data));
  }

  crear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);

    this.usuarioService.crear(this.form.getRawValue()).subscribe({
      next: () => {
        this.form.reset({ rol: 'CAJERO', nombreUsuario: '', password: '', nombre: '' });
        this.mostrarForm.set(false);
        this.enviando.set(false);
        this.cargar();
      },
      error: (err) => {
        this.error.set(err.error?.mensaje ?? 'No se pudo crear el usuario.');
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
}
