
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { DataProvider, useData } from '../components/DataContext';
import { User } from '@/api/entities';
import { Student } from '@/api/entities';
import { Center } from '@/api/entities';
import { PreRegisteredUser } from '@/api/entities'; // Importar PreRegisteredUser
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowUpDown, Trash2, Edit, User as UserIcon, GraduationCap, Search, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster, toast } from "sonner";
import UserEditForm from '../components/users/UserEditForm';
import StudentEditForm from '../components/users/StudentEditForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// The actual UsersPage logic will be in this component, wrapped by DataProvider
function UsersPageContent() {
  // Usar datos del contexto
  const { users, students, centers, isLoading, loadData, preRegisteredUsers, currentUser } = useData();

  // Mantener estados locales para la UI
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'displayName', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Para el rol Familia, la pestaña activa siempre será "alumnos"
  const isFamilyRole = currentUser?.user_type === 'familia';
  const [localActiveTab, setLocalActiveTab] = useState('alumnos'); // Local state for activeTab
  
  // Leer parámetros URL para establecer tab inicial
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && !isFamilyRole) {
      setLocalActiveTab(tabParam);
    }
  }, [isFamilyRole]);

  const activeTab = isFamilyRole ? 'alumnos' : localActiveTab;
  const setActiveTab = isFamilyRole ? () => {} : setLocalActiveTab; // No-op if family role

  // Nuevos estados para filtros
  const [centerFilter, setCenterFilter] = useState('all');
  const [etapaFilter, setEtapaFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  useEffect(() => {
    // El contexto ya gestiona la carga de datos y el polling.
    // Este useEffect ahora solo se usa para efectos locales si los hubiera,
    // o para un mensaje inicial, etc. Si no hay más lógica, podría estar vacío.
    // La lógica de carga inicial y polling está en DataContext.
  }, []);

  // Combinar usuarios y estudiantes en una lista unificada
  const allItems = useMemo(() => {
    const centerMap = new Map(centers.map(c => [c.id, c.name]));
    const getCenterName = (centerId) => centerMap.get(centerId) || 'N/A';

    const userItems = users.map(user => ({
      ...user,
      type: 'user',
      displayName: user.full_name || user.email || 'Usuario sin nombre',
      displayId: user.user_id || user.id,
      role: user.user_type,
      identifier: user.email,
      center: getCenterName(user.center_id),
      center_id: user.center_id, // Mantener id para filtros
      course: 'N/A',
      etapa: null,
      consent_given: null,
      status: 'Activo' // Nuevo estado para usuarios activos
    }));

    const preRegisteredUserItems = preRegisteredUsers.map(pUser => {
      let statusText;
      switch(pUser.status) {
        case 'active_with_password':
          statusText = 'Activo con Contraseña';
          break;
        case 'pending_invitation':
          statusText = 'Pendiente Invitación';
          break;
        case 'invitation_sent':
          statusText = 'Invitación Enviada';
          break;
        case 'registered':
          statusText = 'Registrado';
          break;
        default:
          statusText = 'Pendiente Invitación';
      }
      
      return {
        ...pUser,
        type: 'preregistered',
        displayName: pUser.full_name || pUser.email,
        displayId: pUser.id,
        role: pUser.user_type,
        identifier: pUser.email,
        center: getCenterName(pUser.center_id),
        center_id: pUser.center_id,
        course: 'N/A',
        etapa: null,
        consent_given: null,
        status: statusText
      };
    });

    const studentItems = students.map(student => ({
      ...student,
      type: 'student',
      displayName: student.full_name,
      displayId: student.student_id || student.id,
      role: 'alumno',
      identifier: `${student.course || ''}${student.class_group ? ` - ${student.class_group}` : ''}`,
      center: getCenterName(student.center_id),
      center_id: student.center_id,
      course: student.course || 'N/A',
      etapa: student.etapa,
      consent_given: student.consent_given,
      payment_status: student.payment_status || 'Pendiente', // Cambiar default de N/A a Pendiente
      family_id: student.family_id // Ensure family_id is included if available
    }));

    return [...userItems, ...studentItems, ...preRegisteredUserItems]; // Añadir pre-registrados
  }, [users, students, centers, preRegisteredUsers]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectItem = (itemId, itemType) => {
    const fullId = `${itemType}-${itemId}`;
    setSelectedItems(prev => 
      prev.includes(fullId) ? prev.filter(id => id !== fullId) : [...prev, fullId]
    );
  };

  const handleSelectAll = (checked) => {
    // Filter items based on the active tab before selecting all
    const itemsToSelect = filteredAndSortedItems.filter(item => 
      activeTab === 'usuarios' ? (item.type === 'user' || item.type === 'preregistered') : item.type === 'student'
    );
    if (checked) {
      setSelectedItems(itemsToSelect.map(item => `${item.type}-${item.id}`));
    } else {
      setSelectedItems([]);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditingType(item.type);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (updatedData) => {
    try {
      if (editingType === 'user') {
        await User.update(editingItem.id, updatedData);
      } else if (editingType === 'preregistered') {
        await PreRegisteredUser.update(editingItem.id, updatedData);
      } else {
        await Student.update(editingItem.id, updatedData);
      }
      toast.success(`${editingType === 'user' ? 'Usuario' : editingType === 'preregistered' ? 'Usuario pre-registrado' : 'Alumno'} actualizado correctamente.`);
      setIsEditModalOpen(false);
      setEditingItem(null);
      setEditingType(null);
      await loadData(); // Forzar recarga de datos
    } catch (err) {
      toast.error(`Error al actualizar el ${editingType === 'user' ? 'usuario' : editingType === 'preregistered' ? 'usuario pre-registrado' : 'alumno'}.`);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const deletePromises = selectedItems.map(fullId => {
        const [type, id] = fullId.split('-');
        if (type === 'user') return User.delete(id);
        if (type === 'preregistered') return PreRegisteredUser.delete(id); // Añadir borrado de pre-registrados
        return Student.delete(id);
      });
      
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.length} elemento(s) eliminado(s) correctamente.`);
      setSelectedItems([]);
      await loadData(); // Forzar recarga de datos
    } catch (err) {
      toast.error("Error al eliminar los elementos seleccionados.");
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const filteredAndSortedItems = useMemo(() => {
    let filtered = allItems.filter(item => {
      const matchesSearch = 
        item.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.displayId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.center?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.type === 'student' && item.etapa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.payment_status && item.payment_status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.payment_type && item.payment_type.toLowerCase().includes(searchTerm.toLowerCase())) || // Añadir búsqueda por tipo de pago
        (item.status && item.status.toLowerCase().includes(searchTerm.toLowerCase())); // Añadir búsqueda por estado
      
      const matchesTab = (() => {
        if (isFamilyRole) {
          return item.type === 'student'; // Family only sees students
        } else {
          // For other roles, respect the active tab
          return activeTab === 'usuarios' ? (item.type === 'user' || item.type === 'preregistered') : item.type === 'student';
        }
      })();
      
      // Aplicar nuevos filtros
      const matchesCenter = centerFilter === 'all' || item.center_id === centerFilter;
      const matchesEtapa = etapaFilter === 'all' || item.etapa === etapaFilter;
      const matchesCourse = courseFilter === 'all' || item.course === courseFilter;
      const matchesGroup = groupFilter === 'all' || item.class_group === groupFilter;

      if (activeTab === 'alumnos') {
        return matchesSearch && matchesTab && matchesCenter && matchesEtapa && matchesCourse && matchesGroup;
      }
      
      // Para usuarios (incluyendo pre-registrados), solo aplican búsqueda y centro
      return matchesSearch && matchesTab && matchesCenter;
    });

    // Specific filtering for 'familia' role after initial tab/search filtering
    if (isFamilyRole && currentUser?.id) {
      filtered = filtered.filter(item => item.type === 'student' && item.family_id === currentUser.id);
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';
        
        if (bVal === null && aVal !== null) return sortConfig.direction === 'ascending' ? -1 : 1; // nulls last
        if (aVal === null && bVal !== null) return sortConfig.direction === 'ascending' ? 1 : -1; // nulls last

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [allItems, searchTerm, activeTab, sortConfig, centerFilter, etapaFilter, courseFilter, groupFilter, isFamilyRole, currentUser]);

  // Derivar opciones para filtros
  const uniqueEtapas = useMemo(() => [...new Set(students.map(s => s.etapa).filter(Boolean))], [students]);
  const uniqueCourses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))], [students]);
  const uniqueGroups = useMemo(() => [...new Set(students.map(s => s.class_group).filter(Boolean))], [students]);

  const getRoleDisplayName = (role) => {
    const names = {
      'administrador': 'Administrador',
      'clinica': 'Clínica',
      'orientador': 'Orientador',
      'examinador': 'Examinador',
      'familia': 'Familia',
      'alumno': 'Alumno'
    };
    return names[role] || role;
  };

  const getTypeBadge = (type) => {
    return type === 'user' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <UserIcon className="w-3 h-3 mr-1" />
        Usuario
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <GraduationCap className="w-3 h-3 mr-1" />
        Alumno
      </Badge>
    );
  };

  const getConsentBadge = (consentStatus, itemType) => {
    if (itemType === 'user' || itemType === 'preregistered') { // Consentimiento no aplica a usuarios ni pre-registrados
      return <span className="text-slate-400 text-sm">N/A</span>;
    }
    
    const statusColors = {
      'Sí': 'bg-blue-100 text-blue-800',
      'No': 'bg-red-100 text-red-800',
      'Pendiente': 'bg-orange-100 text-orange-800',
      'N/A': 'bg-gray-100 text-gray-800'
    };
    
    const displayStatus = consentStatus || 'Pendiente';
    const colorClass = statusColors[displayStatus] || statusColors['Pendiente'];
    
    return (
      <Badge className={colorClass}>
        {displayStatus}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    if (!status) return null;
    
    const statusColors = {
      'Pagado': 'bg-green-100 text-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'N/A': 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = statusColors[status] || statusColors['Pendiente']; // Cambiar default
    
    return (
      <Badge className={colorClass}>
        <DollarSign className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (type) => {
    if (!type) return <span className="text-slate-400 text-sm">N/A</span>;
    
    const typeColors = {
      'B2B': 'bg-blue-100 text-blue-800',
      'B2B2C': 'bg-purple-100 text-purple-800'
    };
    
    const colorClass = typeColors[type] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Activo': 'bg-green-100 text-green-800',
      'Pendiente Invitación': 'bg-yellow-100 text-yellow-800',
      'Activo con Contraseña': 'bg-blue-100 text-blue-800', // Nuevo estado
      'Invitación Enviada': 'bg-purple-100 text-purple-800',
      'Registrado': 'bg-green-100 text-green-800',
    };
    if (!statusColors[status]) return null;

    return <Badge className={statusColors[status]}>{status}</Badge>;
  };

  const TableHeaderButton = ({ sortKey, children }) => (
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="text-left px-2">
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const FilterControls = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex flex-wrap gap-4 flex-1">
        <div className="relative flex-1 min-w-[250px] md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder={`Buscar ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={centerFilter} onValueChange={setCenterFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Centro..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los centros</SelectItem>
            {centers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {activeTab === 'alumnos' && (
          <>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Etapa..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {uniqueEtapas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Curso..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {uniqueCourses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Grupo..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grupos</SelectItem>
                {uniqueGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      {selectedItems.length > 0 && (
        <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)} className="w-full md:w-auto">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar ({selectedItems.length})
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <Toaster richColors />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isFamilyRole ? "Mis Hijos" : "Gestión de Usuarios"}
          </h1>
          <p className="text-slate-600">
            {isFamilyRole 
              ? "Aquí puedes ver la información académica de tus hijos asociados."
              : "Gestiona todos los usuarios y alumnos creados en la plataforma"}
          </p>
        </div>

        {isFamilyRole ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Alumnos Asociados</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Centro Educativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredAndSortedItems.length > 0 ? (
                      filteredAndSortedItems.filter(item => item.type === 'student').map((item) => (
                        <TableRow
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleEditItem(item)}
                          className="cursor-pointer hover:bg-slate-50"
                        >
                          <TableCell className="font-medium">{item.displayName}</TableCell>
                          <TableCell>{item.etapa || 'N/A'}</TableCell>
                          <TableCell>{item.course}</TableCell>
                          <TableCell>{item.center}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan="4" className="h-24 text-center">
                          No tienes alumnos asociados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                  Mostrando {filteredAndSortedItems.filter(item => item.type === 'student').length} alumnos
                </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="alumnos" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                <GraduationCap className="w-4 h-4" />
                Alumnos
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                <UserIcon className="w-4 h-4" />
                Usuarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alumnos" className="space-y-6">
              <Card>
                <CardHeader>
                  <FilterControls />
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedItems.length === filteredAndSortedItems.filter(item => item.type === 'student').length && filteredAndSortedItems.filter(item => item.type === 'student').length > 0}
                              onCheckedChange={(checked) => handleSelectAll(checked)}
                              aria-label="Seleccionar todo"
                            />
                          </TableHead>
                          <TableHead><TableHeaderButton sortKey="displayName">Nombre</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="etapa">Etapa</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="course">Curso</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="center">Centro Educativo</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="consent_given">Consentimiento</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="payment_type">Tipo</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="payment_status">Estado Pago</TableHeaderButton></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array(8).fill(0).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            </TableRow>
                          ))
                        ) : filteredAndSortedItems.length > 0 ? (
                          filteredAndSortedItems.filter(item => item.type === 'student').map((item) => (
                            <TableRow
                              key={`${item.type}-${item.id}`}
                              data-state={selectedItems.includes(`${item.type}-${item.id}`) && "selected"}
                              onClick={() => handleEditItem(item)}
                              className="cursor-pointer hover:bg-slate-50"
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedItems.includes(`${item.type}-${item.id}`)}
                                  onCheckedChange={() => handleSelectItem(item.id, item.type)}
                                  aria-label={`Seleccionar ${item.displayName}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{item.displayName}</TableCell>
                              <TableCell>{item.etapa || 'N/A'}</TableCell>
                              <TableCell className="text-slate-600">{item.course}</TableCell>
                              <TableCell>{item.center}</TableCell>
                              <TableCell>{getConsentBadge(item.consent_given, item.type)}</TableCell>
                              <TableCell>{getPaymentTypeBadge(item.payment_type)}</TableCell>
                              <TableCell>{getPaymentStatusBadge(item.payment_status)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan="8" className="h-24 text-center">
                              No se encontraron alumnos.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-600">
                    Mostrando {filteredAndSortedItems.filter(item => item.type === 'student').length} alumnos
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios" className="space-y-6">
              <Card>
                <CardHeader>
                  <FilterControls />
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedItems.length === filteredAndSortedItems.filter(item => item.type === 'user' || item.type === 'preregistered').length && filteredAndSortedItems.filter(item => item.type === 'user' || item.type === 'preregistered').length > 0}
                              onCheckedChange={(checked) => handleSelectAll(checked)}
                              aria-label="Seleccionar todo"
                            />
                          </TableHead>
                          <TableHead><TableHeaderButton sortKey="displayName">Nombre</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="role">Rol</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="center">Centro Educativo</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="status">Estado</TableHeaderButton></TableHead>
                          <TableHead><TableHeaderButton sortKey="displayId">ID Usuario</TableHeaderButton></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array(8).fill(0).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            </TableRow>
                          ))
                        ) : filteredAndSortedItems.length > 0 ? (
                          filteredAndSortedItems.filter(item => item.type === 'user' || item.type === 'preregistered').map((item) => (
                            <TableRow
                              key={`${item.type}-${item.id}`}
                              data-state={selectedItems.includes(`${item.type}-${item.id}`) && "selected"}
                              onClick={() => handleEditItem(item)}
                              className="cursor-pointer hover:bg-slate-50"
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedItems.includes(`${item.type}-${item.id}`)}
                                  onCheckedChange={() => handleSelectItem(item.id, item.type)}
                                  aria-label={`Seleccionar ${item.displayName}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{item.displayName}</TableCell>
                              <TableCell>{getRoleDisplayName(item.role)}</TableCell>
                              <TableCell>{item.center}</TableCell>
                              <TableCell>{getStatusBadge(item.status)}</TableCell>
                              <TableCell className="font-mono text-sm text-slate-600">{item.displayId || 'N/A'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan="6" className="h-24 text-center">
                              No se encontraron usuarios.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-600">
                    Mostrando {filteredAndSortedItems.filter(item => item.type === 'user' || item.type === 'preregistered').length} usuarios
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingType === 'student' ? (
                <><GraduationCap className="w-5 h-5" /> Editar Alumno</>
              ) : (
                <><UserIcon className="w-5 h-5" /> Editar Usuario</>
              )}
            </DialogTitle>
          </DialogHeader>
          {editingItem && (editingType === 'user' || editingType === 'preregistered') && (
            <UserEditForm
              user={editingItem}
              onSubmit={handleUpdateItem}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
          {editingItem && editingType === 'student' && (
            <StudentEditForm
              student={editingItem}
              onSubmit={handleUpdateItem}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente 
              <strong> {selectedItems.length} elemento(s)</strong> y sus datos de nuestros servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Wrapper component to provide DataContext to UsersPageContent
export default function UsersPage() {
  return (
    <DataProvider>
      <UsersPageContent />
    </DataProvider>
  );
}
