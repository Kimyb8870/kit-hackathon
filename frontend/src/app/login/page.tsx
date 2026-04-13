import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-clover-200 border-t-clover-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
