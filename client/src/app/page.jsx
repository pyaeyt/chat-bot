'use client'
import { GraduationCap, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-8 shadow-sm">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            AI Smart Assist
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Select a role to continue
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-3 w-full border border-neutral-300 bg-black text-white py-3 text-sm font-medium 
                       transition hover:bg-neutral-800"
          >
           <User />  Student
          </button>

          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-3 w-full border border-neutral-300 bg-white text-black py-3 text-sm font-medium 
                       transition hover:bg-neutral-100"
          >
            <GraduationCap /> Professor
          </button>
        </div>

      </div>
    </div>
  )
}