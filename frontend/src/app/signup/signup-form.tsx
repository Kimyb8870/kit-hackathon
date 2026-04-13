"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/learner";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // Confirm email is OFF in Supabase, so the user is logged in
      // immediately after signup. Refresh to let the proxy pick up the
      // new session cookie, then hard-navigate to the target page.
      router.refresh();
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-clover-50/40 via-white to-white px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-clover-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-clover-400 to-clover-600 text-white shadow-sm">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-clover-900">
            🍀 Clover 가입하기
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            교육의 행운을 모두에게. 지금 시작하세요.
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
              비밀번호 <span className="text-gray-400">(최소 6자)</span>
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-clover-100 bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-clover-400 focus:ring-2 focus:ring-clover-100 disabled:bg-gray-50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-xs font-semibold text-clover-800"
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? "가입 중..." : "가입하기"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link
            href={`/login${redirectTo !== "/learner" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-clover-700 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
