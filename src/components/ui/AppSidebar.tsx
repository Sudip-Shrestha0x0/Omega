import * as React from "react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Plus, User, LogOut, Settings, ChevronsUpDown, MessageSquare, LayoutDashboard, Users, CreditCard, History, Trash2, Search } from "lucide-react"

export function AppSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [recents, setRecents] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  // Load recents from local storage
  React.useEffect(() => {
    if (user) {
      const loadRecents = () => {
        try {
          const stored = localStorage.getItem(`omega_conversations_${user.id}`)
          if (stored) {
            setRecents(JSON.parse(stored).slice(0, 5)) // Limit to 5 recent chats
          }
        } catch (e) {
          console.error("Failed to load recents")
        }
      }
      
      loadRecents()
      // Poll for changes every few seconds to keep sidebar updated
      const interval = setInterval(loadRecents, 2000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleNewChat = () => {
    navigate('/dashboard/chat', { state: { newChat: true } })
  }

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteId(id)
  }

  const handleDeleteConversation = () => {
    if (!user || !deleteId) return

    const updatedRecents = recents.filter(c => c.id !== deleteId)
    setRecents(updatedRecents)
    
    localStorage.setItem(`omega_conversations_${user.id}`, JSON.stringify(updatedRecents))
    localStorage.removeItem(`omega_chat_history_${deleteId}`)
    setDeleteId(null)
  }

  const menuItems = [
    { title: "Chat", url: "/dashboard/chat", icon: MessageSquare },
    { title: "Teams", url: "/dashboard/teams", icon: Users },
    { title: "Plans", url: "/dashboard/plans", icon: CreditCard },
    { title: "History", url: "/dashboard/history", icon: History },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ]

  if (user?.role === 'admin') {
    menuItems.push({ title: "Admin", url: "/dashboard/admin", icon: LayoutDashboard })
  }

  const filteredRecents = recents.filter(chat => 
    (chat.title || "New Conversation").toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-black">
                  <span className="text-lg font-bold">Ω</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Omega</span>
                  <span className="truncate text-xs text-muted-foreground">AI Assistant</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton onClick={handleNewChat} className="bg-zinc-800 hover:bg-zinc-700 text-white mt-2">
               <Plus /> <span>New Chat</span>
             </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <div className="px-2 mb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-zinc-300 placeholder:text-zinc-600"
            />
          </div>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredRecents.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredRecents.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild className="group/item">
                      <Link to="/dashboard/chat" state={{ conversationId: chat.id }} className="relative pr-8">
                        <span className="truncate">{chat.title || "New Conversation"}</span>
                        <div
                          role="button"
                          onClick={(e) => confirmDelete(e, chat.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate('/dashboard/settings')}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-800 text-orange-500">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full rounded-lg object-cover" />
                  ) : (
                    <User className="size-4" />
                  )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.username}</span>
                <span className="truncate text-xs text-muted-foreground capitalize">{user?.plan} Plan</span>
              </div>
              <Settings className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete this conversation from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConversation} className="bg-red-600 hover:bg-red-700 text-white border-0">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}