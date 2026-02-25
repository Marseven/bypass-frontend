import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  History, 
  Settings, 
  User,
  Building2,
  AlertTriangle,
  Shield,
  ChevronDown,
  Users,
  Activity,
  Key,
  UserCircle
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
import { login, logout, setUsers } from '../../store/users';

import api from '../../axios'


// const menuItems = [
//   {
//     title: "Vue d'ensemble",
//     url: "/",
//     icon: LayoutDashboard,
//     badge: null
//   },
//   {
//     title: "Demandes",
//     icon: FileText,
//     items: [
//       { title: "Nouvelle demande", url: "/requests/new", icon: FileText },
//       { title: "Mes demandes", url: "/requests/mine", icon: User, badge: "3" },
//     ]
//   },
//   {
//     title: "Validation",
//     url: "/validation",
//     icon: CheckSquare,
//     badge: "12"
//   },
//   {
//     title: "Historique",
//     url: "/history",
//     icon: History,
//     badge: null
//   },
// ]

const adminItems = [
  {
    title: "Zones",
    url: "/zones",
    icon: Building2,
    badge: null,
    role: ['administrator']
  },
  {
    title: "Équipements",
    url: "/equipment",
    icon: Shield,
    badge: null,
    role: ['administrator']
  },
  {
    title: "Capteurs",
    url: "/sensors",
    icon: Activity,
    badge: null,
    role: ['administrator']
  },
]

const userRoleItems = [
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
]

const settingsItems = [
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
    badge: null,
    role: ['administrator']
  },
  {
    title: "Mon profil",
    url: "/profile",
    icon: UserCircle,
    badge: null,
    role: ['administrator', 'supervisor', 'user', 'director']
  },
  {
    title: "Conditions d'utilisation",
    url: "/terms",
    icon: FileText,
    badge: null,
    role: ['administrator', 'supervisor', 'user', 'director']
  },
]

export function AppSidebar() {
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    demandes: true
  })
  const [validate, setValidateValue] = useState(0)

  const dispatch = useDispatch<AppDispatch>();
  const { users, loading, error, user, token } = useSelector((state: RootState) => state.user);

  // Détecter les écrans moyens (entre 768px et 1024px)
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

  // Fonction pour fermer la sidebar sur les écrans moyens
  const handleLinkClick = () => {
    if (isMediumScreen && !isMobile) {
      setOpen(false)
    } else if (isMobile) {
      setOpenMobile(false)
    }
  }
  

  const menuItems = [
    {
      title: "Vue d'ensemble",
      url: "/",
      icon: LayoutDashboard,
      role: ['supervisor', 'administrator']
    },
    {
      title: "Demandes",
      icon: FileText,
      items: [
        { title: "Nouvelle demande", url: "/requests/new", icon: FileText },
        { title: "Mes demandes", url: "/requests/mine", icon: User, badge: "3" },
      ],
      role: ['supervisor', 'administrator', 'user']
    },
    {
      title: "Validation",
      url: "/validation",
      icon: CheckSquare,
      badge: validate,
      role: ['supervisor', 'administrator']
    },
    {
      title: "Historique",
      url: "/history",
      icon: History,
      role: ['administrator']
    },
  ]

  useEffect(() => {
    // Fonction pour récupérer le nombre de demandes en attente
    const fetchPendingCount = () => {
      if(user && user.role !== 'user'){
        api.get('/requests/pending')
        .then(response => {
          // Handle successful response
          // La réponse peut être un tableau directement ou un objet paginé
          let count = 0;
          if (Array.isArray(response.data)) {
            count = response.data.length;
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            count = response.data.data.length;
          }
          setValidateValue(count);
        })
        .catch(error => {
          // Handle error
          console.error('Error fetching pending requests count:', error);
          setValidateValue(0);
        });
      } else {
        setValidateValue(0);
      }
    };

    // Récupérer immédiatement
    fetchPendingCount();
    
    // Puis toutes les 30 secondes pour mettre à jour le compteur
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, [location.key, user])


  const isActive = (path: string) => currentPath === path
  const getNavClass = (active: boolean) =>
    `w-full justify-start transition-all duration-200 ${
      active 
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
    }`

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="border-b border-sidebar-border/50 p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center px-1">
            {/* <Shield className="w-4 h-4 text-sidebar-primary-foreground" /> */}
            <img src="/logo.png" alt="Logo ByPass Guard" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sidebar-foreground">Bypass Guard</h2>
              <p className="text-xs text-sidebar-foreground/60">Système de validation</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems
              .filter((item) => item.role.includes(user.role))
              .map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => toggleGroup('demandes')}
                        className={`w-full justify-between h-9 px-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </div>
                        {!collapsed && (
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedGroups.demandes ? 'rotate-180' : ''}`} />
                        )}
                      </Button>
                      {expandedGroups.demandes && !collapsed && (
                        <div className="ml-4 space-y-1 border-l border-sidebar-border/30 pl-4">
                          {item.items.map((subItem) => (
                            <SidebarMenuButton key={subItem.url} asChild isActive={currentPath === subItem.url}>
                              <NavLink 
                                to={subItem.url} 
                                className={({ isActive }) => getNavClass(isActive)}
                                onClick={handleLinkClick}
                                end
                              >
                                <subItem.icon className="w-4 h-4" />
                                <span className="text-sm">{subItem.title}</span>
                                {/* {subItem.badge && (
                                  <Badge variant="secondary" className="ml-auto text-xs">
                                    {subItem.badge}
                                  </Badge>
                                )} */}
                              </NavLink>
                            </SidebarMenuButton>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
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
                            {(item.badge >= 1) && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {
          (user.role === 'administrator') &&

          <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {adminItems
              .filter((item) => item.role.includes(user.role))
              .map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClass(isActive)}
                      onClick={handleLinkClick}
                      end
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && (
                        <>
                          <span className="text-sm">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
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
          </SidebarGroupContent>
        </SidebarGroup>
      }

      {
        (user.role === 'administrator') &&

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider">
            Utilisateurs et accès
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {userRoleItems
              .filter((item) => item.role.includes(user.role))
              .map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClass(isActive)}
                      onClick={handleLinkClick}
                      end
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && (
                        <>
                          <span className="text-sm">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
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
          </SidebarGroupContent>
        </SidebarGroup>
      }

      <SidebarGroup className="mt-4">
        <SidebarGroupLabel className="text-sidebar-foreground/60 text-xs font-medium uppercase tracking-wider">
          Compte et paramètres
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
            {settingsItems
            .filter((item) => item.role.includes(user.role))
            .map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={currentPath === item.url}>
                  <NavLink 
                    to={item.url} 
                    className={({ isActive }) => getNavClass(isActive)}
                    onClick={handleLinkClick}
                    end
                  >
                    <item.icon className="w-4 h-4" />
                    {!collapsed && (
                      <>
                        <span className="text-sm">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
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
        </SidebarGroupContent>
      </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <User className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                { user.full_name }
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                { user.role }
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}