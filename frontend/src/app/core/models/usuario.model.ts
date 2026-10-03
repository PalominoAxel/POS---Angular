export type Rol = 'ADMIN' | 'CAJERO';

export interface Usuario {
  id: number;
  nombreUsuario: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  createdAt: string;
}

export interface UsuarioInput {
  nombreUsuario: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export interface LoginRespuesta {
  token: string;
  usuario: Usuario;
}
