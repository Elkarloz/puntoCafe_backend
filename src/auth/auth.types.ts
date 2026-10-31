export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
}
