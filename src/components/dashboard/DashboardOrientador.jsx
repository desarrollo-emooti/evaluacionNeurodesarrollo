import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import ActionCard from './ActionCard';
import StatsCard from './StatsCard';
import AlertsWidget from './AlertsWidget';
import {
  ClipboardCheck,
  Calendar,
  GraduationCap,
  FileText,
  BarChart2,
  Book,
  Settings,
  AlertTriangle,
  TrendingUp,
  Target,
  Users
} from 'lucide-react';

const orientadorActions = [
  { icon: ClipboardCheck, title: "Plan de Actuación", description: "Planificación anual del programa de cribados", link: createPageUrl("ActionPlan") },
  { icon: Calendar, title: "Agenda Aprobada", description: "Calendario de cribados del centro", link: createPageUrl("ApprovedSchedule") },
  { icon: GraduationCap, title: "Mis Alumnos", description: "Listado y estado con filtros avanzados", link: createPageUrl("MyStudents") },
  { icon: FileText, title: "Informes Individuales", description: "Generación y descarga de informes personalizados", link: createPageUrl("IndividualReports") },
  { icon: Book, title: "Informes Grupales", description: "Constructor flexible de informes por curso/clase", link: createPageUrl("GroupReports") },
  { icon: BarChart2, title: "Estadísticas Avanzadas", description: "Gráficos radar y comparativas evolutivas", link: createPageUrl("AdvancedStats") },
  { icon: Settings, title: "Plantillas", description: "Configuración de informes reutilizables", link: createPageUrl("ReportTemplates") },
];

export default function DashboardOrientador({ user }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAlerts: 0,
    reportsGenerated: 0,
    completionRate: 0
  });

  const [alerts, setAlerts] = useState([
    {
      level: 'high',
      title: 'Casos Prioritarios',
      count: 3,
      description: 'Alumnos con percentil < 15 en áreas críticas'
    },
    {
      level: 'medium', 
      title: 'Seguimiento Requerido',
      count: 7,
      description: 'Estudiantes en zona de observación'
    },
    {
      level: 'low',
      title: 'Informes Pendientes',
      count: 2,
      description: 'Informes pendientes de validación final'
    }
  ]);

  useEffect(() => {
    setStats({
      totalStudents: 142,
      activeAlerts: 12,
      reportsGenerated: 89,
      completionRate: 87
    });
  }, []);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Orientador</h1>
              <p className="text-slate-600 text-lg">Seguimiento personalizado y detección temprana</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas del orientador */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Alumnos Asignados"
            value={stats.totalStudents}
            icon={GraduationCap}
            color="blue"
            trend="Seguimiento activo"
          />
          <StatsCard
            title="Alertas Activas"
            value={stats.activeAlerts}
            icon={AlertTriangle}
            color="orange"
            trend="Requieren atención"
          />
          <StatsCard
            title="Informes Generados"
            value={stats.reportsGenerated}
            icon={FileText}
            color="green"
            trend="Este curso"
          />
          <StatsCard
            title="Tasa Completitud"
            value={`${stats.completionRate}%`}
            icon={TrendingUp}
            color="purple"
            trend="Pruebas finalizadas"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Acciones del orientador */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Herramientas de Seguimiento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orientadorActions.map((action, index) => (
                <ActionCard key={index} {...action} />
              ))}
            </div>
          </div>

          {/* Sistema de alertas */}
          <div>
            <AlertsWidget alerts={alerts} />
          </div>
        </div>

      </div>
    </div>
  );
}