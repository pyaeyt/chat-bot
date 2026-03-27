"use client"

import React, { useState } from "react"
import Link from "next/link"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")

  const handleReset = (e) => {
    e.preventDefault()
    console.log("Send reset link to:", email)
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
            Forgot password
          </h2>
          <p className="mt-1 text-xs lg:text-sm text-neutral-500 dark:text-neutral-400">
            We'll email a reset link when SMTP is configured on the server.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleReset} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-neutral-700 dark:text-neutral-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none 
                         focus:border-black transition
                         dark:border-neutral-700 dark:bg-neutral-800 dark:text-white 
                         dark:focus:border-white"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={!email}
            className="mt-1 bg-black text-white py-2.5 text-sm font-medium 
                       transition hover:bg-neutral-800 active:scale-[0.98]
                       disabled:bg-neutral-300 disabled:text-neutral-500
                       dark:bg-white dark:text-black dark:hover:bg-neutral-200
                       dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
          >
            Send reset
          </button>
        </form>

        {/* Back */}
        <div className="mt-6 text-sm text-center">
          <Link
            href="/login"
            className="text-neutral-700 hover:text-black 
                       dark:text-neutral-300 dark:hover:text-white transition"
          >
            Back to log in
          </Link>
        </div>
      </div>
    </section>
  )
}