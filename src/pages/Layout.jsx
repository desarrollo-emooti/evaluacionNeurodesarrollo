

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { DataProvider } from "../components/DataContext"; // Corregir ruta de importación
import {
  Brain,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileBarChart,
  Settings,
  GraduationCap,
  Stethoscope,
  UserCheck,
  FileSearch,
  Heart,
  Building,
  Server,
  Archive,
  Upload,
  Download,
  BarChart2,
  Calendar,
  UserPlus,
  Shield,
  CreditCard,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Edit,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getAdminNavigationCategories = () => [
  {
    title: "Gestión de Usuarios",
    icon: Users,
    items: [
      { title: "Crear Usuarios", url: createPageUrl("CreateUser"), icon: UserPlus },
      { title: "Ver/Editar Usuario", url: createPageUrl("Users"), icon: Users },
      { title: "Importar Usuarios", url: createPageUrl("ImportUsers"), icon: Upload },
      { title: "Exportar Usuarios", url: createPageUrl("ExportUsers"), icon: Download },
    ]
  },
  {
    title: "Centros y Recursos",
    icon: Building,
    items: [
      { title: "Gestión de Centros", url: createPageUrl("Centers"), icon: Building },
      { title: "Dispositivos", url: createPageUrl("Devices"), icon: Server },
      { title: "Inventario", url: createPageUrl("Inventory"), icon: Archive },
    ]
  },
  {
    title: "Agenda",
    url: createPageUrl("Agenda"),
    icon: Calendar,
    type: 'single' // Marked as a single item
  },
  {
    title: "Gestión de las pruebas",
    icon: ClipboardList,
    items: [
      { title: "Asignación de pruebas", url: createPageUrl("TestAssignment"), icon: ClipboardCheck },
      { title: "Plantillas Import.", url: createPageUrl("ImportTests"), icon: Upload }, // Updated item title
      { title: "Import. resultados", url: createPageUrl("ImportResults"), icon: Upload },
    ]
  },
  {
    title: "Económico y Legal",
    icon: Shield,
    items: [
      { title: "Autorizaciones", url: createPageUrl("Authorizations"), icon: Shield },
      { title: "Gestión de Pagos", url: createPageUrl("Payments"), icon: CreditCard },
    ]
  },
  {
    title: "Reportes y Análisis",
    icon: BarChart2,
    items: [
      { title: "Estadísticas", url: createPageUrl("Statistics"), icon: BarChart2 },
      { title: "Informes", url: createPageUrl("Reports"), icon: FileBarChart },
    ]
  }
];

const getRoleBasedNavigation = (userType) => {
  const commonItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
    }
  ];

  switch(userType) {
    case 'administrador':
      return {
        common: commonItems,
        categories: getAdminNavigationCategories(),
        settings: { title: "Configuración", url: createPageUrl("Settings"), icon: Settings }
      };

    case 'clinica':
      return {
        common: commonItems,
        simple: [
          { title: "Usuarios", url: createPageUrl("Users"), icon: Users },
          { title: "Estadísticas", url: createPageUrl("Statistics"), icon: BarChart2 },
          { title: "Agenda", url: createPageUrl("Agenda"), icon: Calendar },
          { title: "Informes", url: createPageUrl("Reports"), icon: FileBarChart },
          { title: "Pruebas", url: createPageUrl("Tests"), icon: ClipboardList },
        ],
        settings: { title: "Ajustes", url: createPageUrl("Settings"), icon: Settings }
      };

    case 'orientador':
      return {
        common: commonItems,
        simple: [
          { title: "Gestión de Usuarios", url: createPageUrl("Users"), icon: Users },
          { title: "Agenda", url: createPageUrl("Agenda"), icon: Calendar },
        ],
        categories: [
          {
            title: "Reportes y Análisis",
            icon: BarChart2,
            items: [
              { title: "Estadísticas", url: createPageUrl("Statistics"), icon: BarChart2 },
              { title: "Informes", url: createPageUrl("Reports"), icon: FileBarChart },
            ]
          }
        ],
        settings: { title: "Configuración", url: createPageUrl("Settings"), icon: Settings }
      };

    case 'familia':
       return {
        simple: [
          { title: "Resumen", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
          { title: "Informes", url: createPageUrl("FamilyReports"), icon: FileBarChart },
          { title: "Pruebas Realizadas", url: createPageUrl("FamilyTests"), icon: ClipboardList },
          { title: "Recomendaciones", url: createPageUrl("Recommendations"), icon: Heart }
        ]
      };

    case 'examinador':
      return {
        common: commonItems,
        simple: [
          { title: "Mis Pruebas", url: createPageUrl("MyTests"), icon: ClipboardList },
          { title: "Resultados", url: createPageUrl("Results"), icon: FileSearch }
        ]
      };

    default:
      return { common: commonItems };
  }
};

const getRoleIcon = (userType) => {
  const icons = {
    'administrador': Settings,
    'clinica': Stethoscope,
    'orientador': UserCheck,
    'examinador': FileSearch,
    'familia': Heart,
    'alumno': GraduationCap
  };
  return icons[userType] || Users;
};

