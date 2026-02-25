import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  TrendingUp,
  Shield,
  ArrowRight,
  BarChart3,
  Download,
  Filter,
  MoreVertical,
  Eye,
  Timer
} from "lucide-react"
import { BypassExpirationBar } from "@/components/dashboard/BypassExpirationBar"
import { useState, useEffect } from 'react';
import api from '../axios'
import { Link } from "react-router-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { exportToCSV } from '../utils/exportData'

export default function Dashboard() {
  const [summary, setSummary] = useState({ active_requests: 0, pending_validation: 0, approved_today: 0, connected_users: 0 })
  const [activeRequests, setActiveRequests] = useState<any[]>([])
  const [isLoadingActive, setIsLoadingActive] = useState(true)
  const [zoneFilter, setZoneFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [zones, setZones] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoadingChart, setIsLoadingChart] = useState(true)
  const [chartFilter, setChartFilter] = useState<'day' | 'month' | 'year'>('day')
  const [sensorsData, setSensorsData] = useState<any[]>([])
  const [isLoadingSensors, setIsLoadingSensors] = useState(true)
  const [systemStatus, setSystemStatus] = useState({ monitored_equipment: 0, online_sensors: 0, active_alerts: 0, system_performance: 0 })

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(response => setSummary(response.data))
      .catch(error => console.error('Error fetching summary:', error));

    api.get('/requests?status=approved')
      .then(response => {
        const data = response.data?.data || response.data || [];
        setActiveRequests(Array.isArray(data) ? data : []);
        setIsLoadingActive(false);
      })
      .catch(() => setIsLoadingActive(false));

    api.get('/zones')
      .then(response => {
        const data = response.data?.data || [];
        setZones(data);
      })
      .catch(() => {});

    api.get('/dashboard/system-status')
      .then(response => setSystemStatus(response.data))
      .catch(() => {});

    fetchChartData('day');
    fetchTopSensors();
  }, [])

  const fetchChartData = (filter: 'day' | 'month' | 'year') => {
    setIsLoadingChart(true);
    const days = filter === 'day' ? 30 : filter === 'month' ? 365 : 1095;
    api.get(`/dashboard/request-statistics?days=${days}`)
      .then(response => {
        let formattedData;
        if (filter === 'day') {
          formattedData = response.data.slice(-30).map((item: any) => ({
            date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            totales: item.total, validées: item.approved, rejetées: item.rejected
          }));
        } else if (filter === 'month') {
          const monthly: Record<string, any> = {};
          response.data.forEach((item: any) => {
            const d = new Date(item.date);
            const key = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            const sort = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!monthly[key]) monthly[key] = { totales: 0, validées: 0, rejetées: 0, sort };
            monthly[key].totales += item.total;
            monthly[key].validées += item.approved;
            monthly[key].rejetées += item.rejected;
          });
          formattedData = Object.entries(monthly)
            .sort((a, b) => a[1].sort.localeCompare(b[1].sort))
            .slice(-12)
            .map(([date, data]) => ({ date: date.charAt(0).toUpperCase() + date.slice(1), ...data }));
        } else {
          const yearly: Record<string, any> = {};
          response.data.forEach((item: any) => {
            const y = new Date(item.date).getFullYear().toString();
            if (!yearly[y]) yearly[y] = { totales: 0, validées: 0, rejetées: 0 };
            yearly[y].totales += item.total;
            yearly[y].validées += item.approved;
            yearly[y].rejetées += item.rejected;
          });
          formattedData = Object.entries(yearly).sort((a, b) => a[0].localeCompare(b[0])).map(([date, data]) => ({ date, ...data }));
        }
        setChartData(formattedData);
        setIsLoadingChart(false);
      })
      .catch(() => setIsLoadingChart(false));
  }

  const fetchTopSensors = () => {
    setIsLoadingSensors(true);
    api.get('/dashboard/top-sensors')
      .then(response => {
        setSensorsData(response.data.sort((a: any, b: any) => b.request_count - a.request_count).map((item: any) => ({
          name: item.sensor_name.length > 15 ? item.sensor_name.substring(0, 15) + '...' : item.sensor_name,
          fullName: item.sensor_name, equipment: item.equipment_name, demandes: item.request_count
        })));
        setIsLoadingSensors(false);
      })
      .catch(() => setIsLoadingSensors(false));
  }

  const handleFilterChange = (filter: 'day' | 'month' | 'year') => {
    setChartFilter(filter);
    fetchChartData(filter);
  }

  const getRiskBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': case 'critique':
        return <Badge className="bg-red-600 text-white hover:bg-red-700 text-xs font-bold uppercase">Critique</Badge>
      case 'high': case 'haute': case 'majeur':
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600 text-xs font-bold uppercase">Majeur</Badge>
      case 'medium': case 'moyenne':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600 text-xs font-bold uppercase">Moyen</Badge>
      case 'low': case 'normal': case 'faible':
        return <Badge className="bg-gray-400 text-white hover:bg-gray-500 text-xs font-bold uppercase">Mineur</Badge>
      default:
        return <Badge variant="outline" className="text-xs uppercase">{priority}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': case 'actif':
        return <Badge className="bg-green-600 text-white text-xs font-bold">ACTIF</Badge>
      case 'approved':
        return <Badge className="bg-blue-500 text-white text-xs font-bold">APPROUVÉ</Badge>
      case 'pending': case 'en attente':
        return <Badge className="bg-yellow-500 text-white text-xs font-bold">EN ATTENTE</Badge>
      case 'draft':
        return <Badge className="bg-gray-400 text-white text-xs font-bold">BROUILLON</Badge>
      case 'closed':
        return <Badge className="bg-gray-600 text-white text-xs font-bold">CLÔTURÉ</Badge>
      case 'expired':
        return <Badge className="bg-orange-500 text-white text-xs font-bold">EXPIRÉ</Badge>
      case 'rejected':
        return <Badge className="bg-red-600 text-white text-xs font-bold">REJETÉ</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  }

  const filteredActiveRequests = activeRequests.filter(req => {
    const matchZone = zoneFilter === 'all' || req.equipment?.zone?.name === zoneFilter;
    const matchRisk = riskFilter === 'all' ||
      (riskFilter === 'critical_major' && ['critical', 'high'].includes(req.priority?.toLowerCase()));
    return matchZone && matchRisk;
  })

  const stats = [
    {
      title: "Bypass Actifs",
      value: summary.active_requests,
      subtitle: `${summary.active_requests > 0 ? 'Interventions en cours' : 'Aucune intervention'}`,
      icon: Activity,
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      title: "Risque Critique (SIL 3)",
      value: activeRequests.filter(r => r.priority?.toLowerCase() === 'critical').length,
      subtitle: "Surveillance renforcée",
      icon: AlertTriangle,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    {
      title: "En attente d'approbation",
      value: summary.pending_validation,
      subtitle: "Validation requise",
      icon: Clock,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600"
    },
    {
      title: "Approuvés aujourd'hui",
      value: summary.approved_today,
      subtitle: "Validations effectuées",
      icon: CheckCircle,
      iconBg: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      title: "Expirant < 4h",
      value: activeRequests.filter(r => {
        if (!r.end_time) return false;
        const remaining = new Date(r.end_time).getTime() - Date.now();
        return remaining > 0 && remaining < 4 * 3600000;
      }).length,
      subtitle: "Attention requise",
      icon: Timer,
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    }
  ]

  return (
    <div className="w-full p-4 md:p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Bypass</h1>
          <p className="text-sm text-muted-foreground">
            Aperçu en temps réel des inhibitions de capteurs sur le site.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Interventions Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Interventions en cours</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-[160px] h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Zone: Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Zone: Toutes</SelectItem>
                  {zones.map((zone: any) => (
                    <SelectItem key={zone.id || zone.name} value={zone.name}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[200px] h-9 text-sm">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Risque: Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Risque: Tous</SelectItem>
                  <SelectItem value="critical_major">Critique & Majeur</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-9 text-sm"
                onClick={() => exportToCSV(filteredActiveRequests.map(r => ({
                  Code: r.request_code, Equipement: r.equipment?.name, Capteur: r.sensor?.name,
                  Priorité: r.priority, Statut: r.status
                })), 'interventions-actives')}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingActive ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredActiveRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucune intervention active</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Tag Capteur & Zone</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Motif du bypass</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Niveau de risque</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Statut</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Expiration</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <Link to={`/requests`} className="font-mono font-semibold text-primary hover:underline">
                            {request.sensor?.code || request.request_code}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {request.equipment?.zone?.name ? `${request.equipment.zone.name} - ` : ''}{request.equipment?.name || 'N/A'}
                          </p>
                          {request.sensor?.name && (
                            <p className="text-xs text-muted-foreground">({request.sensor.name})</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{request.reason || request.detailed_justification || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Req. par {request.requester?.full_name || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(request.priority)}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.start_time && request.end_time ? (
                          <BypassExpirationBar startTime={request.start_time} endTime={request.end_time} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link to="/requests">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Statistics Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4" />
                  Statistiques des demandes
                </CardTitle>
                <CardDescription className="text-xs">
                  {chartFilter === 'day' && '30 derniers jours'}
                  {chartFilter === 'month' && 'Par mois'}
                  {chartFilter === 'year' && 'Par année'}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                {(['day', 'month', 'year'] as const).map(f => (
                  <Button key={f} variant={chartFilter === f ? 'default' : 'outline'} size="sm"
                    onClick={() => handleFilterChange(f)} className="text-xs h-7 px-2">
                    {f === 'day' ? 'Jour' : f === 'month' ? 'Mois' : 'Année'}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingChart ? (
              <Skeleton className="h-[250px] w-full" />
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ChartContainer
                config={{
                  totales: { label: "Totales", color: "hsl(223, 32%, 28%)" },
                  validées: { label: "Validées", color: "hsl(142, 76%, 36%)" },
                  rejetées: { label: "Rejetées", color: "hsl(0, 84%, 60%)" },
                }}
                className="h-[250px] w-full"
              >
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line type="monotone" dataKey="totales" stroke="hsl(223, 32%, 28%)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="validées" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="rejetées" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Sensors Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4" />
              Capteurs les plus demandés
            </CardTitle>
            <CardDescription className="text-xs">Top 10 par nombre de demandes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSensors ? (
              <Skeleton className="h-[250px] w-full" />
            ) : sensorsData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
              <ChartContainer
                config={{ demandes: { label: "Demandes", color: "hsl(223, 32%, 28%)" } }}
                className="h-[250px] w-full"
              >
                <BarChart data={sensorsData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} angle={-45} textAnchor="end" height={80} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                  <Bar dataKey="demandes" fill="hsl(223, 32%, 28%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom: System Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            État du système
          </CardTitle>
          <CardDescription className="text-xs">Surveillance en temps réel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Équipements surveillés</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-lg font-semibold">{systemStatus.monitored_equipment}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Capteurs en ligne</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-lg font-semibold">{systemStatus.online_sensors}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Alertes actives</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-lg font-semibold">{systemStatus.active_alerts}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Performance système</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-lg font-semibold">{systemStatus.system_performance}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
