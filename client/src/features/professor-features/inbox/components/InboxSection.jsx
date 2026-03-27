"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

export default function InboxSection({ onSelectThread }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const data = await apiFetch("/api/inbox")
        setThreads(data.threads || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadThreads()
  }, [])

  if (loading) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        Loading inbox...
      </div>
    )
  }

  return (
    <section className="w-full max-w-3xl mx-auto ">
      <div className="bg-white dark:bg-neutral-900  rounded-xl shadow-sm">
        
        {/* Header */}
        {/* <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Professor Inbox
          </h2>
        </div> */}

        {/* Empty */}
        {threads.length === 0 && (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
            No messages yet.
          </p>
        )}

        {/* List */}
        <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
          {threads.map((th) => {
            const id = th.id || th.threadId

            return (
              <li key={id}>
                <button
                  onClick={() => onSelectThread(id)}
                  className="w-full text-left px-4 py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                    
                    {/* Subject */}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {th.subject || "No subject"}
                    </span>

                    {/* Message count */}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {th.messageCount || 0} msg
                    </span>
                  </div>

                  {/* Student */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {th.studentName || "Unknown student"}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}