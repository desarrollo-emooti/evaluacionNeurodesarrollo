import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import ActionCard from './ActionCard';
import StatsCard from './StatsCard';
import {
  Users,
  BarChart2,
  Calendar,
  FileBarChart,
  ClipboardList,
  Settings,
  Brain,
  Upload,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

const clinicaActions = [
  // Gestión de Pruebas
  { icon: ClipboardList, title: "Gestión de Pruebas", description: "Inventario, alta/baja y asignación masiva por criterios", link: createPageUrl("TestManagement") },
  { icon: Users, title: "Asignación Masiva", description: "Asignar pruebas por curso, clase o centro completo", link: createPageUrl("MassAssignment") },
  { icon: Calendar, title: "Cronograma", description: "Planificación de fechas y recursos por sesión", link: createPageUrl("Schedule") },
  
  // Resultados y Datos Externos
  { icon: Upload, title: "Importar Resultados", description: "Carga masiva desde DIDE, PEARSON y otras herramientas", link: createPageUrl("ImportResults") },
  { icon: FileSearch, title: "OCR Automático", description: "Conversión PDF → CSV → BD con mapeo personalizable", link: createPageUrl("OCRProcessing") },
  
  // Informes y Textos
  { icon: FileBarChart, title: "Editor de Informes", description: "Textos automáticos con lógica condicional", link: createPageUrl("ReportEditor") },
  { icon: BarChart2, title: "Validación Clínica", description: "Supervisión y control de calidad de informes", link: createPageUrl("ClinicalValidation") },
  
  // Coordinación
  { icon: Users, title: "Coordinación Examinadores", description: "Asignación de sesiones, rutas y logística", link: createPageUrl("ExaminerCoordination") },
  { icon: Settings, title: "Configuración", description: "Matrices lógicas y parámetros clínicos", link: createPageUrl("ClinicalSettings") },
];

export default function DashboardClinica({ user }) {
  const [stats, setStats] = useState({
    testsAssigned: 0,
    pendingValidation: 0,
    completedReports: 0,
    activeExaminers: 0
  });

  useEffect(() => {
    setStats({
      testsAssigned: 1247,
      pendingValidation: 23,
      completedReports: 856,
      activeExaminers: 12
    });
  }, []);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Clínica</h1>
              <p className="text-slate-600 text-lg">Coordinación clínica y validación de resultados</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas clínicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pruebas Asignadas"
            value={stats.testsAssigned}
            icon={ClipboardList}
            color="blue"
            trend="Este trimestre"
          />
          <StatsCard
            title="Pendientes Validación"
            value={stats.pendingValidation}
            icon={Clock}
            color="orange"
            trend="Requieren revisión"
          />
          <StatsCard
            title="Informes Completados"
            value={stats.completedReports}
            icon={CheckCircle2}
            color="green"
            trend="Validados clínicamente"
          />
          <StatsCard
            title="Examinadores Activos"
            value={stats.activeExaminers}
            icon={Users}
            color="purple"
            trend="En coordinación"
          />
        </div>

        {/* Acciones clínicas */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Funcionalidades Clínicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinicaActions.map((action, index) => (
              <ActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Panel de validación pendiente */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-bold text-slate-900">Validación Clínica Pendiente</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/50 rounded-lg p-4">
              <p className="font-medium text-slate-800">Casos Prioritarios</p>
              <p className="text-slate-600">5 alumnos requieren revisión inmediata</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="font-medium text-slate-800">Informes en Revisión</p>
              <p className="text-slate-600">18 informes esperan validación</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="font-medium text-slate-800">Importaciones OCR</p>
              <p className="text-slate-600">12 PDFs procesándose automáticamente</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}