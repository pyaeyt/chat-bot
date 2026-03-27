"use client"

import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import React, { useState } from "react"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function LoginSection() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      console.log("LOGIN RESPONSE:", data) // 🔍 debug

      // ✅ Store token + user
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      // ✅ Role-based redirect
      if (data.user.role === "professor") {
        router.push("/dashboard/professor")
      } else {
        router.push("/dashboard/chat")
      }

    } catch (err) {
      alert(err.message || "Login failed")
    }
  }

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 
                        bg-neutral-50 dark:bg-neutral-950">

      {/* App Title */}
      <h1 className="mb-8 text-2xl font-semibold text-neutral-900 tracking-tight
                     dark:text-white">
        AI Smart Assist
      </h1>

      {/* Card */}
      <div className="w-full max-w-sm border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm
                      dark:border-neutral-800 dark:bg-neutral-900">

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Sign in
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Enter your credentials to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none 
                         focus:border-black transition
                         dark:border-neutral-700 dark:bg-neutral-800 dark:text-white 
                         dark:focus:border-white"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-neutral-300 bg-white px-3 py-2 pr-10 text-sm outline-none 
                           focus:border-black transition
                           dark:border-neutral-700 dark:bg-neutral-800 dark:text-white 
                           dark:focus:border-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-neutral-500 hover:text-neutral-800 
                           dark:hover:text-white transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Link
              href="/forgetpassword"
              className="text-sm text-right text-neutral-800 hover:text-neutral-950 dark:text-neutral-300"
            >
              Forget Password?
            </Link>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="mt-1 bg-black text-white py-2.5 text-sm font-medium 
                       transition hover:bg-neutral-800 active:scale-[0.98]
                       dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Sign in
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-sm text-neutral-500 text-center dark:text-neutral-400">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-black hover:underline dark:text-white"
          >
            Sign up
          </Link>
        </p>
      </div>
    </section>
  )
}