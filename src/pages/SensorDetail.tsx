import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Radio, Activity } from "lucide-react";
import api from "../axios";

interface BypassHistoryItem {
  id: number;
  bypass_code: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  requester_name: string | null;
  created_at: string;
}

interface SensorData {
  id: number;
  code: string;
  name: string;
  type: string;
  unite: string;
  seuil_critique: string | number | null;
  status: string;
  last_reading: number | null;
  last_reading_at: string | null;
  Dernier_Etallonnage: string | null;
  equipment: {
    id: number;
    name: string;
    code: string;
    zone?: { name: string } | null;
  } | null;
  bypass_history: BypassHistoryItem[];
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return <Badge className="bg-green-600 text-white text-xs font-bold">ACTIF</Badge>;
    case "bypassed":
      return <Badge className="bg-orange-500 text-white text-xs font-bold">BYPASS</Badge>;
    case "maintenance":
      return <Badge className="bg-yellow-500 text-white text-xs font-bold">MAINTENANCE</Badge>;
    case "faulty":
      return <Badge className="bg-red-600 text-white text-xs font-bold">DÉFAUT</Badge>;
    case "calibration":
      return <Badge className="bg-blue-500 text-white text-xs font-bold">CALIBRATION</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function getRequestStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "approved":
      return <Badge className="bg-green-600 text-white text-xs font-bold">APPROUVÉ</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500 text-white text-xs font-bold">EN ATTENTE</Badge>;
    case "rejected":
      return <Badge className="bg-red-600 text-white text-xs font-bold">REJETÉ</Badge>;
    case "expired":
      return <Badge className="bg-orange-500 text-white text-xs font-bold">EXPIRÉ</Badge>;
    case "closed":
      return <Badge className="bg-gray-600 text-white text-xs font-bold">CLÔTURÉ</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SensorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sensor, setSensor] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/sensors/${id}`)
      .then((response) => {
        const data = response.data?.data || response.data;
        setSensor(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.response?.status === 404 ? "Capteur introuvable" : "Erreur lors du chargement");
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="w-full p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !sensor) {
    return (
      <div className="w-full p-4 md:p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/sensors")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Radio className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>{error || "Capteur introuvable"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const bypassHistory = sensor.bypass_history || [];

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/sensors")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste
        </Button>
      </div>

      {/* Sensor Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="w-5 h-5" />
              {sensor.code}
            </CardTitle>
            {getStatusBadge(sensor.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{sensor.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{sensor.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Unité</p>
              <p className="font-medium">{sensor.unite || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Seuil critique</p>
              <p className="font-medium">{sensor.seuil_critique != null ? `${sensor.seuil_critique} ${sensor.unite || ""}` : "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Équipement</p>
              <p className="font-medium">{sensor.equipment?.name || "—"}</p>
              {sensor.equipment?.zone?.name && (
                <p className="text-xs text-muted-foreground">{sensor.equipment.zone.name}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dernier étalonnage</p>
              <p className="font-medium">{formatDate(sensor.Dernier_Etallonnage)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bypass History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            Historique des bypass ({bypassHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bypassHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucun bypass enregistré pour ce capteur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Code</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Début</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Fin</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Motif</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Demandeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bypassHistory.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm font-semibold text-primary">{item.bypass_code || "—"}</TableCell>
                      <TableCell>{getRequestStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-sm">{formatDate(item.start_time)}</TableCell>
                      <TableCell className="text-sm">{formatDate(item.end_time)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{item.reason || "—"}</TableCell>
                      <TableCell className="text-sm">{item.requester_name || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
