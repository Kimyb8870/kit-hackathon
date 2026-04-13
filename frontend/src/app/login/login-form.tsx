"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/learner";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : signInError.message
        );
        setIsLoading(false);
        return;
      }

      router.refresh();
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-clover-50/40 via-white to-white px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-clover-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-clover-400 to-clover-600 text-white shadow-sm">
            <Leaf className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-clover-900">
            🍀 Clover 로그인
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            나만의 AI 튜터가 기다리고 있어요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold text-clover-800"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-clover-100 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-clover-400 focus:ring-2 focus:ring-clover-100 disabled:bg-gray-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold text-clover-800"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-clover-100 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-clover-400 focus:ring-2 focus:ring-clover-100 disabled:bg-gray-50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full bg-clover-500 text-base font-semibold text-white hover:bg-clover-600 disabled:opacity-60"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          아직 계정이 없으신가요?{" "}
          <Link
            href={`/signup${redirectTo !== "/learner" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-clover-700 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
