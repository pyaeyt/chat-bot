"use client"

import React, { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"

export default function ResetPasswordSection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  console.log("token",token) // 🔥 important

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
        }),
      })

      alert("Password reset successful!")
      router.push("/login")

    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <section className="flex flex-col items-center justify-center px-4 
                        bg-neutral-50 dark:bg-neutral-950">

      {/* Title */}
      <h1 className="mb-8 text-2xl font-semibold text-neutral-900 tracking-tight
                     dark:text-white">
        Campus Assistant
      </h1>

      {/* Card */}
      <div className="w-full max-w-sm border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm
                      dark:border-neutral-800 dark:bg-neutral-900">

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Reset password
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Enter your new password below.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="flex flex-col gap-4">

          {/* New Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              New password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Confirm password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-300 bg-white px-3 py-2 pr-10 text-sm outline-none 
                           focus:border-black transition
                           dark:border-neutral-700 dark:bg-neutral-800 dark:text-white 
                           dark:focus:border-white"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 
                           text-neutral-500 hover:text-neutral-800 
                           dark:hover:text-white transition"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!password || !confirmPassword}
            className="mt-1 bg-black text-white py-2.5 text-sm font-medium 
                       transition hover:bg-neutral-800 active:scale-[0.98]
                       disabled:bg-neutral-300 disabled:text-neutral-500
                       dark:bg-white dark:text-black dark:hover:bg-neutral-200
                       dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
          >
            Reset password
          </button>
        </form>

        {/* Back */}
        <div className="mt-6 text-sm text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-neutral-700 hover:text-black 
                       dark:text-neutral-300 dark:hover:text-white transition"
          >
            Back to log in
          </button>
        </div>
      </div>
    </section>
  )
}