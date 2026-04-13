import { Suspense } from "react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-clover-200 border-t-clover-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
