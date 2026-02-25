import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { 
  History as HistoryIcon,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Filter, 
  Plus,
  FileText,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import api from '../axios'
import { useIsMobile } from "@/hooks/use-mobile"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"


export default function History() {

  const location = useLocation()
  const isMobile = useIsMobile()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [requestList, setRequestList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) // Fin de la journée
        };
      case "week":
        // Semaine commence le lundi (jour 1)
        const startOfWeek = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si dimanche, revenir 6 jours en arrière
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

  const filteredHistory = (requestList ?? []).filter(item => {
    const matchesSearch = item.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sensor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.request_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    
    // Filtrage par période
    let matchesDate = true;
    if (dateFilter !== "all") {
      const dateRange = getDateRange(dateFilter);
      if (dateRange && item.created_at) {
        const itemDate = new Date(item.created_at);
        matchesDate = itemDate >= dateRange.start && itemDate <= dateRange.end;
      } else if (dateFilter === "custom" && !customDate) {
        // Si le filtre personnalisé est sélectionné mais la date n'est pas sélectionnée, ne pas filtrer
        matchesDate = true;
      } else {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres ou le nombre d'éléments par page changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, customDate, itemsPerPage]);

  // Réinitialiser la date personnalisée quand le filtre change
  useEffect(() => {
    if (dateFilter !== "custom") {
      setCustomDate(undefined);
    }
  }, [dateFilter]);

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
      case "En attente": return "bg-warning text-warning-foreground"
      case "pending": return "bg-warning text-warning-foreground"
      case "Approuvé": return "bg-success text-success-foreground"
      case "approved": return "bg-success text-success-foreground"
      case "En cours": return "bg-primary text-primary-foreground"
      case "in_progress": return "bg-primary text-primary-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "En attente": return <Clock className="w-4 h-4" />
      case "pending": return <Clock className="w-4 h-4" />
      case "Approuvé": return <CheckCircle className="w-4 h-4" />
      case "approved": return <CheckCircle className="w-4 h-4" />
      case "En cours": return <AlertTriangle className="w-4 h-4" />
      case "in_progress": return <AlertTriangle className="w-4 h-4" />
      case "Rejeté": return <XCircle className="w-4 h-4" />
      case "rejected": return <XCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Approbateur N2'
      case 'supervisor': return 'Approbateur N1'
      case 'user': return 'Demandeur'
      case 'administrator': return 'Administrateur'
      default: return role || ''
    }
  }


  useEffect(() => {
    setIsLoading(true);
    api.get('/dashboard/recent-requests')
    .then(response => {
      // Handle successful response
      console.log(response.data); // The fetched data is typically in response.data
      setRequestList(response.data);
      setIsLoading(false);
    })
    .catch(error => {
      // Handle error
      console.error('Error fetching data:', error);
      setIsLoading(false);
    });
    

  }, [location.key])

  const diffInHours = (date1: string | Date, date2: string | Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
  
    // difference in milliseconds
    const diffMs = d1.getTime() - d2.getTime();
  
    // convert ms → hours
    return diffMs / (1000 * 60 * 60);
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <HistoryIcon className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Historique des demandes</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Journal d'audit et historique des validations</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Historique</BreadcrumbPage>
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

      {/* Bouton exporter */}
      <div className="flex justify-end">
        <Button variant="outline" size={isMobile ? "sm" : "default"} className="gap-2">
          <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
      </div>

      {/* Filters */}
      <Card>
          {/* <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            Filtres de recherche
          </CardTitle>
        </CardHeader> */}
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full text-sm sm:text-base"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full text-sm sm:text-base">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full text-sm sm:text-base">
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
            <Button 
              variant="outline" 
              onClick={()=>{
              setSearchTerm("")
              setStatusFilter("all")
              setDateFilter("all")
              setCustomDate(undefined)
              }} 
              className="w-full sm:w-auto text-sm sm:text-base"
              size={isMobile ? "sm" : "default"}
            >
              Réinitialiser
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
                      className={`w-full justify-start text-left font-normal text-sm sm:text-base ${
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
      {!isLoading && filteredHistory.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap">Éléments par page:</Label>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-16 sm:w-20 md:w-24 text-sm">
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
          <div className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right w-full sm:w-auto">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredHistory.length)} sur {filteredHistory.length} demande{filteredHistory.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* History list */}
      {isLoading ? (
        <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
          <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                  <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                      {/* Section 1 : Gauche - Skeleton */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-3 w-40 mb-1" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                      </div>
                      {/* Section 2 : Centre - Skeleton */}
                      <div className="flex flex-row gap-3 sm:gap-4 flex-1 min-w-0 items-center sm:items-center justify-between flex-wrap">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    {/* Ligne du bas - Skeleton */}
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Separator className="my-1" />
                      <div className="flex flex-row justify-between items-center gap-4">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedHistory.length === 0 ? (
        <Card className="w-full box-border">
          <CardContent className="text-center py-6 sm:py-8">
            <HistoryIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-sm sm:text-base font-semibold mb-2">
                    {requestList.length === 0 ? 'Aucune demande' : 'Aucun résultat'}
                  </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
                    {requestList.length === 0 
                      ? 'Aucune demande dans l\'historique.'
                      : 'Aucune demande ne correspond à vos critères de recherche.'
                    }
                  </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
          {paginatedHistory.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                    {/* Section 1 : Gauche - Icône + Code + Badges + Equipement/Capteur */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Icône circulaire avec status */}
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex-shrink-0">
                        <div className="text-blue-600">
                          {(item.status === "Approuvé" || item.status === "approved") ? (
                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                          ) : getStatusIcon(item.status) ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6">
                              {getStatusIcon(item.status)}
                </div>
              ) : (
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                        </div>
                      </div>
                      {/* Code de demande et badges */}
                        <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap mb-2">
                          <CardTitle className="text-base sm:text-lg font-bold truncate min-w-0">
                            {item.request_code}
                          </CardTitle>
                          <Badge className={getStatusColor(item.status) + " text-xs whitespace-nowrap flex-shrink-0"}>
                            {item.status}
                            </Badge>
                          </div>
                        {/* Équipement et capteur sur deux lignes */}
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {item.equipment?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.sensor?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2 : Centre - Date demande + Date validation */}
                    <div className="flex flex-row gap-3 sm:gap-4 flex-1 min-w-0 items-center sm:items-center justify-between flex-wrap">
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        Demande: {new Date(item.created_at).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                            })}
                        </p>
                      {item.validated_at && (
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          Validation: {new Date(item.validated_at).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Ligne du bas : Demandeur puis Validateur et Durée sur la même ligne */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-left">
                      {item.requester?.role && getRoleLabel(item.requester.role) && (
                        <span className="text-muted-foreground font-normal">{getRoleLabel(item.requester.role)}: </span>
                      )}
                      {item.requester?.full_name || 'N/A'}
                    </p>
                    <Separator className="my-1" />
                    <div className="flex flex-row justify-between items-center gap-4">
                      {item.validator?.full_name && (
                        <p className="text-xs sm:text-sm text-muted-foreground text-left">
                          {item.validator?.role && getRoleLabel(item.validator.role) && (
                            <span>{getRoleLabel(item.validator.role)}: </span>
                          )}
                          {item.validator.full_name}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap text-right ml-auto">
                        Durée: {Math.round(diffInHours(item.end_time, item.start_time))} Heure{Math.round(diffInHours(item.end_time, item.start_time)) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
            </div>
          </CardContent>
        </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredHistory.length > 0 && totalPages > 1 && (
        <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full">
          <Pagination>
            <PaginationContent className="flex-wrap gap-1 sm:gap-2">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Sur mobile, afficher seulement la page actuelle et les pages adjacentes
                  if (isMobile) {
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  }
                  return true;
                })
                .map((page, index, array) => {
                  // Ajouter des ellipses sur mobile si nécessaire
                  if (isMobile && index > 0 && page - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <PaginationItem>
                          <span className="px-2 text-muted-foreground">...</span>
                        </PaginationItem>
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer text-xs sm:text-sm"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  }
                  return (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                        className="cursor-pointer text-xs sm:text-sm min-w-[2rem] sm:min-w-[2.5rem]"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
                  );
                })}
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
    </div>
  );
}