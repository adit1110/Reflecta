"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login clicked");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFE8D6]">
      <div className="w-full max-w-md bg-[#FFF5EC] rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-[#CB997E] mb-6 text-center">
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
              className="w-full px-4 py-3 rounded-lg border border-[#CB997E] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#CB997E] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-lg border border-[#CB997E] bg-white focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[#FF9F1C] text-white font-medium hover:bg-[#FFBF69] transition"
          >
            Log in
          </button>
        </form>

        <p className="text-center text-sm text-[#CB997E] mt-4">
          Forgot your password?
          <span className="text-[#FFBF69] cursor-pointer ml-1">
            Reset
          </span>
        </p>

        <p className="text-center text-sm text-[#CB997E] mt-2">
          <Link href="/" className="text-[#FFBF69] hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
