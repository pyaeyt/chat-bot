"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

export default function ProfessorThreadViewSection({ threadId, onBack }) {
  const [thread, setThread] = useState(null)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const loadThread = async () => {
      try {
        const data = await apiFetch(`/api/inbox/${threadId}`)
        setThread(data)
      } catch (err) {
        console.error(err)
      }
    }

    if (threadId) loadThread()
  }, [threadId])

  const sendReply = async () => {
    if (!reply.trim()) return

    setSending(true)

    try {
      await apiFetch(`/api/inbox/${threadId}/reply`, {
        method: "POST",
        body: JSON.stringify({ body: reply }),
      })

      setReply("")
      const updated = await apiFetch(`/api/inbox/${threadId}`)
      setThread(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  if (!thread) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        Loading chat...
      </div>
    )
  }

  return (
    <section className="flex flex-col h-dvh max-h-screen bg-white dark:bg-neutral-900">

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-blue-500 hover:underline"
        >
          ← Back
        </button>

        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            {thread.subject}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {thread.studentName}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
        {thread.messages?.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-xl text-sm ${
              m.fromRole === "professor"
                ? "ml-auto bg-black text-white dark:bg-white dark:text-black"
                : "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            <div className="text-[10px] opacity-60 mb-1">
              {m.fromRole === "professor" ? "You" : "Student"}
            </div>
            {m.body}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-neutral-800 p-3 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type reply..."
          className="flex-1 text-sm border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={sendReply}
          disabled={sending}
          className="px-4 py-2 text-sm rounded-lg bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </div>
    </section>
  )
}