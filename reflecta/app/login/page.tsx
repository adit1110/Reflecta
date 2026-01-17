"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      if (!supabase) {
        if (isMounted) {
          setErrorMessage("App misconfigured. Missing Supabase keys.");
        }
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      }
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!supabase) {
      setErrorMessage("App misconfigured. Missing Supabase keys.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message || "Invalid email or password.");
        return;
      }
      router.replace("/");
    } catch {
      setErrorMessage("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE8D6]">
      <div className="w-full max-w-md bg-[#FFF5EC] rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-light text-[#CB997E] mb-6 text-center tracking-tight">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#CB997E] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#CB997E]/40 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#CB997E] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#CB997E]/40 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all duration-300 hover:shadow-lg"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
          {errorMessage ? (
            <p className="text-sm text-[#CB997E]">{errorMessage}</p>
          ) : null}
        </form>

        <p className="text-center text-sm text-[#CB997E] mt-6">
          Forgot your password?
          <span className="text-[#FF9F1C] cursor-pointer ml-1 hover:underline">
            Reset
          </span>
        </p>

        <p className="text-center text-sm text-[#CB997E] mt-3">
          <Link href="/" className="text-[#FF9F1C] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
