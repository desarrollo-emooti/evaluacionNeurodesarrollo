
import React, { useState, useEffect } from "react";
import DashboardAdmin from "../components/dashboard/DashboardAdmin";
import DashboardClinica from "../components/dashboard/DashboardClinica";
import DashboardOrientador from "../components/dashboard/DashboardOrientador";
import DashboardFamilia from "../components/dashboard/DashboardFamilia";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@/api/entities"; // Importar User

// Componente genérico para roles sin dashboard específico aún
const GenericDashboard = ({ role }) => (
  <div className="p-8">
    <h1 className="text-3xl font-bold">Dashboard de {role}</h1>
    <p className="text-slate-600 mt-2">
      Funcionalidades específicas para este rol se mostrarán aquí.
    </p>
  </div>
);

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        // Manejar el caso en que el usuario no esté logueado si es necesario
        // Por ejemplo, redirigir a la página de login o mostrar un mensaje de error
        setCurrentUser(null); // Asegura que currentUser sea null si hay un error
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const renderDashboardByRole = () => {
    if (isLoading) {
      return <DashboardSkeleton />;
    }

    switch (currentUser?.user_type) {
      case 'administrador':
        return <DashboardAdmin user={currentUser} />;
      case 'clinica':
        return <DashboardClinica user={currentUser} />;
      case 'orientador':
        return <DashboardOrientador user={currentUser} />;
      case 'familia':
        return <DashboardFamilia user={currentUser} />;
      case 'examinador':
        return <GenericDashboard role="Examinador" />;
      default:
        // Si currentUser es null o su user_type no coincide con ninguno,
        // se asume un rol genérico o no autenticado.
        return <GenericDashboard role="Usuario" />;
    }
  };

  return <div className="min-h-full">{renderDashboardByRole()}</div>;
}

const DashboardSkeleton = () => (
    <div className="p-8 space-y-8">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
);
