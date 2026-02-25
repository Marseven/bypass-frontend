import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  FileText,
  Activity,
  TrendingUp,
  Shield,
  ArrowRight,
  BarChart3
} from "lucide-react"
import { useState, useEffect } from 'react';
import api from '../axios'
import { Link } from "react-router-dom"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts"


export default function Dashboard() {

  const [das, setdas] = useState(0)
  const [eav, seteav] = useState(0)
  const [aad, setaad] = useState(0)
  const [ucs, setucs] = useState(0)
  const [monitoring, setMonitoring] = useState(0)
  const [online, setOnline] = useState(0)
  const [active, setActive] = useState(0)
  const [systeme, setSysteme] = useState(0)
  const [requestList, setRequestList] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [chartFilter, setChartFilter] = useState<'day' | 'month' | 'year'>('day');
  const [sensorsData, setSensorsData] = useState([]);
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);


  useEffect(() => {
    api.get('/dashboard/summary')
    .then(response => {
        setaad(response.data.approved_today)
        setdas(response.data.active_requests)
        seteav(response.data.pending_validation)
        setucs(response.data.connected_users)
    })
    .catch(error => {
      // Handle error
      console.error('Error fetching data:', error);
    });
  
    //recents-requets
  
    api.get('/dashboard/recent-requests')
    .then(response => {
      // Handle successful response
      console.log(response.data); // The fetched data is typically in response.data
      setRequestList(response.data)    
    })
    .catch(error => {
      // Handle error
      console.error('Error fetching data:', error);
    });
  
    //systems-status
    api.get('/dashboard/system-status')
    .then(response => {
      // Handle successful response
      console.log(response.data); // The fetched data is typically in response.data
      setMonitoring(response.data.monitored_equipment)
      setOnline(response.data.online_sensors)
      setActive(response.data.active_alerts)
      setSysteme(response.data.system_performance)
        
    })
    .catch(error => {
      // Handle error
      console.error('Error fetching data:', error);
    });
  
    // Request statistics for chart
    fetchChartData('day');
  
    // Top sensors statistics
    fetchTopSensors();
  
  }, [])

  const fetchChartData = (filter: 'day' | 'month' | 'year') => {
    setIsLoadingChart(true);
    let days = 30;
    if (filter === 'day') {
      days = 30;
    } else if (filter === 'month') {
      days = 365; // 12 mois
    } else if (filter === 'year') {
      days = 1095; // 3 ans
    }

    api.get(`/dashboard/request-statistics?days=${days}`)
    .then(response => {
      // Format data for chart based on filter
      let formattedData;
      if (filter === 'day') {
        // Afficher les 30 derniers jours avec format JJ/MM
        formattedData = response.data.slice(-30).map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          totales: item.total,
          validées: item.approved,
          rejetées: item.rejected
        }));
      } else if (filter === 'month') {
        // Agréger par mois
        const monthlyData: { [key: string]: { totales: number; validées: number; rejetées: number; sortKey: string } } = {};
        response.data.forEach((item: any) => {
          const date = new Date(item.date);
          const monthKey = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { totales: 0, validées: 0, rejetées: 0, sortKey };
          }
          monthlyData[monthKey].totales += item.total;
          monthlyData[monthKey].validées += item.approved;
          monthlyData[monthKey].rejetées += item.rejected;
        });
        formattedData = Object.entries(monthlyData)
          .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
          .slice(-12) // Garder les 12 derniers mois
          .map(([date, data]) => ({
            date: date.charAt(0).toUpperCase() + date.slice(1),
            totales: data.totales,
            validées: data.validées,
            rejetées: data.rejetées
          }));
      } else {
        // Agréger par année
        const yearlyData: { [key: string]: { totales: number; validées: number; rejetées: number } } = {};
        response.data.forEach((item: any) => {
          const yearKey = new Date(item.date).getFullYear().toString();
          if (!yearlyData[yearKey]) {
            yearlyData[yearKey] = { totales: 0, validées: 0, rejetées: 0 };
          }
          yearlyData[yearKey].totales += item.total;
          yearlyData[yearKey].validées += item.approved;
          yearlyData[yearKey].rejetées += item.rejected;
        });
        formattedData = Object.entries(yearlyData)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, data]) => ({
            date,
            ...data
          }));
      }
      setChartData(formattedData);
      setIsLoadingChart(false);
    })
    .catch(error => {
      console.error('Error fetching chart data:', error);
      setIsLoadingChart(false);
    });
  }

  const handleFilterChange = (filter: 'day' | 'month' | 'year') => {
    setChartFilter(filter);
    fetchChartData(filter);
  }

  const fetchTopSensors = () => {
    setIsLoadingSensors(true);
    api.get('/dashboard/top-sensors')
    .then(response => {
      const formattedData = response.data
        .sort((a: any, b: any) => b.request_count - a.request_count)
        .map((item: any) => ({
          name: item.sensor_name.length > 15 ? item.sensor_name.substring(0, 15) + '...' : item.sensor_name,
          fullName: item.sensor_name,
          equipment: item.equipment_name,
          demandes: item.request_count
        }));
      setSensorsData(formattedData);
      setIsLoadingSensors(false);
    })
    .catch(error => {
      console.error('Error fetching top sensors data:', error);
      setIsLoadingSensors(false);
    });
  }

  


  const stats = [
    {
      title: "Demandes actives",
      value: das,
      description: "En cours de traitement",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      title: "En attente validation",
      value: eav,
      description: "Nécessitent votre attention",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      title: "Approuvées aujourd'hui",
      value: aad,
      description: "Validations effectuées",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Utilisateurs connectés",
      value: ucs,
      description: "Actuellement en ligne",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ]


  const recentRequests = [
    {
      id: "BR-2024-001",
      equipment: "Ligne de production A",
      sensor: "Capteur de pression #12",
      requester: "Marie Martin",
      priority: "Haute",
      status: "En attente"
    },
    {
      id: "BR-2024-002", 
      equipment: "Four industriel B",
      sensor: "Capteur de température #8",
      requester: "Pierre Dubois",
      priority: "Moyenne",
      status: "Approuvé"
    },
    {
      id: "BR-2024-003",
      equipment: "Compresseur C",
      sensor: "Capteur de vibration #3",
      requester: "Sophie Leroy",
      priority: "Faible",
      status: "En cours"
    }
  ]

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

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 min-w-0 box-border">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">Tableau de bord</h1>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            Vue d'ensemble du système Bypass Guard
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto text-sm h-8 sm:h-9 flex-shrink-0">
          <Link to="/requests/new" className="flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 min-w-0">
              <CardTitle className="text-xs sm:text-sm font-medium truncate min-w-0 flex-1">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-full ${stat.bgColor} flex-shrink-0 ml-2`}>
                <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 min-w-0">
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 break-words">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="w-full min-w-0 box-border">
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Statistiques des demandes</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {chartFilter === 'day' && 'Évolution des demandes sur les 30 derniers jours'}
                {chartFilter === 'month' && 'Évolution des demandes par mois'}
                {chartFilter === 'year' && 'Évolution des demandes par année'}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant={chartFilter === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('day')}
                className="text-xs h-8"
              >
                Jour
              </Button>
              <Button
                variant={chartFilter === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('month')}
                className="text-xs h-8"
              >
                Mois
              </Button>
              <Button
                variant={chartFilter === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('year')}
                className="text-xs h-8"
              >
                Année
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 min-w-0 overflow-x-hidden">
          {isLoadingChart ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Aucune donnée disponible</div>
            </div>
          ) : (
            <ChartContainer
              config={{
                totales: {
                  label: "Demandes totales",
                  color: "hsl(221, 83%, 53%)", // bleu
                },
                validées: {
                  label: "Demandes validées",
                  color: "hsl(142, 76%, 36%)", // vert
                },
                rejetées: {
                  label: "Demandes rejetées",
                  color: "hsl(0, 84%, 60%)", // rouge
                },
              }}
              className="h-[300px] w-full"
            >
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line 
                  type="monotone" 
                  dataKey="totales" 
                  stroke="hsl(221, 83%, 53%)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Demandes totales"
                />
                <Line 
                  type="monotone" 
                  dataKey="validées" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Demandes validées"
                />
                <Line 
                  type="monotone" 
                  dataKey="rejetées" 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Demandes rejetées"
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Sensors Chart */}
      <Card className="w-full min-w-0 box-border">
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">Capteurs les plus demandés</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Top 10 des capteurs ayant fait l'objet du plus grand nombre de demandes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 min-w-0 overflow-x-hidden">
          {isLoadingSensors ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : sensorsData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Aucune donnée disponible</div>
            </div>
          ) : (
            <ChartContainer
              config={{
                demandes: {
                  label: "Nombre de demandes",
                  color: "hsl(221, 83%, 53%)", // bleu
                },
              }}
              className="h-[400px] w-full"
            >
              <BarChart data={sensorsData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                />
                <Bar 
                  dataKey="demandes" 
                  fill="hsl(221, 83%, 53%)"
                  radius={[4, 4, 0, 0]}
                  name="Demandes"
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 w-full min-w-0 overflow-x-hidden">
        {/* Recent requests */}
        <Card className="w-full min-w-0 box-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Demandes récentes</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Les dernières demandes de bypass soumises
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 min-w-0 overflow-x-hidden">
            {requestList?.slice(0, 3).map((request) => (
              <div key={request.id} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors min-w-0 w-full box-border">
                <div className="space-y-1 flex-1 min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-xs sm:text-sm truncate min-w-0">{request.request_code}</span>
                    <Badge variant="outline" className={getPriorityColor(request.priority) + " text-xs flex-shrink-0"}>
                      {request.priority}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{request.equipment?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground truncate">{request.sensor?.name || 'N/A'}</p>
                </div>
                <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                  <Badge className={getStatusColor(request.status) + " text-xs"}>
                    {request.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground truncate">{request.requester?.full_name || 'N/A'}</p>
                </div>
              </div>
            ))}
            <div className="pt-2 sm:pt-3 border-t">
              <Button variant="ghost" className="w-full justify-center text-sm h-8 sm:h-9" asChild>
                <Link to="/requests" className="flex items-center justify-center">
                  Voir toutes les demandes
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System status */}
        <Card className="w-full min-w-0 box-border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">État du système</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Surveillance en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 min-w-0 overflow-x-hidden">
            <div className="space-y-2 sm:space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs sm:text-sm truncate flex-1 min-w-0">Équipements surveillés</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{monitoring} actifs</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs sm:text-sm truncate flex-1 min-w-0">Capteurs en ligne</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{online} connectés</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs sm:text-sm truncate flex-1 min-w-0">Alertes actives</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{active} en cours</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs sm:text-sm truncate flex-1 min-w-0">Performance système</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{systeme}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}