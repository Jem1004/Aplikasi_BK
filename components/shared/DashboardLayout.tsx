"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: string;
  navbar?: React.ReactNode; // Optional for future use
}

export function DashboardLayout({ children, role, navbar }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Close mobile overlay
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-md focus:shadow-lg transition-all duration-200"
      >
        Langsung ke konten utama
      </a>

      {/* Main layout container */}
      <div className="flex h-screen">
        {/* Sidebar - Fixed on left side */}
        <Sidebar
          role={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMinimized={sidebarMinimized}
          onToggleMinimized={() => setSidebarMinimized(!sidebarMinimized)}
        />

        {/* Main content area without header for minimalis design */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile menu toggle button - only visible on mobile */}
          <div className="md:hidden relative z-30 bg-white border-b border-gray-200/60 p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <div className="h-6 w-6 flex flex-col justify-center gap-1">
                <div className="h-0.5 w-6 bg-gray-600 rounded-full"></div>
                <div className="h-0.5 w-6 bg-gray-600 rounded-full"></div>
                <div className="h-0.5 w-6 bg-gray-600 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Menu</span>
            </button>
          </div>

          {/* Main content */}
          <main
            id="main-content"
            className="flex-1 overflow-auto transition-all duration-300 ease-in-out"
            role="main"
            aria-label="Konten utama"
          >
            {/* Content wrapper with proper spacing */}
            <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
              <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
