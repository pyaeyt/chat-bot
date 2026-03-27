"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function FAQsSection() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: "What is AI Assist?",
      answer:
        "AI Assist is a smart classroom system that helps students with learning, navigation, and academic support using artificial intelligence.",
    },
    {
      question: "How do I ask a professor?",
      answer:
        "Go to the 'Ask Professor' section and submit your question. The professor will respond when available.",
    },
    {
      question: "Can I use voice to ask questions?",
      answer:
        "Yes, you can use the voice-to-text feature to ask questions without typing.",
    },
    {
      question: "How does the campus map work?",
      answer:
        "The map helps you locate buildings and classrooms. Future updates will include smart navigation and directions.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes, your data is securely stored and protected. Authentication ensures only authorized access.",
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h1>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index

          return (
            <div
              key={index}
              className="border border-neutral-200 dark:border-neutral-800 rounded-lg"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium">{faq.question}</span>

                <ChevronDown
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  size={18}
                />
              </button>

              {/* Answer */}
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-300">
                  {faq.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}