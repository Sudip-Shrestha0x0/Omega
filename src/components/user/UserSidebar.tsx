import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { MessageSquare, Users, Settings, CreditCard, LogOut, Shield, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RecentConversation {
  id: string;
  title: string;
  timestamp: Date;
}

export function UserSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [recentChats, setRecentChats] = useState<RecentConversation[]>([]);

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`omega_conversations_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const recent = parsed
            .map((c: any) => ({
              id: c.id,
              title: c.title,
              timestamp: new Date(c.timestamp),
            }))
            .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5);
          setRecentChats(recent);
        } catch (error) {
          console.error('Failed to load recent chats');
        }
      }
    }
  }, [user, location]);

  const menuItems = [
    { title: 'Chat', icon: MessageSquare, href: '/dashboard/chat' },
    { title: 'Teams', icon: Users, href: '/dashboard/teams' },
    { title: 'Settings', icon: Settings, href: '/dashboard/settings' },
    { title: 'Plans', icon: CreditCard, href: '/dashboard/plans' },
    { title: 'History', icon: Clock, href: '/dashboard/history' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ title: 'Admin', icon: Shield, href: '/dashboard/admin' });
  }

  const handleRecentClick = (conversationId: string) => {
    navigate('/dashboard/chat', { state: { conversationId } });
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b bg-background">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-black">Ω</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Omega</h1>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        {recentChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground px-4">Recents</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-2 space-y-1">
                {recentChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleRecentClick(chat.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm text-muted-foreground hover:text-orange-500 transition-all truncate"
                  >
                    <MessageSquare className="inline-block w-4 h-4 mr-2" />
                    {chat.title}
                  </button>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-4">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-active={isActive}
                      className={`${
                        isActive 
                          ? 'bg-primary text-black cursor-default' 
                          : 'hover:bg-accent hover:text-orange-500'
                      } transition-all`}
                    >
                      <Link to={item.href} onClick={(e) => isActive && e.preventDefault()}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-background p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">{user?.username}</p>
          {user?.role === 'admin' && (
            <p className="text-xs text-primary font-semibold">Administrator</p>
          )}
          <p className="text-xs text-muted-foreground mt-1 uppercase">{user?.plan} Plan</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 text-muted-foreground hover:text-orange-500 hover:bg-accent px-3 py-2 rounded-lg transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
