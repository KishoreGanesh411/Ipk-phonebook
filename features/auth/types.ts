export interface AuthUser {
  email: string;
  name: string;
  phone?: string;
  gender?: string;
  department?: string;
  uid?: string;
  token?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}
