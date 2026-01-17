"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
              className="w-full px-4 py-3 rounded-lg border border-[#CB997E]/40 bg-white text-[#CB997E] placeholder:text-[#CB997E]/50 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#CB997E] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border border-[#CB997E]/40 bg-white text-[#CB997E] placeholder:text-[#CB997E]/50 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#CB997E]/60 hover:text-[#CB997E] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
          {errorMessage ? (
            <p className="text-sm text-red-500 text-center">{errorMessage}</p>
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