import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router-dom"
import { getLabel, statusLabels, priorityLabels } from "@/utils/statusLabels"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Filter,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  ArrowLeft,
  Calendar,
  Activity,
} from "lucide-react"
import { BypassRequestForm } from "@/components/forms/BypassRequestForm"
import { RequestDetailsModal } from "@/components/RequestDetailsModal"
import api from '../axios'
import type { Equipment, EquipmentType, EquipmentStatus, CriticalityLevel, Zone } from '@/types/equipment';
import { useAuthStore } from '@/store/useAuthStore';
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"


const mockRequests = [
  {
    id: "BR-2024-001",
    equipment: "Ligne de production A",
    sensor: "Capteur de pression #12",
    requester: "Marie Martin",
    priority: "Haute",
    status: "En attente",
    date: "2024-01-15",
    reason: "Maintenance préventive"
  },
  {
    id: "BR-2024-002",
    equipment: "Four industriel B", 
    sensor: "Capteur de température #8",
    requester: "Pierre Dubois",
    priority: "Moyenne",
    status: "Approuvé",
    date: "2024-01-14",
    reason: "Étalonnage capteur"
  },
  {
    id: "BR-2024-003",
    equipment: "Compresseur C",
    sensor: "Capteur de vibration #3",
    requester: "Sophie Leroy",
    priority: "Faible",
    status: "En cours",
    date: "2024-01-13",
    reason: "Test de fonctionnement"
  },
  {
    id: "BR-2024-004",
    equipment: "Pompe hydraulique D",
    sensor: "Capteur de débit #15",
    requester: "Marc Dubois",
    priority: "Haute",
    status: "Rejeté",
    date: "2024-01-12",
    reason: "Remplacement pièce"
  }
]

