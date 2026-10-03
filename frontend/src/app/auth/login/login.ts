import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  enviando = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required],
  });

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.error.set(null);
    const { nombreUsuario, password } = this.form.getRawValue();

    this.auth.login(nombreUsuario, password).subscribe({
      next: (respuesta) => {
        this.router.navigate([respuesta.usuario.rol === 'ADMIN' ? '/admin' : '/pos']);
      },
      error: () => {
        this.error.set('Usuario o contraseña incorrectos.');
        this.enviando.set(false);
      },
    });
  }
}
