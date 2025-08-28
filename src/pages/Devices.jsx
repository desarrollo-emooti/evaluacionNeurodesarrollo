
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Tablet, 
  Smartphone, 
  Monitor, 
  Settings,
  Plus,
  Search,
  Trash2,
  ArrowUpDown // Added ArrowUpDown import
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' }); // New state for sorting

  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'ipad',
    serial: '',
    model: '',
    center_id: '',
    location: '',
    status: 'activo',
    usage_status: 'libre'
  });

  const [editDevice, setEditDevice] = useState({
    name: '',
    type: 'ipad',
    serial: '',
    model: '',
    center_id: '',
    location: '',
    status: 'activo',
    usage_status: 'libre'
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = () => {
    setIsLoading(true);
    // Simulación de dispositivos
    setTimeout(() => {
      setDevices([
        {
          id: 'DEVICE_001',
          name: 'iPad Centro María Montessori #1',
          type: 'ipad',
          serial: 'FVFXK2Q8JKCL',
          model: 'iPad Air 4th Gen',
          center_id: 'CENTRO_001',
          center_name: 'CEIP María Montessori',
          location: 'Aula 3º A',
          status: 'activo',
          usage_status: 'en_uso',
          last_status_update: '2024-01-15 14:30:00',
          tests_today: 8
        },
        {
          id: 'DEVICE_002',
          name: 'iPad Centro San Francisco #1',
          type: 'ipad',
          serial: 'FVFXK2Q8JKCM',
          model: 'iPad Pro 11"',
          center_id: 'CENTRO_002',
          center_name: 'Colegio San Francisco',
          location: 'Despacho orientación',
          status: 'inactivo',
          usage_status: 'libre',
          last_status_update: '2024-01-15 09:15:00',
          tests_today: 12
        },
        {
          id: 'DEVICE_003',
          name: 'Tablet Examinador Móvil #1',
          type: 'tablet',
          serial: 'SM-T870NZKAAUT',
          model: 'Samsung Galaxy Tab S7',
          center_id: 'MOBILE',
          center_name: 'Equipo Móvil',
          location: 'Valencia - Zona Norte',
          status: 'activo',
          usage_status: 'libre',
          last_status_update: '2024-01-15 15:45:00',
          tests_today: 5
        }
      ]);
      setIsLoading(false);
    }, 500);
  };

  const getDeviceIcon = (type) => {
    const icons = {
      ipad: Tablet,
      tablet: Tablet,
      smartphone: Smartphone,
      laptop: Monitor
    };
    return icons[type] || Tablet;
  };

  const getStatusColor = (status) => {
    const colors = {
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      activo: 'Activo',
      inactivo: 'Inactivo'
    };
    return labels[status] || status;
  };

  const getUsageStatusColor = (usageStatus) => {
    const colors = {
      libre: 'bg-green-100 text-green-800',
      en_uso: 'bg-red-100 text-red-800'
    };
    return colors[usageStatus] || 'bg-gray-100 text-gray-800';
  };

  const getUsageStatusLabel = (usageStatus) => {
    const labels = {
      libre: 'Libre',
      en_uso: 'En uso'
    };
    return labels[usageStatus] || usageStatus;
  };

  const handleSelectDevice = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedDevices(sortedAndFilteredDevices.map(device => device.id)); // Updated to use sortedAndFilteredDevices
    } else {
      setSelectedDevices([]);
    }
  };

  const handleRowClick = (device, event) => {
    // Evitar que el clic en checkbox active la edición
    if (event.target.type === 'checkbox' || event.target.closest('[role="checkbox"]')) {
      return;
    }
    handleEditDevice(device);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleAddDevice = (e) => {
    e.preventDefault();
    const deviceWithId = {
      ...newDevice,
      id: `DEVICE_${String(devices.length + 1).padStart(3, '0')}`,
      last_status_update: new Date().toISOString(),
      tests_today: 0,
      center_name: `Centro ${newDevice.center_id}`
    };
    setDevices([...devices, deviceWithId]);
    setNewDevice({
      name: '',
      type: 'ipad',
      serial: '',
      model: '',
      center_id: '',
      location: '',
      status: 'activo',
      usage_status: 'libre'
    });
    setShowAddDevice(false);
    toast.success("Dispositivo añadido correctamente.");
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setEditDevice({
      name: device.name,
      type: device.type,
      serial: device.serial,
      model: device.model,
      center_id: device.center_id,
      location: device.location,
      status: device.status,
      usage_status: device.usage_status
    });
    setShowEditDialog(true);
  };

  const handleUpdateDevice = (e) => {
    e.preventDefault();
    const originalDevice = devices.find(d => d.id === editingDevice.id);
    
    // Verificar si cambió algún estado para actualizar la fecha
    const statusChanged = originalDevice.status !== editDevice.status || 
                         originalDevice.usage_status !== editDevice.usage_status;
    
    const updatedDevices = devices.map(device => 
      device.id === editingDevice.id 
        ? { 
            ...device, 
            ...editDevice, 
            center_name: `Centro ${editDevice.center_id}`,
            last_status_update: statusChanged ? new Date().toISOString() : device.last_status_update
          }
        : device
    );
    setDevices(updatedDevices);
    setShowEditDialog(false);
    setEditingDevice(null);
    toast.success("Dispositivo actualizado correctamente.");
  };

  const handleDeleteSelected = () => {
    const updatedDevices = devices.filter(device => !selectedDevices.includes(device.id));
    setDevices(updatedDevices);
    setSelectedDevices([]);
    setIsDeleteAlertOpen(false);
    toast.success(`${selectedDevices.length} dispositivo(s) eliminado(s) correctamente.`);
  };

  const sortedAndFilteredDevices = useMemo(() => {
    let currentDevices = [...devices]; // Create a copy to avoid mutating state directly

    // Filtering logic
    let filtered = currentDevices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.center_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    // Sorting logic
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

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
  }, [devices, searchTerm, filterStatus, sortConfig]);

  const TableHeaderButton = ({ sortKey, children }) => (
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-2">
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <>
      <Toaster richColors />
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Dispositivos</h1>
              <p className="text-slate-600">Configuración de iPads y dispositivos para pruebas</p>
            </div>
            <Button onClick={() => setShowAddDevice(!showAddDevice)}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Dispositivo
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Buscar por nombre, serial o centro..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedDevices.length > 0 && (
                  <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar ({selectedDevices.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Device Form */}
          {showAddDevice && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Añadir Nuevo Dispositivo</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDevice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="device_name">Nombre del Dispositivo</Label>
                      <Input
                        id="device_name"
                        value={newDevice.name}
                        onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                        placeholder="iPad Centro #1"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="device_type">Tipo</Label>
                      <Select value={newDevice.type} onValueChange={(value) => setNewDevice({...newDevice, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ipad">iPad</SelectItem>
                          <SelectItem value="tablet">Tablet Android</SelectItem>
                          <SelectItem value="laptop">Portátil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serial">Número de Serie</Label>
                      <Input
                        id="serial"
                        value={newDevice.serial}
                        onChange={(e) => setNewDevice({...newDevice, serial: e.target.value})}
                        placeholder="FVFXK2Q8JKCL"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo</Label>
                      <Input
                        id="model"
                        value={newDevice.model}
                        onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                        placeholder="iPad Air 4th Gen"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="center_id">Centro</Label>
                      <Input
                        id="center_id"
                        value={newDevice.center_id}
                        onChange={(e) => setNewDevice({...newDevice, center_id: e.target.value})}
                        placeholder="CENTRO_001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="device_status">Estado</Label>
                      <Select value={newDevice.status} onValueChange={(value) => setNewDevice({...newDevice, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Activo</SelectItem>
                          <SelectItem value="inactivo">Inactivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usage_status">Estado de Uso</Label>
                      <Select value={newDevice.usage_status} onValueChange={(value) => setNewDevice({...newDevice, usage_status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="libre">Libre</SelectItem>
                          <SelectItem value="en_uso">En uso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Select value={newDevice.location} onValueChange={(value) => setNewDevice({...newDevice, location: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Almacén Central">Almacén Central</SelectItem>
                        <SelectItem value="Aula 1º A">Aula 1º A</SelectItem>
                        <SelectItem value="Aula 2º A">Aula 2º A</SelectItem>
                        <SelectItem value="Aula 3º A">Aula 3º A</SelectItem>
                        <SelectItem value="Despacho orientación">Despacho orientación</SelectItem>
                        <SelectItem value="Sala de profesores">Sala de profesores</SelectItem>
                        <SelectItem value="Biblioteca">Biblioteca</SelectItem>
                        <SelectItem value="Equipo Móvil">Equipo Móvil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddDevice(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Añadir Dispositivo
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Edit Device Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Configurar Dispositivo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateDevice} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_device_name">Nombre del Dispositivo</Label>
                    <Input
                      id="edit_device_name"
                      value={editDevice.name}
                      onChange={(e) => setEditDevice({...editDevice, name: e.target.value})}
                      placeholder="iPad Centro #1"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_device_type">Tipo</Label>
                    <Select value={editDevice.type} onValueChange={(value) => setEditDevice({...editDevice, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ipad">iPad</SelectItem>
                        <SelectItem value="tablet">Tablet Android</SelectItem>
                        <SelectItem value="laptop">Portátil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_serial">Número de Serie</Label>
                    <Input
                      id="edit_serial"
                      value={editDevice.serial}
                      onChange={(e) => setEditDevice({...editDevice, serial: e.target.value})}
                      placeholder="FVFXK2Q8JKCL"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_model">Modelo</Label>
                    <Input
                      id="edit_model"
                      value={editDevice.model}
                      onChange={(e) => setEditDevice({...editDevice, model: e.target.value})}
                      placeholder="iPad Air 4th Gen"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_center_id">Centro</Label>
                    <Input
                      id="edit_center_id"
                      value={editDevice.center_id}
                      onChange={(e) => setEditDevice({...editDevice, center_id: e.target.value})}
                      placeholder="CENTRO_001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_device_status">Estado</Label>
                    <Select value={editDevice.status} onValueChange={(value) => setEditDevice({...editDevice, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_usage_status">Estado de Uso</Label>
                    <Select value={editDevice.usage_status} onValueChange={(value) => setEditDevice({...editDevice, usage_status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libre">Libre</SelectItem>
                        <SelectItem value="en_uso">En uso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_location">Ubicación</Label>
                  <Select value={editDevice.location} onValueChange={(value) => setEditDevice({...editDevice, location: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Almacén Central">Almacén Central</SelectItem>
                      <SelectItem value="Aula 1º A">Aula 1º A</SelectItem>
                      <SelectItem value="Aula 2º A">Aula 2º A</SelectItem>
                      <SelectItem value="Aula 3º A">Aula 3º A</SelectItem>
                      <SelectItem value="Despacho orientación">Despacho orientación</SelectItem>
                      <SelectItem value="Sala de profesores">Sala de profesores</SelectItem>
                      <SelectItem value="Biblioteca">Biblioteca</SelectItem>
                      <SelectItem value="Equipo Móvil">Equipo Móvil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Devices Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedDevices.length === sortedAndFilteredDevices.length && sortedAndFilteredDevices.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked)}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    <TableHead><TableHeaderButton sortKey="name">Dispositivo</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="type">Tipo</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="serial">Serial</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="center_name">Centro</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="location">Ubicación</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="status">Estado</TableHeaderButton></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : sortedAndFilteredDevices.length > 0 ? (
                    sortedAndFilteredDevices.map((device) => {
                      const DeviceIcon = getDeviceIcon(device.type);
                      return (
                        <TableRow 
                          key={device.id} 
                          data-state={selectedDevices.includes(device.id) && "selected"}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={(e) => handleRowClick(device, e)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedDevices.includes(device.id)}
                              onCheckedChange={() => handleSelectDevice(device.id)}
                              aria-label={`Seleccionar ${device.name}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <DeviceIcon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{device.name}</p>
                                <p className="text-sm text-slate-600">{device.model}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{device.type}</TableCell>
                          <TableCell className="font-mono text-sm">{device.serial}</TableCell>
                          <TableCell>{device.center_name}</TableCell>
                          <TableCell>{device.location}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={getStatusColor(device.status)}>
                                {getStatusLabel(device.status)}
                              </Badge>
                              <Badge className={getUsageStatusColor(device.usage_status)}>
                                {getUsageStatusLabel(device.usage_status)}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan="7" className="h-24 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center h-full">
                          <Tablet className="w-10 h-10 text-slate-400 mb-2" />
                          <h3 className="text-lg font-semibold text-slate-600">No se encontraron dispositivos</h3>
                          <p className="text-sm text-slate-500">Añade dispositivos o ajusta los filtros de búsqueda</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-4 text-sm text-slate-600">
            Mostrando {sortedAndFilteredDevices.length} de {devices.length} dispositivos
            {selectedDevices.length > 0 && (
              <span className="ml-4 font-medium">
                {selectedDevices.length} dispositivo(s) seleccionado(s)
              </span>
            )}
          </div>

          {/* Delete Confirmation Alert */}
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente 
                  <strong> {selectedDevices.length} dispositivo(s)</strong> del sistema.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>Confirmar Eliminación</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </>
  );
}