export default function Requests() {
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [requestList, setRequestList] = useState([]);
  const [requestDemand, setRequestDemandList] = useState([]);
  const [requestApprobation, setRequestApprobationList] = useState([]);
  const [requestActifs, setRequestActifList] = useState([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isLoadingMine, setIsLoadingMine] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isLoadingActive, setIsLoadingActive] = useState(false);
  const { user } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [activeTab, setActiveTab] = useState(user?.role !== 'user' ? "mine" : "mine");
  
  // Fonction pour obtenir l'état de chargement selon l'onglet actif
  const isLoading = () => {
    switch (activeTab) {
      case "all":
        return isLoadingAll;
      case "mine":
        return isLoadingMine;
      case "pending":
        return isLoadingPending;
      case "active":
        return isLoadingActive;
      default:
        return isLoadingMine;
    }
  }
  // Déterminer quelle vue afficher selon l'URL
  const isNewRequest = location.pathname === '/requests/new'

  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case "week":
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(today.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          start: startOfWeek,
          end: endOfWeek
        };
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          start: startOfMonth,
          end: endOfMonth
        };
      case "custom":
        if (customDate) {
          const start = new Date(customDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customDate);
          end.setHours(23, 59, 59, 999);
          return {
            start,
            end
          };
        }
        return null;
      default:
        return null;
    }
  };

  const matchesDateFilter = (item: any) => {
    if (dateFilter === "all") return true;
    
    const dateRange = getDateRange(dateFilter);
    if (dateRange && item.created_at) {
      const itemDate = new Date(item.created_at);
      return itemDate >= dateRange.start && itemDate <= dateRange.end;
    } else if (dateFilter === "custom" && !customDate) {
      return true;
    }
    return false;
  };

  const filteredRequests = (requestList ?? []).filter(request => {
    const matchesSearch = (request.equipment?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.sensor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.request_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    const matchesDate = matchesDateFilter(request)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate
  })

  const filteredDemand = (requestDemand ?? []).filter(request => {
    const matchesSearch = (request.equipment?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.sensor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.request_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    const matchesDate = matchesDateFilter(request)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate
  })

  const filteredApprobation = (requestApprobation ?? []).filter(request => {
    const matchesSearch = (request.equipment?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.sensor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.request_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    const matchesDate = matchesDateFilter(request)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate
  })

  const filteredActifs = (requestActifs ?? []).filter(request => {
    const matchesSearch = (request.equipment?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.sensor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.request_code || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter
    const matchesDate = matchesDateFilter(request)
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate
  })

  // Fonction pour obtenir la liste filtrée selon l'onglet actif
  const getFilteredList = () => {
    switch (activeTab) {
      case "all":
        return filteredRequests;
      case "mine":
        return filteredDemand;
      case "pending":
        return filteredApprobation;
      case "active":
        return filteredActifs;
      default:
        return filteredDemand;
    }
  }

  const currentFilteredList = getFilteredList();

  // Calcul de la pagination
  const totalPages = Math.ceil(currentFilteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = currentFilteredList.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres, l'onglet ou le nombre d'éléments par page changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, dateFilter, customDate, activeTab, itemsPerPage]);

  // Réinitialiser la date personnalisée quand le filtre change
  useEffect(() => {
    if (dateFilter !== "custom") {
      setCustomDate(undefined);
    }
  }, [dateFilter]);



  useEffect(() => {
    
    if(user && ['administrateur', 'administrator'].includes(user.role)){
        // Pour l'administrateur, récupérer toutes les demandes du système
        setIsLoadingAll(true);
        api.get('/requests')
        .then(response => {
          // Handle successful response
          // La réponse peut être un tableau directement ou un objet paginé
          if (Array.isArray(response.data)) {
            setRequestList(response.data);
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            setRequestList(response.data.data);
          } else {
            setRequestList([]);
          }
          setIsLoadingAll(false);
        })
        .catch(error => {
          // Handle error
          console.error('Error fetching data:', error);
          setIsLoadingAll(false);
        });
    }

    if(user && ['administrateur', 'administrator', 'chef_de_quart', 'supervisor', 'responsable_hse', 'resp_exploitation', 'directeur', 'director'].includes(user.role)){
        setIsLoadingPending(true);
        api.get('/requests/pending')
        .then(response => {
          // Handle successful response
          // La réponse peut être un tableau directement ou un objet paginé
          if (Array.isArray(response.data)) {
            setRequestApprobationList(response.data);
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            setRequestApprobationList(response.data.data);
          } else {
            setRequestApprobationList([]);
          }
          setIsLoadingPending(false);
        })
        .catch(error => {
          // Handle error
          console.error('Error fetching data:', error);
          setIsLoadingPending(false);
        });

        setIsLoadingActive(true);
        api.get('/requests/active')
        .then(response => {
          // Handle successful response
          // La réponse peut être un tableau directement ou un objet paginé
          if (Array.isArray(response.data)) {
            setRequestActifList(response.data);
          } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
            setRequestActifList(response.data.data);
          } else {
            setRequestActifList([]);
          }
          setIsLoadingActive(false);
        })
        .catch(error => {
          // Handle error
          console.error('Error fetching data:', error);
          setIsLoadingActive(false);
        });
    }
    
    setIsLoadingMine(true);
    api.get('/requests/mine')
    .then(response => {
      // Handle successful response
      // La réponse peut être un tableau directement ou un objet paginé
      if (Array.isArray(response.data)) {
        setRequestDemandList(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setRequestDemandList(response.data.data);
      } else {
        setRequestDemandList([]);
      }
      setIsLoadingMine(false);
    })
    .catch(error => {
      // Handle error
      console.error('Error fetching data:', error);
      setRequestDemandList([]);
      setIsLoadingMine(false);
    });
    
    
    
    

  }, [location.key])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Haute": return "bg-destructive text-destructive-foreground"
      case "high": return "bg-destructive text-destructive-foreground"
      case "Moyenne": return "bg-warning text-warning-foreground"
      case "medium": return "bg-warning text-warning-foreground"
      case "Faible": return "bg-success text-success-foreground"
      case "low": return "bg-success text-success-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted text-muted-foreground"
      case "pending": return "bg-warning text-warning-foreground"
      case "approved": return "bg-blue-500 text-white"
      case "active": return "bg-green-600 text-white"
      case "closed": return "bg-gray-600 text-white"
      case "expired": return "bg-orange-500 text-white"
      case "rejected": return "bg-destructive text-destructive-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
      case "pending": return <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
      case "approved": return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      case "active": return <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
      case "closed": return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      case "expired": return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
      case "rejected": return <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
      default: return <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
    }
  }


  const resetFilter = () =>{
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setDateFilter("all")
    setCustomDate(undefined)
  }

  // Si on est sur /requests/new, afficher le formulaire
  if (isNewRequest) {
    return (
      <div className="flex-1 space-y-3 sm:space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6">
        {/* Header avec navigation retour - aligné avec le formulaire */}
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="text-left w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                Nouvelle demande de bypass
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                Créer une nouvelle demande de bypass de capteur
              </p>
            </div>
            <Button variant="outline" size="icon" asChild className="flex-shrink-0 rounded-full w-12 h-12">
              <Link to="/requests">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Formulaire de nouvelle demande */}
        <BypassRequestForm />
      </div>
    )
  }

  // Sinon, afficher la liste des demandes
  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Gestion des demandes</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Suivi et gestion des demandes de bypass</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Demandes</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            {/* Bouton retour */}
            <Button variant="outline" size="icon" className="flex-shrink-0 rounded-full w-10 h-10" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets de navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
        <TabsList className="flex flex-row w-full h-auto gap-2 flex-wrap justify-between">
          {(user?.role === "administrator") && (
            <TabsTrigger value="all" onClick={resetFilter} className="text-xs sm:text-sm py-2 px-2 sm:px-4 truncate flex-1 min-w-0">
              Toutes les demandes
            </TabsTrigger>
          )}
          <TabsTrigger value="mine" onClick={resetFilter} className="text-xs sm:text-sm py-2 px-2 sm:px-4 truncate flex-1 min-w-0">
            Mes demandes
          </TabsTrigger>
          {(user?.role === "administrator" || user?.role === "supervisor") && (
            <>
              <TabsTrigger value="pending" onClick={resetFilter} className="text-xs sm:text-sm py-2 px-2 sm:px-4 truncate flex-1 min-w-0">
                <span className="truncate">En attente</span>
              </TabsTrigger>
              <TabsTrigger value="active" onClick={resetFilter} className="text-xs sm:text-sm py-2 px-2 sm:px-4 truncate flex-1 min-w-0">
                Bypass actifs
              </TabsTrigger>
            </>
          )}
          
        </TabsList>

        {(user?.role === "administrator") && (
          <TabsContent value="all" className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <Card className="w-full box-border">
              {/* <CardHeader className="p-3 sm:p-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Filter className="w-4 h-4 sm:w-4 sm:h-4" />
                  Filtres
                </CardTitle>
              </CardHeader> */}
              <CardContent className="p-4 sm:p-6 w-full min-w-0">
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 w-full min-w-0">
                  <div className="relative sm:col-span-2 lg:col-span-1 w-full min-w-0">
                    <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 w-full text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-sm w-full min-w-0">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="closed">Clôturé</SelectItem>
                      <SelectItem value="expired">Expiré</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="text-sm w-full min-w-0">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les priorités</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Faible</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="text-sm w-full min-w-0">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les périodes</SelectItem>
                      <SelectItem value="today">Aujourd'hui</SelectItem>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="custom">Personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                    setPriorityFilter("all")
                    setDateFilter("all")
                    setCustomDate(undefined)
                  }} className="text-sm w-full sm:w-auto min-w-0 truncate">
                    <span className="hidden sm:inline truncate">Réinitialiser filtres</span>
                    <span className="sm:hidden truncate">Réinitialiser</span>
                  </Button>
                </div>
                {/* Sélecteur de date personnalisée */}
                {dateFilter === "custom" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2 max-w-xs">
                      <Label className="text-sm">Sélectionner une date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal text-sm ${
                              !customDate && "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {customDate ? (
                              format(customDate, "PPP", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={customDate}
                            onSelect={setCustomDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contrôles de pagination et sélection du nombre d'éléments */}
            {filteredRequests.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-4 w-full min-w-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Éléments par page:</Label>
                    <Select 
                      value={itemsPerPage.toString()} 
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="w-16 sm:w-20 flex-shrink-0 h-8 text-xs sm:text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  Affichage de {startIndex + 1} à {Math.min(endIndex, filteredRequests.length)} sur {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Requests list - Grille mobile/tablette / Liste desktop */}
            {isLoading() ? (
              <>
                {/* Skeleton Loading - Vue grille mobile/tablette */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-3 md:gap-4 w-full min-w-0">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <Card key={index} className="flex flex-col h-full w-full min-w-0 box-border">
                      <CardHeader className="pb-4 p-6 min-w-0">
                        <div className="flex items-start justify-between gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Skeleton className="w-6 h-6 rounded-full" />
                            <div className="min-w-0 flex-1">
                              <Skeleton className="h-5 w-32 mb-2" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-3 w-full mt-2" />
                        <Skeleton className="h-8 w-24 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Skeleton Loading - Vue liste desktop */}
                <div className="hidden lg:block space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <Card key={index} className="w-full min-w-0 box-border">
                      <CardHeader className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="min-w-0 flex-1">
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-20" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 pt-0 min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-36" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-full mt-3 pt-3" />
                        <Skeleton className="h-8 w-28 mt-3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : activeTab === "all" && paginatedList.length === 0 ? (
              <Card className="w-full box-border">
                <CardContent className="text-center py-6 sm:py-8">
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-muted-foreground">Aucune demande trouvée.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Vue grille pour mobile/tablette - cachée sur desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-3 md:gap-4 w-full min-w-0">
                  {activeTab === "all" && paginatedList.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow flex flex-col h-full w-full min-w-0 box-border">
                      <CardHeader className="pb-4 p-6 min-w-0">
                        <div className="flex items-start justify-between gap-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                              {getStatusIcon(request.status)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg truncate min-w-0">{request.request_code}</CardTitle>
                              <CardDescription className="text-xs line-clamp-2 mt-1.5 min-w-0">
                                {request.equipment?.name || 'N/A'} - {request.sensor?.name || 'N/A'}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                            {getLabel(priorityLabels, request.priority)}
                          </Badge>
                          <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                            {getLabel(statusLabels, request.status)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-xs text-muted-foreground truncate">Demandeur:</span>
                          <span className="text-xs truncate">{request.requester?.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between min-w-0">
                          <span className="text-xs text-muted-foreground truncate">Date:</span>
                          <span className="text-xs truncate whitespace-nowrap">
                            {new Date(request.created_at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        {request.description && (
                          <div className="pt-1">
                            <p className="text-xs text-muted-foreground line-clamp-2 min-w-0">{request.description}</p>
                          </div>
                        )}
                        <div className="pt-2">
                          <RequestDetailsModal request={request} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Vue liste pour desktop - cachée sur mobile/tablette */}
                <div className="hidden lg:block space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
                  {activeTab === "all" && paginatedList.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                          {/* Section 1 : Identité de la demande */}
                          <div className="flex items-start gap-3 sm:gap-4 flex-shrink-0">
                            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex-shrink-0">
                              <div className="text-blue-600">
                                {(request.status === "Approuvé" || request.status === "approved") ? (
                                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : getStatusIcon(request.status) ? (
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                    {getStatusIcon(request.status)}
                                  </div>
                                ) : (
                                  <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                )}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                                <CardTitle className="text-base sm:text-lg font-bold truncate min-w-0">
                                  {request.request_code}
                                </CardTitle>
                                <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                  {getLabel(priorityLabels, request.priority)}
                                </Badge>
                                <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                  {getLabel(statusLabels, request.status)}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground truncate">
                                  {request.equipment?.name || 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {request.sensor?.name || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Section 2 : Demandeur + infos */}
                          <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0 items-center sm:items-center">
                            <p className="text-sm font-semibold text-center truncate">
                              {request.requester?.full_name || 'N/A'}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground text-center whitespace-nowrap">
                              {new Date(request.created_at).toLocaleString("fr-FR", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {request.description && (
                              <p className="text-xs sm:text-sm text-muted-foreground text-center line-clamp-2 max-w-[300px]">
                                {request.description}
                              </p>
                            )}
                          </div>

                          {/* Section 3 : Action */}
                          <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto items-center sm:items-center">
                            <div className="mt-2 flex justify-end">
                              <RequestDetailsModal request={request} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {filteredRequests.length > 0 && totalPages > 1 && (
              <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full min-w-0 overflow-x-hidden">
                <Pagination>
                  <PaginationContent className="flex-wrap min-w-0">
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                          }
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                          }
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>
            
        )}

        

        {/* Autres onglets avec contenu similaire filtré */}
        <TabsContent value="mine" className="space-y-4 sm:space-y-6">
          {requestDemand.length === 0 ? (<Card className="w-full box-border">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Mes demandes</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Vos demandes de bypass
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <p className="text-sm sm:text-base text-muted-foreground text-center py-6 sm:py-8">
                  Aucune demande.
                </p>
              </CardContent>
            </Card>) : 
            (
              <>
                <Card className="w-full box-border">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <Filter className="w-4 h-4 sm:w-4 sm:h-4" />
                      Filtres
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 w-full min-w-0">
                    <div className="grid gap-3 sm:gap-3 md:gap-4 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 w-full min-w-0">
                      <div className="relative sm:col-span-2 lg:col-span-1 w-full min-w-0">
                        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 sm:pl-10 text-sm w-full"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="text-sm h-9 sm:h-10 w-full min-w-0">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="closed">Clôturé</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="text-sm h-9 sm:h-10 w-full min-w-0">
                          <SelectValue placeholder="Priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les priorités</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Faible</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="text-sm h-9 sm:h-10 w-full min-w-0">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les périodes</SelectItem>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="week">Cette semaine</SelectItem>
                          <SelectItem value="month">Ce mois</SelectItem>
                          <SelectItem value="custom">Personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setPriorityFilter("all")
                        setDateFilter("all")
                        setCustomDate(undefined)
                      }} className="text-sm h-9 sm:h-10 w-full sm:w-auto">
                        <span className="hidden sm:inline">Réinitialiser filtres</span>
                        <span className="sm:hidden">Réinitialiser</span>
                      </Button>
                    </div>
                    {/* Sélecteur de date personnalisée */}
                    {dateFilter === "custom" && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-2 max-w-xs">
                          <Label className="text-sm">Sélectionner une date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal text-sm ${
                                  !customDate && "text-muted-foreground"
                                }`}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {customDate ? (
                                  format(customDate, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionner une date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={customDate}
                                onSelect={setCustomDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contrôles de pagination et sélection du nombre d'éléments */}
                {filteredDemand.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-4 w-full min-w-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Éléments par page:</Label>
                        <Select 
                          value={itemsPerPage.toString()} 
                          onValueChange={(value) => setItemsPerPage(Number(value))}
                        >
                          <SelectTrigger className="w-16 sm:w-20 flex-shrink-0 h-8 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="9">9</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-left">
                      Affichage de {startIndex + 1} à {Math.min(endIndex, filteredDemand.length)} sur {filteredDemand.length} demande{filteredDemand.length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}

                {/* Requests list - Grille mobile/tablette / Liste desktop */}
                {isLoading() ? (
                  <>
                    {/* Skeleton Loading pour "Mes demandes" - Design selon image */}
                    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
                      {activeTab === "mine" && Array.from({ length: itemsPerPage }).map((_, index) => (
                        <Card key={index} className="w-full min-w-0 box-border">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                              {/* Section gauche */}
                              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                                    <Skeleton className="h-5 sm:h-6 w-32" />
                                    <Skeleton className="h-5 w-16" />
                                    <Skeleton className="h-5 w-20" />
                                  </div>
                                  <div className="space-y-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-48" />
                                  </div>
                                </div>
                              </div>
                              {/* Section droite */}
                              <div className="flex flex-col items-end gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-28" />
                                <Skeleton className="h-3 w-48" />
                                <Skeleton className="h-8 w-20 mt-2" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : activeTab === "mine" && paginatedList.length === 0 ? (
                  <Card className="w-full box-border">
                    <CardContent className="text-center py-6 sm:py-8">
                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm sm:text-base text-muted-foreground">Aucune demande trouvée.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Vue pour "Mes demandes" - Design selon image */}
                    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
                      {activeTab === "mine" && paginatedList.map((request) => (
                        <Card key={request.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                              {/* Section 1 : Gauche - Icône + Code + Badges */}
                              <div className="flex items-start gap-3 sm:gap-4 flex-shrink-0">
                                {/* Icône circulaire avec status */}
                                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex-shrink-0">
                                  <div className="text-blue-600">
                                    {(request.status === "Approuvé" || request.status === "approved") ? (
                                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                    ) : getStatusIcon(request.status) ? (
                                      <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                        {getStatusIcon(request.status)}
                                      </div>
                                    ) : (
                                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                    )}
                                  </div>
                                </div>
                                {/* Code de demande et badges */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                                    <CardTitle className="text-base sm:text-lg font-bold truncate min-w-0">
                                      {request.request_code}
                                    </CardTitle>
                                    <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                      {getLabel(priorityLabels, request.priority)}
                                    </Badge>
                                    <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                      {getLabel(statusLabels, request.status)}
                                    </Badge>
                                  </div>
                                  {/* Équipement et capteur sur deux lignes */}
                                  <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground truncate">
                                      {request.equipment?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {request.sensor?.name || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Section 2 : Centre - Demandeur + Date + Description */}
                              <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0 items-center sm:items-center">
                                <p className="text-sm font-semibold text-center truncate">
                                  {request.requester ? request.requester.full_name : 'Moi'}
                                </p>
                                {/* Date */}
                                <p className="text-xs sm:text-sm text-muted-foreground text-center whitespace-nowrap">
                                  {new Date(request.created_at).toLocaleString("fr-FR", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                                {/* Description */}
                                {request.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center line-clamp-2 max-w-[300px]">
                                    {request.description}
                                  </p>
                                )}
                              </div>
                              
                              {/* Section 3 : Droite - Bouton */}
                              <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto items-center sm:items-center">
                                {/* Bouton Voir */}
                                <div className="mt-2 flex justify-end">
                                  <RequestDetailsModal request={request} />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}

                {/* Pagination */}
                {filteredDemand.length > 0 && totalPages > 1 && (
                  <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full min-w-0 overflow-x-hidden">
                    <Pagination>
                      <PaginationContent className="flex-wrap min-w-0">
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage > 1) {
                                setCurrentPage(currentPage - 1);
                              }
                            }}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (currentPage < totalPages) {
                                setCurrentPage(currentPage + 1);
                              }
                            }}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
        </TabsContent>

        {(user?.role === "administrator" || user?.role === "supervisor") && (
          <>
            <TabsContent value="pending" className="space-y-4 sm:space-y-6">
              
              {requestApprobation.length === 0 ? (<Card className="w-full box-border">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">En attente d'approbation</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Demandes nécessitant une action
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-6 sm:py-8">
                    Aucune demande en attente d'approbation.
                  </p>
                </CardContent>
              </Card>) : 
              (
                <>
                  <Card className="w-full box-border">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Filter className="w-4 h-4 sm:w-4 sm:h-4" />
                        Filtres
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 w-full min-w-0">
                      <div className="grid gap-3 sm:gap-3 md:gap-4 lg:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 w-full min-w-0">
                      <div className="relative sm:col-span-2 lg:col-span-1 w-full min-w-0">
                        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 sm:pl-10 text-sm w-full"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="text-sm h-9 sm:h-10 w-full min-w-0">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="closed">Clôturé</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="text-sm h-9 sm:h-10 w-full min-w-0">
                          <SelectValue placeholder="Priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les priorités</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Faible</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="text-sm h-9 sm:h-10 w-full min-w-0">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les périodes</SelectItem>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="week">Cette semaine</SelectItem>
                          <SelectItem value="month">Ce mois</SelectItem>
                          <SelectItem value="custom">Personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setPriorityFilter("all")
                        setDateFilter("all")
                        setCustomDate(undefined)
                      }} className="text-sm h-9 sm:h-10 w-full sm:w-auto">
                        <span className="hidden sm:inline">Réinitialiser filtres</span>
                        <span className="sm:hidden">Réinitialiser</span>
                      </Button>
                      </div>
                      {/* Sélecteur de date personnalisée */}
                      {dateFilter === "custom" && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="space-y-2 max-w-xs">
                            <Label className="text-sm">Sélectionner une date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-left font-normal text-sm ${
                                    !customDate && "text-muted-foreground"
                                  }`}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {customDate ? (
                                    format(customDate, "PPP", { locale: fr })
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={customDate}
                                  onSelect={setCustomDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contrôles de pagination et sélection du nombre d'éléments */}
                  {filteredApprobation.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-4 w-full min-w-0">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Éléments par page:</Label>
                          <Select 
                            value={itemsPerPage.toString()} 
                            onValueChange={(value) => setItemsPerPage(Number(value))}
                          >
                            <SelectTrigger className="w-16 sm:w-20 flex-shrink-0 h-8 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-left">
                        Affichage de {startIndex + 1} à {Math.min(endIndex, filteredApprobation.length)} sur {filteredApprobation.length} demande{filteredApprobation.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  {/* Requests list - Grille mobile/tablette / Liste desktop */}
                  {isLoading() ? (
                    <>
                      {/* Skeleton Loading - Vue grille mobile/tablette */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-3 md:gap-4 w-full min-w-0">
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                          <Card key={index} className="flex flex-col h-full w-full min-w-0 box-border">
                            <CardHeader className="pb-4 p-6 min-w-0">
                              <div className="flex items-start justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <Skeleton className="w-6 h-6 rounded-full" />
                                  <div className="min-w-0 flex-1">
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-20" />
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-28" />
                              </div>
                              <Skeleton className="h-3 w-full mt-2" />
                              <Skeleton className="h-8 w-24 mt-2" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Skeleton Loading - Vue liste desktop */}
                      <div className="hidden lg:block space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                          <Card key={index} className="w-full min-w-0 box-border">
                            <CardHeader className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-3 min-w-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Skeleton className="w-8 h-8 rounded-full" />
                                  <div className="min-w-0 flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-48" />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-5 w-20" />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0 min-w-0">
                              <div className="flex items-center justify-between gap-3 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Skeleton className="h-3 w-20" />
                                  <Skeleton className="h-3 w-32" />
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Skeleton className="h-3 w-12" />
                                  <Skeleton className="h-3 w-36" />
                                </div>
                              </div>
                              <Skeleton className="h-3 w-full mt-3 pt-3" />
                              <Skeleton className="h-8 w-28 mt-3" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : activeTab === "pending" && paginatedList.length === 0 ? (
                    <Card className="w-full box-border">
                      <CardContent className="text-center py-6 sm:py-8">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground">Aucune demande trouvée.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Vue grille pour mobile/tablette - cachée sur desktop */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-3 md:gap-4 w-full min-w-0">
                        {activeTab === "pending" && paginatedList.map((request) => (
                          <Card key={request.id} className="hover:shadow-lg transition-shadow flex flex-col h-full w-full min-w-0 box-border">
                            <CardHeader className="pb-4 p-6 min-w-0">
                              <div className="flex items-start justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                                    {getStatusIcon(request.status)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <CardTitle className="text-lg truncate min-w-0">{request.request_code}</CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1.5 min-w-0">
                                      {request.equipment?.name || 'N/A'} - {request.sensor?.name || 'N/A'}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                  {getLabel(priorityLabels, request.priority)}
                                </Badge>
                                <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                  {getLabel(statusLabels, request.status)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                              <div className="flex items-center justify-between min-w-0">
                                <span className="text-xs text-muted-foreground truncate">Demandeur:</span>
                                <span className="text-xs truncate">{request.requester?.full_name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between min-w-0">
                                <span className="text-xs text-muted-foreground truncate">Date:</span>
                                <span className="text-xs truncate whitespace-nowrap">
                                  {new Date(request.created_at).toLocaleString("fr-FR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </div>
                              {request.description && (
                                <div className="pt-1">
                                  <p className="text-xs text-muted-foreground line-clamp-2 min-w-0">{request.description}</p>
                                </div>
                              )}
                              <div className="pt-2">
                                <RequestDetailsModal request={request} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Vue liste pour desktop - cachée sur mobile/tablette */}
                      <div className="hidden lg:block space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
                        {activeTab === "pending" && paginatedList.map((request) => (
                          <Card key={request.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                                {/* Section 1 */}
                                <div className="flex items-start gap-3 sm:gap-4 flex-shrink-0">
                                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex-shrink-0">
                                    <div className="text-blue-600">
                                      {(request.status === "Approuvé" || request.status === "approved") ? (
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                      ) : getStatusIcon(request.status) ? (
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                          {getStatusIcon(request.status)}
                                        </div>
                                      ) : (
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                                      <CardTitle className="text-base sm:text-lg font-bold truncate min-w-0">
                                        {request.request_code}
                                      </CardTitle>
                                      <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                        {getLabel(priorityLabels, request.priority)}
                                      </Badge>
                                      <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                        {getLabel(statusLabels, request.status)}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground truncate">
                                        {request.equipment?.name || 'N/A'}
                                      </p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {request.sensor?.name || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2 */}
                                <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0 items-center sm:items-center">
                                  <p className="text-sm font-semibold text-center truncate">
                                    {request.requester?.full_name || 'N/A'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center whitespace-nowrap">
                                    {new Date(request.created_at).toLocaleString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  {request.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground text-center line-clamp-2 max-w-[300px]">
                                      {request.description}
                                    </p>
                                  )}
                                </div>

                                {/* Section 3 */}
                                <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto items-center sm:items-center">
                                  <div className="mt-2 flex justify-end">
                                    <RequestDetailsModal request={request} />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Pagination */}
                  {filteredApprobation.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full min-w-0 overflow-x-hidden">
                      <Pagination>
                        <PaginationContent className="flex-wrap min-w-0">
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
                                }
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) {
                                  setCurrentPage(currentPage + 1);
                                }
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4 sm:space-y-6">
            {requestActifs.length === 0 ? (<Card className="w-full box-border">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-sm sm:text-base">Bypass actifs</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Demandes de bypass actuellement actives
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0">
                  <p className="text-sm sm:text-base text-muted-foreground text-center py-6 sm:py-8">
                    Aucun bypass actif.
                  </p>
                </CardContent>
              </Card>) : 
              (
                <>
                  <Card className="w-full box-border">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <Filter className="w-4 h-4 sm:w-4 sm:h-4" />
                        Filtres
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 w-full min-w-0">
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 w-full min-w-0">
                      <div className="relative sm:col-span-2 lg:col-span-1 w-full min-w-0">
                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 sm:pl-10 w-full text-sm"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="text-sm w-full min-w-0">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="approved">Approuvé</SelectItem>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="closed">Clôturé</SelectItem>
                          <SelectItem value="expired">Expiré</SelectItem>
                          <SelectItem value="rejected">Rejeté</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="text-sm w-full min-w-0">
                          <SelectValue placeholder="Priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les priorités</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="low">Faible</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="text-sm w-full min-w-0">
                          <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les périodes</SelectItem>
                          <SelectItem value="today">Aujourd'hui</SelectItem>
                          <SelectItem value="week">Cette semaine</SelectItem>
                          <SelectItem value="month">Ce mois</SelectItem>
                          <SelectItem value="custom">Personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => {
                        setSearchTerm("")
                        setStatusFilter("all")
                        setPriorityFilter("all")
                        setDateFilter("all")
                        setCustomDate(undefined)
                      }} className="text-sm w-full sm:w-auto min-w-0 truncate">
                        <span className="hidden sm:inline truncate">Réinitialiser filtres</span>
                        <span className="sm:hidden truncate">Réinitialiser</span>
                      </Button>
                      </div>
                      {/* Sélecteur de date personnalisée */}
                      {dateFilter === "custom" && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="space-y-2 max-w-xs">
                            <Label className="text-sm">Sélectionner une date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-left font-normal text-sm ${
                                    !customDate && "text-muted-foreground"
                                  }`}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {customDate ? (
                                    format(customDate, "PPP", { locale: fr })
                                  ) : (
                                    <span>Sélectionner une date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={customDate}
                                  onSelect={setCustomDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contrôles de pagination et sélection du nombre d'éléments */}
                  {filteredActifs.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-4 w-full min-w-0">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Éléments par page:</Label>
                          <Select 
                            value={itemsPerPage.toString()} 
                            onValueChange={(value) => setItemsPerPage(Number(value))}
                          >
                            <SelectTrigger className="w-16 sm:w-20 flex-shrink-0 h-8 text-xs sm:text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="15">15</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-left">
                        Affichage de {startIndex + 1} à {Math.min(endIndex, filteredActifs.length)} sur {filteredActifs.length} demande{filteredActifs.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  {/* Requests list - Grille mobile/tablette / Liste desktop */}
                  {isLoading() ? (
                    <>
                      {/* Skeleton Loading - Vue grille mobile/tablette */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-3 md:gap-4 w-full min-w-0">
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                          <Card key={index} className="flex flex-col h-full w-full min-w-0 box-border">
                            <CardHeader className="pb-4 p-6 min-w-0">
                              <div className="flex items-start justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <Skeleton className="w-6 h-6 rounded-full" />
                                  <div className="min-w-0 flex-1">
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                <Skeleton className="h-5 w-16" />
                                <Skeleton className="h-5 w-20" />
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-3 w-28" />
                              </div>
                              <Skeleton className="h-3 w-full mt-2" />
                              <Skeleton className="h-8 w-24 mt-2" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Skeleton Loading - Vue liste desktop */}
                      <div className="hidden lg:block space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
                        {Array.from({ length: itemsPerPage }).map((_, index) => (
                          <Card key={index} className="w-full min-w-0 box-border">
                            <CardHeader className="p-3 sm:p-4">
                              <div className="flex items-start justify-between gap-3 min-w-0">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <Skeleton className="w-8 h-8 rounded-full" />
                                  <div className="min-w-0 flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-48" />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Skeleton className="h-5 w-16" />
                                  <Skeleton className="h-5 w-20" />
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4 pt-0 min-w-0">
                              <div className="flex items-center justify-between gap-3 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Skeleton className="h-3 w-20" />
                                  <Skeleton className="h-3 w-32" />
                                </div>
                                <div className="flex items-center gap-2 min-w-0">
                                  <Skeleton className="h-3 w-12" />
                                  <Skeleton className="h-3 w-36" />
                                </div>
                              </div>
                              <Skeleton className="h-3 w-full mt-3 pt-3" />
                              <Skeleton className="h-8 w-28 mt-3" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : activeTab === "active" && paginatedList.length === 0 ? (
                    <Card className="w-full box-border">
                      <CardContent className="text-center py-6 sm:py-8">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-muted-foreground">Aucune demande trouvée.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Vue grille pour mobile/tablette - cachée sur desktop */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3 sm:gap-3 md:gap-4 w-full min-w-0">
                        {activeTab === "active" && paginatedList.map((request) => (
                          <Card key={request.id} className="hover:shadow-lg transition-shadow flex flex-col h-full w-full min-w-0 box-border">
                            <CardHeader className="pb-4 p-6 min-w-0">
                              <div className="flex items-start justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                                    {getStatusIcon(request.status)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <CardTitle className="text-lg truncate min-w-0">{request.request_code}</CardTitle>
                                    <CardDescription className="text-xs line-clamp-2 mt-1.5 min-w-0">
                                      {request.equipment?.name || 'N/A'} - {request.sensor?.name || 'N/A'}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                                <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                  {getLabel(priorityLabels, request.priority)}
                                </Badge>
                                <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                  {getLabel(statusLabels, request.status)}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                              <div className="flex items-center justify-between min-w-0">
                                <span className="text-xs text-muted-foreground truncate">Demandeur:</span>
                                <span className="text-xs truncate">{request.requester?.full_name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between min-w-0">
                                <span className="text-xs text-muted-foreground truncate">Date:</span>
                                <span className="text-xs truncate whitespace-nowrap">
                                  {new Date(request.created_at).toLocaleString("fr-FR", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </div>
                              {request.description && (
                                <div className="pt-1">
                                  <p className="text-xs text-muted-foreground line-clamp-2 min-w-0">{request.description}</p>
                                </div>
                              )}
                              <div className="pt-2">
                                <RequestDetailsModal request={request} />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Vue liste pour desktop - cachée sur mobile/tablette */}
                      <div className="hidden lg:block space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
                        {activeTab === "active" && paginatedList.map((request) => (
                          <Card key={request.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                                {/* Section 1 */}
                                <div className="flex items-start gap-3 sm:gap-4 flex-shrink-0">
                                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/15 flex-shrink-0">
                                    <div className="text-blue-600">
                                      {(request.status === "Approuvé" || request.status === "approved") ? (
                                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                      ) : getStatusIcon(request.status) ? (
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                                          {getStatusIcon(request.status)}
                                        </div>
                                      ) : (
                                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                                      <CardTitle className="text-base sm:text-lg font-bold truncate min-w-0">
                                        {request.request_code}
                                      </CardTitle>
                                      <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                        {getLabel(priorityLabels, request.priority)}
                                      </Badge>
                                      <Badge className={getStatusColor(request.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                                        {getLabel(statusLabels, request.status)}
                                      </Badge>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-muted-foreground truncate">
                                        {request.equipment?.name || 'N/A'}
                                      </p>
                                      <p className="text-sm text-muted-foreground truncate">
                                        {request.sensor?.name || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2 */}
                                <div className="flex flex-col gap-2 sm:gap-3 flex-1 min-w-0 items-center sm:items-center">
                                  <p className="text-sm font-semibold text-center truncate">
                                    {request.requester?.full_name || 'N/A'}
                                  </p>
                                  <p className="text-xs sm:text-sm text-muted-foreground text-center whitespace-nowrap">
                                    {new Date(request.created_at).toLocaleString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                  {request.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground text-center line-clamp-2 max-w-[300px]">
                                      {request.description}
                                    </p>
                                  )}
                                </div>

                                {/* Section 3 */}
                                <div className="flex flex-col gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto items-center sm:items-center">
                                  <div className="mt-2 flex justify-end">
                                    <RequestDetailsModal request={request} />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Pagination */}
                  {filteredActifs.length > 0 && totalPages > 1 && (
                    <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full min-w-0 overflow-x-hidden">
                      <Pagination>
                        <PaginationContent className="flex-wrap min-w-0">
                          <PaginationItem>
                            <PaginationPrevious 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
                                }
                              }}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext 
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage < totalPages) {
                                  setCurrentPage(currentPage + 1);
                                }
                              }}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </>
        )}
        
      </Tabs>
    </div>
  )
}