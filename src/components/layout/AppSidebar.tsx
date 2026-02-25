import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  History,
  Settings,
  User,
  Building2,
  Shield,
  ChevronDown,
  Users,
  Activity,
  Key,
  UserCircle,
  Eye,
  Radio
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';

import api from '../../axios'

export function AppSidebar() {
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname
  const [pendingCount, setPendingCount] = useState(0)
  const [activeBypassCount, setActiveBypassCount] = useState(0)
  const [sensorCount, setSensorCount] = useState(0)

  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);

  const [isMediumScreen, setIsMediumScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMediumScreen(width >= 768 && width < 1024)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleLinkClick = () => {
    if (isMediumScreen && !isMobile) {
      setOpen(false)
    } else if (isMobile) {
      setOpenMobile(false)
    }
  }

  useEffect(() => {
    const fetchCounts = () => {
      if (user && user.role !== 'user') {
        api.get('/requests/pending')
          .then(response => {
            let count = 0;
            if (Array.isArray(response.data)) {
              count = response.data.length;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
              count = response.data.data.length;
            }
            setPendingCount(count);
          })
          .catch(() => setPendingCount(0));

        api.get('/requests?status=approved')
          .then(response => {
            let count = 0;
            if (Array.isArray(response.data)) {
              count = response.data.length;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
              count = response.data.data.length;
            }
            setActiveBypassCount(count);
          })
          .catch(() => setActiveBypassCount(0));
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [location.key, user])

  // Navigation items matching mockup structure
  const supervisionItems = [
    {
      title: "Tableau de bord",
      url: "/",
      icon: LayoutDashboard,
      badge: null,
      role: ['supervisor', 'administrator', 'director']
    },
    {
      title: "Bypass Actifs",
      url: "/requests/mine",
      icon: Eye,
      badge: activeBypassCount > 0 ? activeBypassCount : null,
      role: ['supervisor', 'administrator', 'user', 'director']
    },
    {
      title: "Approbations",
      url: "/validation",
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
      role: ['supervisor', 'administrator', 'director']
    },
  ]

  const inventoryItems = [
    {
      title: "Tous les capteurs",
      url: "/sensors",
      icon: Radio,
      badge: null,
      role: ['administrator', 'supervisor', 'director']
    },
    {
      title: "Zones du site",
      url: "/zones",
      icon: Building2,
      badge: null,
      role: ['administrator', 'supervisor', 'director']
    },
  ]

  const adminItems = [
    {
      title: "Équipements",
      url: "/equipment",
      icon: Shield,
      badge: null,
      role: ['administrator']
    },
    {
      title: "Utilisateurs",
      url: "/users",
      icon: Users,
      badge: null,
      role: ['administrator']
    },
    {
      title: "Rôles et Permissions",
      url: "/roles-permissions",
      icon: Key,
      badge: null,
      role: ['administrator']
    },
    {
      title: "Historique",
      url: "/history",
      icon: History,
      badge: null,
      role: ['administrator']
    },
  ]

  const getNavClass = (active: boolean) =>
    `w-full justify-start transition-all duration-200 rounded-lg ${
      active
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium"
        : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
    }`

  const renderMenuSection = (items: typeof supervisionItems) => (
    <SidebarMenu className="space-y-0.5">
      {items
        .filter((item) => item.role.includes(user.role))
        .map((item) => (
          <SidebarMenuItem key={item.url}>
            <SidebarMenuButton asChild isActive={currentPath === item.url || (item.url === '/' ? currentPath === '/' : false)}>
              <NavLink
                to={item.url}
                className={({ isActive }) => getNavClass(isActive)}
                onClick={handleLinkClick}
                end={item.url === '/'}
              >
                <item.icon className="w-4 h-4" />
                {!collapsed && (
                  <>
                    <span className="text-sm">{item.title}</span>
                    {item.badge && (
                      <Badge className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
    </SidebarMenu>
  )

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border/50 p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sidebar-foreground text-sm">MineSafe OS</h2>
              <p className="text-[11px] text-sidebar-foreground/50">Gestion des bypass</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {/* SUPERVISION */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] font-semibold uppercase tracking-wider px-2 mb-1">
            Supervision
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuSection(supervisionItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* INVENTAIRE */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] font-semibold uppercase tracking-wider px-2 mb-1">
            Inventaire
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuSection(inventoryItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADMINISTRATION (admin only) */}
        {user.role === 'administrator' && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-[11px] font-semibold uppercase tracking-wider px-2 mb-1">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuSection(adminItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={currentPath === '/settings'}>
              <NavLink
                to="/settings"
                className={({ isActive }) => getNavClass(isActive)}
                onClick={handleLinkClick}
              >
                <Settings className="w-4 h-4" />
                {!collapsed && <span className="text-sm">Paramètres</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
