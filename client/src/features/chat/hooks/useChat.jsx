import { useState } from "react"

export const useChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hello! How can I assist you today?" }
  ])
  const [loading, setLoading] = useState(false)
  const token = localStorage.getItem("token")

  const sendMessage = async (userId, text) => {
    console.log("sendMessage called:", text, userId)

    if (!text.trim() || !userId) {
      console.log("blocked:", { text, userId })
      return
    }

    const userMsg = {
      id: crypto.randomUUID(),
      sender: "user",
      text
    }

    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch("http://localhost:4000/api/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          question: text
        }),
      })
      if (!res.ok) {
        throw new Error("API failed")
      }
      const data = await res.json()

      const botMsg = {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data.message || "No response"
      }

      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.error(" API error:", err)

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "bot",
          text: "Server error"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const translateMessage = async (text, targetLanguage) => {
    const token = localStorage.getItem("token")

    try {
      const res = await fetch("http://localhost:4000/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          text,
          targetLanguage
        })
      })

      const data = await res.json()
      console.log("Translated:", data)
      return data.translatedText
    } catch (err) {
      console.error("Translate error:", err)
      return "Translation failed"
    }
  }

  return { messages, sendMessage, loading, translateMessage }
}

