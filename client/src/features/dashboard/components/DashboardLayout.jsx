"use client"

import { SidebarProvider } from "../hooks/useDashboard"
import DashboardHeader from "./DashboardHeader"
import DashboardSidebar from "./DashboardSideBar"
import { useSidebar } from "../hooks/useDashboard"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function LayoutContent({ children }) {
  const { open, setOpen } = useSidebar()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")

    if (!token) {
      router.replace("/login") // block access
    } else {
      setLoading(false)
    }
  }, [])

  // Prevent flicker (important)
  if (loading) return null

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950">

      {/* Sidebar */}
      <div className={`
        ${open ? "md:w-64" : "md:w-17"}
        transition-all duration-300
      `}>
        <DashboardSidebar open={open} setOpen={setOpen} />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        <DashboardHeader />

        <main className="flex-1 flex flex-col min-h-0 p-6">
          {children}
        </main>
      </div>

    </div>
  )
}

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}