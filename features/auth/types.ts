export type Gender = "Male" | "Female" | "Non-binary" | "Prefer not to say";

export type AuthUser = {
  email: string;
  name: string;
  phone: string;
  gender: Gender;
  department: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};
