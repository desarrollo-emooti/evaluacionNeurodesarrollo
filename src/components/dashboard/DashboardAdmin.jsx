
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext'; // Importar el hook del contexto
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ActionCard from './ActionCard';
import StatsCard from './StatsCard';
import {
  UserPlus,
  Users,
  Upload,
  Download,
  Building,
  Calendar,
  Server,
  Archive,
  BarChart2,
  FileBarChart,
  Settings,
  Brain,
  CreditCard,
  Shield,
  AlertTriangle,
  ClipboardCheck, // Icono para pruebas realizadas
} from 'lucide-react';

const adminActions = [
  // Gestión de Usuarios
  { icon: UserPlus, title: "Crear Usuarios", description: "Alta manual de usuarios nuevos con ID anonimizador automático", link: createPageUrl("CreateUser") },
  { icon: Users, title: "Ver/Editar Usuario", description: "Edición completa de datos con trazabilidad de cambios", link: createPageUrl("Users") },
  { icon: Upload, title: "Importar Usuarios", description: "Importación masiva desde Excel/CSV con validación estructural", link: createPageUrl("ImportUsers") },
  { icon: Download, title: "Exportar Usuarios", description: "Exportación a DIDE, PEARSON y otras plataformas externas", link: createPageUrl("ExportUsers") },
  
  // Gestión de Centros y Recursos
  { icon: Building, title: "Gestión de Centros", description: "Creación y modificación de datos de centros educativos", link: createPageUrl("Centers") },
  { icon: Server, title: "Dispositivos", description: "Configuración de iPads y dispositivos para pruebas", link: createPageUrl("Devices") },
  { icon: Archive, title: "Inventario", description: "Control de pruebas compradas y disponibles", link: createPageUrl("Inventory") },
  
  // Gestión Económica y Legal
  { icon: Shield, title: "Autorizaciones", description: "Control de consentimientos parentales y RGPD", link: createPageUrl("Authorizations") },
  { icon: CreditCard, title: "Gestión de Pagos", description: "Integración Stripe y facturación automática", link: createPageUrl("Payments") },
  
  // Reportes y Estadísticas
  { icon: Calendar, title: "Agenda Global", description: "Coordinación de cronogramas y recursos", link: createPageUrl("Agenda") },
  { icon: BarChart2, title: "Estadísticas", description: "Métricas globales y análisis de rendimiento", link: createPageUrl("Statistics") },
  { icon: FileBarChart, title: "Informes", description: "Generación de informes ejecutivos", link: createPageUrl("Reports") },
  { icon: Settings, title: "Configuración", description: "Ajustes de plataforma multitenant", link: createPageUrl("Settings") },
];

export default function DashboardAdmin({ user }) {
  const { students, assignments, isLoading } = useData();

  const [stats, setStats] = useState({
    totalStudents: 0,
    completedTests: 0,
    uniqueCenters: 0,
    pendingTests: 0,
    pendingPayments: 0, // Cambiado de valor estático a calculado
    pendingB2B: 0, // Nuevo
    pendingB2B2C: 0, // Nuevo
    alertsCount: 5 // Mantener valor estático por ahora
  });

  useEffect(() => {
    if (!isLoading) {
      // 1. Calcular el número total de alumnos
      const totalStudentsCount = students.length;
      
      // 2. Calcular el número de centros diferentes registrados
      const uniqueCentersCount = new Set(students.map(s => s.center_id).filter(Boolean)).size;

      // 3. Calcular el número de pruebas realizadas (estado 'Sí' y fecha igual o anterior a hoy)
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Incluir todo el día de hoy

      const completedTestsCount = assignments.filter(a => {
        if (!a.test_date || a.test_status !== 'Sí') {
          return false;
        }
        const testDate = new Date(a.test_date);
        return testDate <= today;
      }).length;

      // 4. Calcular el número de pruebas pendientes de realizar
      const pendingTestsCount = assignments.filter(a => {
        return a.test_status === 'Pendiente' || !a.test_status || a.test_status === 'N/A';
      }).length;

      // 5. Calcular pagos pendientes
      const pendingPaymentStudents = students.filter(s => 
        s.payment_status === 'Pendiente' || !s.payment_status || s.payment_status === 'N/A'
      );
      
      const pendingPaymentsCount = pendingPaymentStudents.length;
      
      // 6. Desglose por tipo de pago
      const pendingB2BCount = pendingPaymentStudents.filter(s => s.payment_type === 'B2B').length;
      const pendingB2B2CCount = pendingPaymentStudents.filter(s => s.payment_type === 'B2B2C').length;
      
      setStats(prevStats => ({
        ...prevStats,
        totalStudents: totalStudentsCount,
        uniqueCenters: uniqueCentersCount,
        completedTests: completedTestsCount,
        pendingTests: pendingTestsCount,
        pendingPayments: pendingPaymentsCount,
        pendingB2B: pendingB2BCount,
        pendingB2B2CCount: pendingB2B2CCount,
      }));
    }
  }, [students, assignments, isLoading]);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Panel de Administración</h1>
              <p className="text-slate-600 text-lg">Plataforma multitenant - Gestión completa del sistema</p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Alumnos Totales"
            value={stats.totalStudents.toLocaleString()}
            icon={Users}
            color="blue"
            trend={`${stats.uniqueCenters || 0} centros registrados`}
            isLoading={isLoading}
            titleHref={createPageUrl("Users?tab=alumnos")}
            valueHref={createPageUrl("Users?tab=alumnos")}
            trendHref={createPageUrl("Centers")}
          />
          <StatsCard
            title="Pruebas Realizadas"
            value={stats.completedTests.toLocaleString()}
            icon={ClipboardCheck}
            color="green"
            trend={`${stats.pendingTests || 0} pendientes`}
            isLoading={isLoading}
            titleHref={createPageUrl("TestAssignment?status=realizado")}
            valueHref={createPageUrl("TestAssignment?status=realizado")}
            trendHref={createPageUrl("TestAssignment?status=pendiente")}
          />
          <StatsCard
            title="Pagos Pendientes"
            value={stats.pendingPayments}
            icon={CreditCard}
            color="orange"
            trend={`${stats.pendingB2B} B2B • ${stats.pendingB2B2CCount} B2B2C`}
            isLoading={isLoading}
            titleHref={createPageUrl("Payments")}
            valueHref={createPageUrl("Payments")}
            trendHref={createPageUrl("Payments?tab=b2b")}
          />
          <StatsCard
            title="Alertas Sistema"
            value={stats.alertsCount}
            icon={AlertTriangle}
            color="purple"
            trend="Requieren atención"
            isLoading={isLoading}
          />
        </div>

        {/* Acciones rápidas */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Funcionalidades Administrativas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {adminActions.map((action, index) => (
              <ActionCard key={index} {...action} isLoading={isLoading} />
            ))}
          </div>
        </div>

        {/* Panel de alertas críticas */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-bold text-slate-900">Alertas del Sistema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/50 rounded-lg p-4">
              <p className="font-medium text-slate-800">Inventario Pruebas</p>
              <p className="text-slate-600">3 pruebas con stock bajo</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <p className="font-medium text-slate-800">Pagos Fallidos</p>
              <p className="text-slate-600">2 intentos fallidos pendientes</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
