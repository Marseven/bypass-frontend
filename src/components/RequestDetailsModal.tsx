import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  Eye,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  Wrench,
  MapPin,
  FileText,
  CheckCircle,
  XCircle
} from "lucide-react"
import api from '../axios'
import { set, string } from "zod"
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom"
import { getLabel, statusLabels, priorityLabels } from '@/utils/statusLabels'



interface RequestDetailsModalProps {
  request: {
    id: string
    equipment: string
    sensor: string
    requester: string
    priority: string
    status: string
    date: string
    reason: string
  }
}

type validateData = "validation_status" | "rejection_reason";



export function RequestDetailsModal({ request }: RequestDetailsModalProps) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Record<validateData, string>>({
    validation_status: "approved",
    rejection_reason: "",
  });
  const navigate = useNavigate()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

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
  
  function getMaintenanceLabel(key: string): string {
    return reasonLabels[key] ?? key; // si pas trouvé, on retourne la clé brute
  }

  const acceptedRequest = (id: string, data : any) => {
    // Simulate API call
    try {
     api({
       method: 'put',
       url: `/requests/${id}/validate`,
       data: data
     })
     .then(data => {
       if (data) {
         toast.success("Demande de Bypass Soumis avec Succes");
         navigate('/requests/mine')
       } else {
         toast.error("Probleme de connexion");
       }
     })
     setRejectModalOpen(!rejectModalOpen)
     setAcceptModalOpen(!acceptModalOpen)
     setOpen(!open)
   } catch (error) {
     console.error('Erreur lors de la soumission:', error);
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

  const diffInHours = (date1: string | Date, date2: string | Date) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
  
    // difference in milliseconds
    const diffMs = d1.getTime() - d2.getTime();
  
    // convert ms → hours
    return diffMs / (1000 * 60 * 60);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Voir
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Détails de la demande {request.request_code}
            </DialogTitle>
            <DialogDescription>
              Informations complètes de la demande de bypass
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Statut et priorité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <Badge className={getStatusColor(request.status)}>
                      {getLabel(statusLabels, request.status)}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={getPriorityColor(request.priority)}>
                    Priorité {getLabel(priorityLabels, request.priority)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Request Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      Demandeur
                    </div>
                    <p className="font-medium">{request.requester ? request.requester.full_name : 'Moi'}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Date de demande
                    </div>
                    <p className="font-medium">
                    {new Date(request.created_at).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wrench className="w-4 h-4" />
                    Raison du bypass
                  </div>
                  <p className="font-medium">{ getMaintenanceLabel(request.title)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Equipment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Équipement et capteur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Équipement</div>
                    <p className="font-medium">{request.equipment.name}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Capteur concerné</div>
                    <p className="font-medium">{request.sensor.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Détails supplémentaires</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Durée estimée</div>
                    <p className="font-medium">{ diffInHours(request.end_time, request.start_time) } heures</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Zone</div>
                    <p className="font-medium">{ request.equipment.zone.name }</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Date de début prévue</div>
                    <p className="font-medium">{new Date(request.start_time).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Date de fin prévue</div>
                    <p className="font-medium">
                    {new Date(request.end_time).toLocaleString("fr-FR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Justification détaillée</div>
                  <p className="text-sm bg-muted/50 p-3 rounded">
                    { request.description }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fermer
              </Button>
              {(request.status === "pending" && (request.requester.role === 'administrator' ||  request.requester.role === 'supervisor')) && (
                <>
                  <Button variant="destructive" onClick={ () => {setRejectModalOpen(!rejectModalOpen)}}>
                    Rejeter
                  </Button>
                  <Button onClick={ () => {setAcceptModalOpen(!acceptModalOpen) } }>
                    Approuver
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raison du rejet</DialogTitle>
          <DialogDescription>
            Merci de saisir une justification avant de rejeter la demande.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Expliquez la raison du rejet... Ecrire (RAS) au cas contraire"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              acceptedRequest(request.id, { 
                validation_status: "rejected", 
                rejection_reason: rejectionReason 
              })
              setRejectModalOpen(false)
              setOpen(false)
            }}
            disabled={!rejectionReason.trim()}
          >
            Confirmer le rejet
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raison de la validation</DialogTitle>
          <DialogDescription>
            Merci de saisir une justification avant d'Accepter la demande.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Expliquez la raison du rejet... Ecrire (RAS) au cas contraire"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
            Annuler
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              acceptedRequest(request.id, { 
                validation_status: "approved", 
                rejection_reason: rejectionReason 
              })
              setRejectModalOpen(false)
              setOpen(false)
            }}
            disabled={!rejectionReason.trim()}
          >
            Confirmer la validation
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
    
  )
}