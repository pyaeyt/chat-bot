"use client";
import { Moon, MoonIcon, Sun, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      root.classList.add("dark");
      setIsDark(true);
    } else {
      root.classList.remove("dark");
      setIsDark(false);
    }
  }, []);


  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.theme = "light";
      setIsDark(false);
    } else {
      root.classList.add("dark");
      localStorage.theme = "dark";
      setIsDark(true);
    }
  };

  return (

    <button
      onClick={toggleTheme}
      className="flex items-center justify-center
        w-10 h-10
        rounded-md
        border border-gray-300 dark:border-neutral-700
        bg-white dark:bg-neutral-900
        text-gray-700 dark:text-gray-200
        hover:bg-gray-100 dark:hover:bg-neutral-800
        transition-all duration-300"
      aria-label="Toggle theme"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
    //  <label className="inline-flex items-center cursor-pointer">
    //   <input
    //     type="checkbox"
    //     className="sr-only peer"
    //     checked={isDark}
    //     onChange={toggleTheme}
    //   />
    //   <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600" />
    //   <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
    //     {isDark ? "☀️ Light" : "🌙 Dark"}
    //   </span>
    // </label>

  );
}
