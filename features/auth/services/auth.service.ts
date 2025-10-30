import { AuthUser, SignInPayload } from "@/features/auth/types";

const DEMO_CREDENTIALS = {
  email: "ipktest@ipkwealth.com",
  password: "Ipk@2025"
} as const;

export async function signInMock({ email, password }: SignInPayload): Promise<AuthUser> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Please provide an email address.");
  }

  if (normalizedEmail !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
    throw new Error("Invalid email or password. Use the demo credentials provided.");
  }

  return {
    email: DEMO_CREDENTIALS.email,
    name: "IPK Wealth Advisor",
    phone: "+91 98765 55667",
    gender: "Female",
    department: "Wealth Advisory"
  };
}
