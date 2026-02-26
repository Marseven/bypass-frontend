import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CheckCircle,
  XCircle,
  User,
  FileText,
} from "lucide-react"

import { useLocation, Link } from "react-router-dom"
import api from '../axios'
import { useState, useEffect } from "react"
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

type BypassReason = 'preventive_maintenance' | 'corrective_maintenance' | 'calibration' | 'testing' | 'emergency_repair' | 'system_upgrade' | 'investigation' | 'other';

export default function Validation() {
  const location = useLocation()
  const [requestApprobation, setRequestApprobation] = useState<any[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const { user } = useAuthStore();

  const requiresDualValidation = (priority: string) => priority === 'critical' || priority === 'emergency';

  const canValidateLevel1 = () => ['chef_de_quart', 'responsable_hse', 'resp_exploitation', 'directeur', 'administrateur', 'supervisor', 'administrator', 'director'].includes(user?.role || '');
  const canValidateLevel2 = () => ['resp_exploitation', 'directeur', 'administrateur', 'administrator', 'director'].includes(user?.role || '');

  const getValidationLevel = (request: any) => {
    if (!requiresDualValidation(request.priority)) {
      return canValidateLevel1() ? 1 : null;
    }
    if (request.validation_status_level1 === 'pending' && canValidateLevel1()) return 1;
    if (request.validation_status_level1 === 'approved' && request.validation_status_level2 === 'pending' && canValidateLevel2()) return 2;
    return null;
  };

  const setRejectionReason = (requestId: string, reason: string) => {
    setRejectionReasons(prev => ({ ...prev, [requestId]: reason }));
  };
  const getRejectionReason = (requestId: string) => rejectionReasons[requestId] || '';

  const reasonLabels: Record<BypassReason, string> = {
    preventive_maintenance: 'Maintenance préventive',
    corrective_maintenance: 'Maintenance corrective',
    calibration: 'Étalonnage',
    testing: 'Tests',
    emergency_repair: 'Réparation d\'urgence',
    system_upgrade: 'Mise à niveau système',
    investigation: 'Investigation',
    other: 'Autre'
  };
  const getMaintenanceLabel = (key: string): string => reasonLabels[key as BypassReason] ?? key;

  const acceptedRequest = (id: string, data: any, reason: string = '', request?: any) => {
    try {
      const validationStatus = data.validation_status || 'approved';
      const rejectionReason = reason || data.rejection_reason || '';

      if (validationStatus === 'rejected' && rejectionReason === '') {
        toast.error("Veuillez entrer un motif de rejet");
        return;
      }

      if (request) {
        const level = getValidationLevel(request);
        if (level === null) { toast.error("Vous n'êtes pas autorisé à valider cette demande"); return; }
        if (requiresDualValidation(request.priority) && level === 2 && request.validation_status_level1 !== 'approved') {
          toast.error("La validation niveau 1 doit être approuvée d'abord"); return;
        }
      }

      const requestData: any = { ...data };
      requestData.rejection_reason = validationStatus === 'rejected' ? rejectionReason : null;

      api.put(`/requests/${id}/validate`, requestData)
        .then(response => {
          if (response.data) {
            toast.success(validationStatus === 'approved' ? "Demande approuvée" : "Demande rejetée");
            setRejectionReason(id, '');
            window.location.reload();
          }
        })
        .catch(error => {
          toast.error(error.response?.data?.message || "Erreur lors de la validation");
        });
    } catch (error) {
      toast.error("Une erreur est survenue");
    }
  }

  const getRiskBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return <Badge className="bg-red-600 text-white text-xs font-bold uppercase">Critique</Badge>
      case 'high': return <Badge className="bg-orange-500 text-white text-xs font-bold uppercase">Majeur</Badge>
      case 'medium': return <Badge className="bg-yellow-500 text-white text-xs font-bold uppercase">Moyen</Badge>
      case 'low': case 'normal': return <Badge className="bg-gray-400 text-white text-xs font-bold uppercase">Mineur</Badge>
      default: return <Badge variant="outline" className="text-xs uppercase">{priority}</Badge>
    }
  }

  const getValidationLevelLabel = (request: any) => {
    if (requiresDualValidation(request.priority)) {
      if (request.validation_status_level1 === 'pending') return 'Ingénieur Sécurité';
      if (request.validation_status_level1 === 'approved' && request.validation_status_level2 === 'pending') return 'Directeur';
      return 'Complète';
    }
    return 'Chef de quart';
  }

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    api.get('/requests/pending')
      .then(response => {
        const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
        setRequestApprobation(data);
      })
      .catch((error: any) => {
        setError(error.response?.data?.message || 'Erreur de chargement');
        setRequestApprobation([]);
      })
      .finally(() => setIsLoading(false));
  }, [location.key, user])

  const filteredRequests = requestApprobation.filter(req => {
    const matchRisk = riskFilter === 'all' || req.priority?.toLowerCase() === riskFilter;
    return matchRisk;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [itemsPerPage, riskFilter]);

  const criticalCount = requestApprobation.filter(r => r.priority?.toLowerCase() === 'critical').length;

  const stats = [
    { title: "Demandes en attente", value: requestApprobation.length, subtitle: `${requestApprobation.length > 0 ? 'Nouvelles depuis 1h' : 'Aucune demande'}` },
    { title: "Risque Critique (SIL 3)", value: criticalCount, subtitle: "Validation Ing. requise" },
    { title: "Délai dépassé (> 2h)", value: 0, subtitle: "En attente d'action rapide" },
    { title: "Approuvés aujourd'hui", value: '-', subtitle: "Sur les demandes traitées" },
  ]

  const getTimeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approbations</h1>
          <p className="text-sm text-muted-foreground">
            Aperçu et gestion des demandes d'inhibition de capteurs en attente.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/requests/new" className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Nouveau Bypass
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">
              Liste des demandes ({filteredRequests.length})
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" className="h-8 text-xs"
                onClick={() => setStatusFilter('all')}>
                Statut: En attente
              </Button>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Risque: Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Risque: Tous</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Majeur</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="low">Mineur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">{error}</p>
              <Button size="sm" onClick={() => window.location.reload()}>Réessayer</Button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Demandeur</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Tag & Zone</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Motif & Durée</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Risque</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Validation requise</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{request.requester?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{getTimeSince(request.created_at)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-mono font-semibold text-primary text-sm">
                            {request.sensor?.code || request.request_code}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {request.equipment?.zone?.name ? `${request.equipment.zone.name} - ` : ''}{request.equipment?.name || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{getMaintenanceLabel(request.title)}</p>
                          <p className="text-xs text-muted-foreground">
                            Durée: {request.estimated_duration ? `${request.estimated_duration} heures` : 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(request.priority)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium">
                          {getValidationLevelLabel(request)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getValidationLevel(request) !== null ? (
                            <>
                              <Button variant="outline" size="sm" className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => { setSelectedRequest(request); setIsDialogOpen(true); }}>
                                Refuser
                              </Button>
                              <Button size="sm" className="h-8 text-xs"
                                onClick={() => acceptedRequest(request.id, { validation_status: "approved" }, '', request)}>
                                Approuver
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Non autorisé</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                    isActive={currentPage === page} className="cursor-pointer">
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Rejection Dialog */}
      {selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setSelectedRequest(null); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Rejeter la demande {selectedRequest.request_code}</DialogTitle>
              <DialogDescription>
                {selectedRequest.requester?.full_name} - {selectedRequest.equipment?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-1">Capteur</p>
                  <p className="font-mono font-semibold text-primary">{selectedRequest.sensor?.code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-1">Risque</p>
                  {getRiskBadge(selectedRequest.priority)}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-1">Motif</p>
                  <p>{getMaintenanceLabel(selectedRequest.title)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-1">Durée</p>
                  <p>{selectedRequest.estimated_duration ? `${selectedRequest.estimated_duration}h` : 'N/A'}</p>
                </div>
              </div>

              {selectedRequest.description && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase mb-1">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.description}</p>
                </div>
              )}

              {requiresDualValidation(selectedRequest.priority) && (
                <div className="p-3 bg-muted/30 rounded-lg border text-sm">
                  <p className="font-medium mb-2">Validation double requise</p>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Niveau 1: </span>
                      <Badge variant="outline" className="text-xs">
                        {selectedRequest.validation_status_level1 === 'approved' ? 'Approuvé' : 'En attente'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Niveau 2: </span>
                      <Badge variant="outline" className="text-xs">
                        {selectedRequest.validation_status_level2 === 'approved' ? 'Approuvé' : 'En attente'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase text-muted-foreground">
                  Motif du rejet *
                </Label>
                <Textarea
                  className="min-h-[100px]"
                  placeholder="Indiquez la raison du rejet..."
                  value={getRejectionReason(selectedRequest.id)}
                  onChange={(e) => setRejectionReason(selectedRequest.id, e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); setSelectedRequest(null); }}>
                Annuler
              </Button>
              <Button variant="destructive"
                onClick={() => {
                  acceptedRequest(selectedRequest.id, { validation_status: "rejected" }, getRejectionReason(selectedRequest.id), selectedRequest);
                  setIsDialogOpen(false);
                  setSelectedRequest(null);
                }}>
                <XCircle className="w-4 h-4 mr-2" />
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
