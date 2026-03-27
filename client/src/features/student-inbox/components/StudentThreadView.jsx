"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { apiFetch } from "@/lib/api"

export default function StudentThreadView({ thread, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef()

  const loadMessages = useCallback(async () => {
    if (!thread?.id) return

    try {
      const data = await apiFetch(`/api/inbox/${thread.id}`)
      setMessages(data?.messages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [thread])

  useEffect(() => {
    if (!thread) return

    loadMessages()
    const interval = setInterval(loadMessages, 4000)
    return () => clearInterval(interval)
  }, [thread, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const newMsg = {
      body: input,
      fromRole: "student",
    }

    setMessages((prev) => [...prev, newMsg])
    setInput("")

    try {
      await apiFetch(`/api/chat/send`, {
        method: "POST",
        body: JSON.stringify({
          threadId: thread.id,
          message: input,
        }),
      })

      loadMessages()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col h-full 
      bg-white dark:bg-neutral-900">

      {/* Header */}
      <div className="p-2.5 border-b 
        border-neutral-200 dark:border-neutral-800 
        flex items-center gap-3">

        <button
          onClick={onBack}
          className="md:hidden text-neutral-500 dark:text-neutral-400"
        >
          ←
        </button>

        <div className="w-10 h-10 rounded-full 
          bg-neutral-200 dark:bg-neutral-700 
          flex items-center justify-center 
          text-neutral-700 dark:text-white">
          {thread.professorName?.[0] || "P"}
        </div>

        <h2 className="font-semibold 
          text-neutral-900 dark:text-white">
          {thread.professorName || "Professor"}
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            Loading...
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.fromRole === "student"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm ${
                  msg.fromRole === "student"
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800  text-neutral-900 dark:text-neutral-200"
                }`}
              >
                {msg.body}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {/* <div className="p-3 border-t 
        border-neutral-200 dark:border-neutral-800 
        flex gap-2">

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message..."
          className="flex-1 px-4 py-2 rounded-full outline-none
            bg-neutral-100 dark:bg-neutral-800
            text-neutral-900 dark:text-white"
        />

        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 
          px-4 py-2 rounded-full text-white transition"
        >
          Send
        </button>
      </div> */}
    </div>
  )
}