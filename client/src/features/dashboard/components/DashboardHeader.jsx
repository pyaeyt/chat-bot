// dashboard/components/DashboardHeader.tsx
"use client"
import ThemeToggle from "../../../styles/ToggleMode"
import { useSidebar } from "../hooks/useDashboard"
import DashboardSideBarBtn from "./DashboardSideBarBtn"

export default function DashboardHeader() {

    const {user} = useSidebar();
    // console.log("User Info:" , user)
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white
                       dark:bg-neutral-900 dark:border-neutral-800">

      {/* Left */}
      <div className="flex items-center gap-3">
        <DashboardSideBarBtn />

        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="text-sm flex flex-col items-start text-neutral-600 dark:text-neutral-300">
          <p>{user?.displayName}</p>
          <p className="text-xs">{user?.email}</p>
        </div>

        {/* <button className="border rounded-md px-3 py-1.5 text-sm hover:bg-neutral-100 
                           dark:hover:bg-neutral-800 transition">
          Logout
        </button> */}
        <ThemeToggle />
      </div>
    </header>
  )
}