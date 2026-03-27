"use client"
import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function RegisterSection() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          displayName: name,
          email,
          password,
          inviteCode // optional
        }),
      })

      alert("Account created successfully!")
      router.push("/login")

    } catch (err) {
      alert(err.message)
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
          <h2 className="text-xl font-semibold text-neutral-900 tracking-tight dark:text-white">
            Create account
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Full name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none 
                         focus:border-black transition
                         dark:border-neutral-700 dark:bg-neutral-800 dark:text-white 
                         dark:focus:border-white"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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


          {/* Invite Code */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Professor invite code (optional)
            </label>
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none 
                         focus:border-black transition
                         dark:border-neutral-700 dark:bg-neutral-800 dark:text-white 
                         dark:focus:border-white"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="mt-1 bg-black text-white py-2.5 text-sm font-medium 
                       transition hover:bg-neutral-800 active:scale-[0.98]
                       dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Create account
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-sm text-neutral-500 text-center
                      dark:text-neutral-400">
          Already have an account?{" "}
          <Link href="/login" className="text-black hover:underline dark:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}