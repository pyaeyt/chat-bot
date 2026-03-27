"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Settings,
  X,
  BotMessageSquare,
  GraduationCap,
  SquarePen,
  LogOut,
  Map,
  CircleQuestionMark,
  ChevronDown,
  MessageSquare,
  Bell,
  Inbox,
  Users,
  Contact,
  MessageCircleQuestionMark,
} from "lucide-react"

export default function DashboardSidebar({ open, setOpen }) {
  const pathname = usePathname()
  const router = useRouter()

  const [openDropdown, setOpenDropdown] = useState(null)
  const [role, setRole] = useState(null)

  //  Get role from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user) setRole(user.role)
  }, [])

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  //  STUDENT NAV
  const studentNav = [
    { name: "AI Chat", href: "/dashboard/chat", icon: BotMessageSquare },
    { name: "Ask Professor", href: "/dashboard/ask-professor", icon: GraduationCap },
    { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    { name: "Map", href: "/dashboard/map", icon: Map },

    {
      name: "Help & Support",
      icon: CircleQuestionMark,
      children: [
        { name: "FAQs", href: "/dashboard/faqs", icon: MessageCircleQuestionMark },
        { name: "Contact Support", href: "/dashboard/contact-support", icon: Contact },
      ],
    },
  ]

  //  PROFESSOR NAV
  const professorNav = [
    { name: "Student Chats", href: "/dashboard/professor/inbox", icon: MessageSquare },
    { name: "Notifications", href: "/dashboard/professor/notifications", icon: Bell },
    { name: "Students", href: "/dashboard/professor/students", icon: Users },

    {
      name: "Help & Support",
      icon: CircleQuestionMark,
      children: [
        { name: "FAQs", href: "/dashboard/faqs", icon: MessageCircleQuestionMark },
        { name: "Contact Support", href: "/dashboard/contact-support", icon: Contact },
      ],
    },
  ]

  //  SETTINGS (shared)
  const settingsNav = {
    name: "Settings",
    icon: Settings,
    children: [
      { name: "Profile", href: "/dashboard/settings/profile" },
      { name: "Preferences", href: "/dashboard/settings/preferences" },
    ],
  }

  const navItems =
    role === "professor"
      ? [...professorNav, settingsNav]
      : [...studentNav, settingsNav]

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
        />
      )}

      <aside
        className={`
          h-full w-64 md:w-auto z-50
          bg-white border-r border-neutral-200
          dark:bg-neutral-900 dark:border-neutral-800
          fixed md:relative
          transition-all duration-300
          flex flex-col
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between mb-6 px-2 pt-5">
          <Link
            href={role === "professor" ? "/dashboard/professor" : "/dashboard"}
            className={`
              flex items-center
              ${open ? "justify-start px-3 gap-3" : "justify-center w-full"}
              h-10 transition-all duration-300
            `}
          >
            <BotMessageSquare className="w-5 h-5 dark:text-white" />
            <h2
              className={`
                text-lg font-semibold
                ${open ? "opacity-100" : "opacity-0 w-0"}
                dark:text-white
              `}
            >
              AI Assist
            </h2>
          </Link>

          <button onClick={() => setOpen(false)} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-2 px-2 text-sm flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isDropdown = item.children

            if (isDropdown) {
              const isOpen = openDropdown === item.name

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`
                      flex items-center w-full
                      ${open ? "justify-between px-3" : "justify-center"}
                      h-10 rounded-md
                      text-neutral-600 dark:text-neutral-300
                      hover:bg-neutral-200 dark:hover:bg-neutral-800
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={17} />
                      {open && <span>{item.name}</span>}
                    </div>

                    {open && (
                      <ChevronDown
                        size={16}
                        className={`transition ${isOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>

                  {isOpen && open && (
                    <div className="ml-8 mt-1 flex flex-col gap-1">
                      {item.children.map((sub) => {
                        const active = pathname === sub.href
                        const SubIcon = sub.icon

                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`
                              px-3 py-1 rounded-md text-sm flex items-center gap-3
                              ${active
                                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black"
                                : "text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                              }
                            `}
                          >
                            {SubIcon && <SubIcon size={16} />}
                            {sub.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const active = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center
                  ${open ? "justify-start px-3 gap-3" : "justify-center"}
                  h-10 rounded-md
                  transition-all duration-300

                  ${active
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  }
                `}
              >
                <Icon size={17} />
                {open && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className={`
              flex items-center w-full
              ${open ? "justify-start px-3 gap-3" : "justify-center"}
              h-10 rounded-md
              bg-red-600 text-white hover:bg-red-700
            `}
          >
            <LogOut size={17} />
            {open && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}