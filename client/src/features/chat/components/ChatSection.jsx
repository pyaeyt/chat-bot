"use client"

import React, { useState, useRef, useEffect } from "react"
import { Mic, Send } from "lucide-react"
import { useChat } from "../hooks/useChat"
import { useSidebar } from "../../dashboard/hooks/useDashboard"

export default function ChatSection() {
  const { user } = useSidebar()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef(null)

  // Only initialize useChat when user exists
  const { messages, sendMessage, loading, translateMessage } = useChat()

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  if (!user) return <div>Loading...</div>

  const handleSend = async () => {
    if (!input.trim()) return
    if (!user?.id) {
      console.log("user not ready")
      return
    }

    await sendMessage(user?.id, input)
    setInput("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend()
  }

  return (
    <div className="flex flex-col h-[80vh] max-h-[80vh] w-full border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${msg.sender === "user"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-neutral-200 text-black dark:bg-neutral-800 dark:text-white"
                }`}
            >
              <div>
                <p>{msg.text}</p>

                {msg.sender === "bot" && (
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={async () => {
                        const translated = await translateMessage(msg.text, "en")
                        alert("EN: " + translated)
                      }}
                      className="text-xs text-blue-500 hover:underline"
                    >
                      EN
                    </button>

                    <button
                      onClick={async () => {
                        const translated = await translateMessage(msg.text, "th")
                        alert("TH: " + translated)
                      }}
                      className="text-xs text-green-500 hover:underline"
                    >
                      TH
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex border-t border-neutral-200 dark:border-neutral-800 p-2 items-center">

        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm outline-none focus:border-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Voice Button */}
        <button
          // onClick={handleRecord}
          className={`ml-2 p-2 rounded-md transition 
               "bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white hover:bg-neutral-300 dark:hover:bg-neutral-600"
            `}
        >
          { <Mic size={18} />}
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          className="ml-2 bg-black text-white p-2 rounded-md hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition"
          disabled={loading}
        >
          <Send size={18} />
        </button>

      </div>
    </div>
  )
}