'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../hooks/useDashboard';

const DashboardSideBarBtn = () => {
  const { open, setOpen } = useSidebar();

  return (
    <button
      onClick={() => setOpen((prev) => !prev)}
      className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
    >
      <Menu className="w-6 h-6 text-black dark:text-white" />
    </button>
  );
};

export default DashboardSideBarBtn;
