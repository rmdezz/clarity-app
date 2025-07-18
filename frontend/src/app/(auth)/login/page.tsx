import { LoginForm } from '@/features/auth/ui/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-background rounded-2xl shadow-lg">
        <h1 className="text-center text-heading-1 text-neutral-900">
          Iniciar Sesión
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}