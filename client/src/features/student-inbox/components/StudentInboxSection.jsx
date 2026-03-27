"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

export default function StudentInboxSection({ onSelectThread }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const data = await apiFetch("/api/student/threads")
        setThreads(data?.threads || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [])

  if (loading) {
    return <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <div
          key={thread.id}
          onClick={() => onSelectThread?.(thread)}
          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
          hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full 
            bg-neutral-200 dark:bg-neutral-700 
            flex items-center justify-center 
            text-neutral-700 dark:text-white font-medium">
            {thread.professorName?.[0] || "P"}
          </div>

          {/* Info */}
          <div className="flex-1 overflow-hidden">
            <h3 className="font-medium truncate 
              text-neutral-900 dark:text-white">
              {thread.professorName || "Professor"}
            </h3>

            <p className="text-sm truncate 
              text-neutral-500 dark:text-neutral-400">
              {thread.subject || "Conversation"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}