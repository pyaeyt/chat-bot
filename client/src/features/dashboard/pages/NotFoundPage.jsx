"use client"

import Link from "next/link"
import { Home } from "lucide-react"

const NotFoundPage = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const target = token ? "/dashboard" : "/login"

  return (
    <section className="min-h-screen flex items-center justify-center 
                        bg-neutral-50 dark:bg-neutral-950 px-4">

      <div className="w-full max-w-md text-center space-y-6">

        <h1 className="text-7xl sm:text-8xl font-extrabold tracking-tight 
                       text-neutral-900 dark:text-white">
          404
        </h1>

        <div>
          <h2 className="text-xl sm:text-2xl font-semibold 
                         text-neutral-800 dark:text-neutral-200">
            Page not found
          </h2>

          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            The page being requested does not exist or has been moved.
          </p>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-800" />

        <div className="flex justify-center">

          <Link
            href={target}
            className="flex items-center gap-2 
                       px-4 py-2 text-sm font-medium 
                       bg-black text-white 
                       dark:bg-white dark:text-black 
                       hover:opacity-90 transition"
          >
            <Home size={16} />
            {token ? "Go to Dashboard" : "Go to Login"}
          </Link>

        </div>

        <p className="text-xs text-neutral-400">
          AI Assist Classroom • Error 404
        </p>

      </div>
    </section>
  )
}

export default NotFoundPage