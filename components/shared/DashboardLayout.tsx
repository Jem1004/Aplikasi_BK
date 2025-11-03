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
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Auto-close mobile overlay when switching to desktop
      if (!mobile && sidebarOpen) {
        setSidebarOpen(false);
      }

      // Auto-minimize sidebar only on very small screens (tablets)
      if (window.innerWidth < 900 && window.innerWidth >= 768 && !sidebarMinimized) {
        setSidebarMinimized(true);
      } else if (window.innerWidth >= 900 && sidebarMinimized) {
        setSidebarMinimized(false);
      }
    };

    // Initial check
    checkMobile();

    const handleResize = () => {
      checkMobile();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, sidebarMinimized]);

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
      <div className={`flex ${isMobile ? 'min-h-screen' : 'h-screen'}`}>
        {/* Sidebar - Responsive positioning */}
        <Sidebar
          role={role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMinimized={sidebarMinimized}
          onToggleMinimized={() => setSidebarMinimized(!sidebarMinimized)}
        />

        {/* Main content area - Responsive layout */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Enhanced mobile header */}
          <header className="md:hidden relative z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-150 touch-manipulation"
                aria-label="Toggle menu"
              >
                <div className="h-6 w-6 flex flex-col justify-center gap-1">
                  <div className={`h-0.5 w-6 bg-gray-700 rounded-full transition-all duration-300 ${sidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
                  <div className={`h-0.5 w-6 bg-gray-700 rounded-full transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`h-0.5 w-6 bg-gray-700 rounded-full transition-all duration-300 ${sidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
                </div>
                <span className="text-sm font-semibold text-gray-800">Menu</span>
              </button>

              {/* Page title placeholder for mobile */}
              <div className="text-sm font-semibold text-gray-900">
                Aplikasi BK
              </div>

              {/* User avatar for mobile */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                <span className="text-white font-semibold text-xs">
                  {role?.slice(0, 2).toUpperCase() || 'BK'}
                </span>
              </div>
            </div>
          </header>

          {/* Main content with responsive scrolling */}
          <main
            id="main-content"
            className={`flex-1 transition-all duration-300 ease-in-out ${
              isMobile ? 'overflow-y-auto' : 'overflow-auto'
            }`}
            role="main"
            aria-label="Konten utama"
          >
            {/* Responsive content wrapper */}
            <div className={`
              ${isMobile ? 'px-3 py-4' : 'p-4 md:p-6 lg:p-8'}
              ${isMobile ? '' : 'max-w-7xl mx-auto'}
              ${isMobile ? 'pb-20' : ''}
            `}>
              <div className={`
                animate-in fade-in duration-300 slide-in-from-bottom-2
                ${isMobile ? 'space-y-4' : ''}
              `}>
                {children}
              </div>
            </div>
          </main>

          {/* Bottom safe area for mobile */}
          {isMobile && (
            <div className="h-safe-inset-bottom bg-gray-50 border-t border-gray-200/60 min-h-[env(safe-area-inset-bottom)]">
              {/* Extra space for mobile navigation gestures */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
