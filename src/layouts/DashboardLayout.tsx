import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/AppSidebar';

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        {/* overflow-y-auto to allow scrolling within pages while keeping flex layout */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
