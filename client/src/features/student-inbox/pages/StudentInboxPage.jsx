"use client"

import { useState } from "react"
import StudentInboxSection from "../components/StudentInboxSection"
import StudentThreadView from "../components/StudentThreadView"
import DashboardLayout from "../../dashboard/components/DashboardLayout"

export default function StudentInboxPage() {
  const [selectedThread, setSelectedThread] = useState(null)

  return (
    <DashboardLayout>
      <div className="flex flex-1 min-h-0 
        bg-white dark:bg-neutral-900 
        rounded-lg 
        border border-neutral-200 dark:border-neutral-800 
        overflow-hidden">

        {/* LEFT (Inbox List) */}
        <div
          className={`
          ${selectedThread ? "hidden md:flex" : "flex"}
          flex-col w-full md:w-1/3 
          border-r border-neutral-200 dark:border-neutral-800
        `}
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-lg text-neutral-900 dark:text-white">
              Inbox
            </h2>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3">
            <StudentInboxSection onSelectThread={setSelectedThread} />
          </div>
        </div>

        {/* RIGHT (Chat View) */}
        <div
          className={`
          ${selectedThread ? "flex" : "hidden md:flex"}
          flex-1 flex-col
        `}
        >
          {selectedThread ? (
            <StudentThreadView
              thread={selectedThread}
              onBack={() => setSelectedThread(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center 
              text-neutral-500 dark:text-neutral-400">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}