const getRoleDisplayName = (userType) => {
  const names = {
    'administrador': 'Administrador',
    'clinica': 'Clínica',
    'orientador': 'Orientador',
    'examinador': 'Examinador',
    'familia': 'Familia',
    'alumno': 'Alumno'
  };
  return names[userType] || 'Usuario';
};

const CollapsibleMenuGroup = ({ category, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <Button
        variant="ghost"
        className="w-full justify-between text-white hover:text-slate-900 hover:bg-white mb-1 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <category.icon className="w-5 h-5" />
          <span className="font-medium">{category.title}</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </Button>

      {isOpen && (
        <div className="ml-4 space-y-1">
          {category.items.map((item) => (
            <Link key={item.title} to={item.url}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm transition-all duration-200 ${
                  currentPath === item.url ? 'bg-white text-slate-900' : 'text-white hover:text-slate-900 hover:bg-white'
                }`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.title}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error cargando usuario:', error);
        // Fallback en caso de error
        setCurrentUser({
          user_type: 'administrador',
          full_name: 'Usuario',
          email: 'usuario@emooti.es'
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  // Si aún está cargando el usuario, mostrar un estado de carga
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 primary-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const navigation = getRoleBasedNavigation(currentUser?.user_type);
  const RoleIcon = getRoleIcon(currentUser?.user_type);

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <DataProvider> {/* Envolver toda la aplicación con el DataProvider */}
      <style>
        {`
          :root {
            --primary: 220 91% 56%;
            --primary-foreground: 0 0% 100%;
            --secondary: 142 76% 73%;
            --secondary-foreground: 0 0% 100%;
            --accent: 25 95% 53%;
            --accent-foreground: 0 0% 100%;
            --muted: 210 40% 98%;
            --muted-foreground: 215 16% 47%;
            --background: 0 0% 100%;
            --foreground: 222 84% 5%;
            --card: 0 0% 100%;
            --card-foreground: 222 84% 5%;
            --border: 214 32% 91%;
            --ring: 220 91% 56%;
          }

          .primary-gradient {
            background: linear-gradient(135deg, #4f8ff7 0%, #4facfe 100%);
          }

          .secondary-gradient {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        `}
      </style>

      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
          <Sidebar className="border-r border-slate-600 shadow-xl bg-slate-800" style={{ backgroundColor: '#1e293b' }}>
            <SidebarHeader className="border-b border-slate-600 p-6" style={{ backgroundColor: '#1e293b' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b3a68dbf8_copyImage.png" 
                    alt="EMOOTI Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">EMOOTI</h2>
                  <p className="text-xs text-slate-300">Evaluación Neurodesarrollo</p>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent className="p-4" style={{ backgroundColor: '#1e293b' }}>
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">
                  Navegación
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* Common items */}
                    {navigation.common?.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url
                              ? 'bg-white text-slate-900 shadow-lg'
                              : 'text-white hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}

                    {/* Categorized items for admin, now handling both single and grouped */}
                    {navigation.categories?.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        {item.type === 'single' ? (
                           <SidebarMenuButton
                              asChild
                              className={`transition-all duration-200 rounded-xl mb-1 ${
                                location.pathname === item.url
                                  ? 'bg-white text-slate-900 shadow-lg'
                                  : 'text-white hover:text-slate-900 hover:bg-white'
                              }`}
                            >
                              <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                        ) : (
                          <CollapsibleMenuGroup
                            category={item}
                            currentPath={location.pathname}
                          />
                        )}
                      </SidebarMenuItem>
                    ))}

                    {/* Simple items for other roles */}
                    {navigation.simple?.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url
                              ? 'bg-white text-slate-900 shadow-lg'
                              : 'text-white hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}

                    {/* Settings */}
                    {navigation.settings && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className={`transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === navigation.settings.url
                              ? 'bg-white text-slate-900 shadow-lg'
                              : 'text-white hover:text-slate-900 hover:bg-white'
                          }`}
                        >
                          <Link to={navigation.settings.url} className="flex items-center gap-3 px-4 py-3">
                            <navigation.settings.icon className="w-5 h-5" />
                            <span className="font-medium">{navigation.settings.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-600 p-6" style={{ backgroundColor: '#1e293b' }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white hover:text-slate-900 p-3 transition-all duration-200">
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={``} alt={currentUser?.full_name || 'Usuario'} />
                        <AvatarFallback className="bg-slate-600 text-white">
                          {currentUser?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-white text-sm truncate">{currentUser?.full_name || 'Usuario'}</p>
                        <p className="text-xs text-slate-300 truncate">{getRoleDisplayName(currentUser?.user_type)}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-300" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Profile")} className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Editar Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-4 md:hidden shadow-sm">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="flex items-center gap-2">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b3a68dbf8_copyImage.png" 
                    alt="EMOOTI Logo" 
                    className="w-8 h-8 object-contain"
                  />
                  <h1 className="text-xl font-bold text-slate-900">EMOOTI</h1>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </DataProvider>
  );
}

