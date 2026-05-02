'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileSheet } from "@/components/mobile/MobileSheet";
import { SettingsDialog } from "@/components/dashboard/SettingsDialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const pathname = usePathname();

  // Hide mobile header & bottom bar on practice page (immersive mode)
  const isPractice = pathname === '/dashboard/practice';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: sidebar (unchanged) */}
      <Sidebar />

      {/* Mobile: header + tab bar (hidden during practice) */}
      {!isDesktop && !isPractice && (
        <>
          <MobileHeader onAvatarTap={() => setIsSettingsOpen(true)} />
          <BottomTabBar onSettingsOpen={() => setIsSettingsOpen(true)} />
        </>
      )}

      {/* Main content area */}
      <main className={
        isDesktop
          ? 'pl-64 min-h-screen'
          : isPractice
            ? 'min-h-screen pt-2 pb-2'
            : 'min-h-screen pt-[72px] pb-24'
      }>
        <div className={
          isDesktop
            ? 'p-8 max-w-[1600px] mx-auto'
            : 'px-4 py-4'
        }>
          {children}
        </div>
      </main>

      {/* Settings: full-screen sheet on mobile, dialog on desktop */}
      {!isDesktop ? (
        <MobileSheet
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          title="Settings"
          fullScreen
        >
          <SettingsDialog
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            mobileMode
          />
        </MobileSheet>
      ) : (
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
        />
      )}
    </div>
  );
}
