"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../lib/supabase-browser";
import error from "next/error";

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

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    if (!supabase) {
      setErrorMessage("App misconfigured. Missing Supabase keys.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      setErrorMessage(error.message || "Failed to sign in with Google.");
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
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          <div className="mt-4">
              <button
  type="button"
  onClick={handleGoogleSignIn}
  className="w-full py-3 rounded-lg border border-[#CB997E]/40 bg-white text-[#CB997E] font-medium hover:bg-[#FFF5EC] transition-all duration-300 flex items-center justify-center gap-3"
>
  <svg
    width="20"
    height="20"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.2 0 5.3 1.4 6.5 2.5l4.8-4.8C32.4 4.4 28.6 2.5 24 2.5 14.9 2.5 7.3 8.6 4.6 16.9l5.9 4.6C12 14.8 17.5 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.5 24.5c0-1.5-.1-2.6-.3-3.8H24v7.2h12.9c-.6 3-2.4 5.5-5.1 7.2l5.8 4.5c3.4-3.1 5.9-7.6 5.9-15.1z"
    />
    <path
      fill="#FBBC05"
      d="M10.5 28.5c-.6-1.5-1-3.1-1-4.7s.4-3.2 1-4.7l-5.9-4.6C3.1 17.6 2.5 21 2.5 24.5s.6 6.9 2.1 9.9l5.9-4.6z"
    />
    <path
      fill="#34A853"
      d="M24 46.5c4.6 0 8.4-1.5 11.2-4.1l-5.8-4.5c-1.6 1.1-3.7 1.8-5.4 1.8-6.5 0-12-5.3-13.5-12.4l-5.9 4.6C7.3 40.4 14.9 46.5 24 46.5z"
    />
  </svg>

  <span>Continue with Google</span>
</button>

            </div>

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