"use client"
import React, { useState } from "react"
import useProfessor from "../hooks/useProfessor"
import { apiFetch } from "@/lib/api"
import toast from "react-hot-toast"

export default function AskProfessor() {
    const [selectedProf, setSelectedProf] = useState("")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)

    const { professors } = useProfessor()

    const selectedProfessor = professors.find(
        (p) => p.id === selectedProf
    )

    const handleSend = async () => {
        if (!selectedProf || !subject || !message) {
            toast.error("Please fill in all fields")
            return
        }

        setError(null)
        setSuccess(null)
        setLoading(true)

        try {
            const data = await apiFetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    professorId: selectedProf,
                    subject,
                    body: message,
                }),
            })

            setSuccess(data.message || "Message sent!")
            toast.success("Message sent successfully!")
            
            setMessage("")
            setSubject("")
            setSelectedProf("")
        } catch (err) {
            console.error("SEND ERROR:", err)
            setError(err.message || "Network error")
            toast.error(err.message || "Network error")
        } finally {
            setLoading(false)
        }
    }

    // Shared tailwind styles for inputs
    const inputClasses = `
        w-full border rounded-md px-3 py-2 text-sm 
        bg-white dark:bg-neutral-800 
        border-neutral-200 dark:border-neutral-700 
        text-neutral-900 dark:text-neutral-100
        placeholder-neutral-400 dark:placeholder-neutral-500
    `

    return (
        <div className="w-full px-6 py-4 bg-transparent transition-colors">
            {/* Title Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold mb-1 text-neutral-900 dark:text-white">
                        Ask Professors
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2 lg:mb-6">
                        Choose a professor and send a message to their inbox.
                    </p>
                </div>

                {/* Dropdown */}
                <div className="w-full lg:w-72">
                    <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                        Professor
                    </label>
                    <select
                        value={selectedProf}
                        onChange={(e) => setSelectedProf(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="">Select a professor</option>
                        {professors.map((prof) => (
                            <option key={prof.id} value={prof.id}>
                                {prof.displayName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Professor Info Panel */}
            {selectedProfessor && (
                <div className="mt-4 py-3  text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                    <p><span className="font-medium text-neutral-900 dark:text-neutral-200">Title:</span> {selectedProfessor.title}</p>
                    <p><span className="font-medium text-neutral-900 dark:text-neutral-200">Office hours:</span> {selectedProfessor.officeHours}</p>
                </div>
            )}

            {/* Subject Input */}
            <div className="mt-6 w-full lg:w-1/2">
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    Subject
                </label>
                <input
                    type="text"
                    placeholder="e.g. Question about Assignment 3"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={inputClasses}
                />
            </div>

            {/* Message Area */}
            <div className="mt-5">
                <label className="block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300">
                    Message
                </label>
                <textarea
                    rows={6}
                    placeholder="Write your message…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${inputClasses} resize-none`}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                    onClick={() => window.history.back()}
                    className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                    Back
                </button>

                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="
                        bg-neutral-900 dark:bg-white 
                        text-white dark:text-neutral-900 
                        hover:bg-neutral-800 dark:hover:bg-neutral-100 
                        px-6 py-2.5 rounded-md text-sm font-semibold 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-sm transition-all active:scale-95
                    "
                >
                    {loading ? "Sending..." : "Send to inbox"}
                </button>
            </div>
        </div>
    )
}