
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from '@/api/entities';
import { Center } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Archive, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown // Added ArrowUpDown icon
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const itemTypesByCategory = {
  Informatica: ["Tablet", "Ordenador", "Monitor", "Proyector", "Teclado y ratón", "Impresora"],
  Mobiliario: ["Mesa", "Silla"],
  Promocional: ["Cartelería", "Front", "Panfletos", "Guías"]
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [centers, setCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' }); // Added sortConfig state

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [availableTypes, setAvailableTypes] = useState([]);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  useEffect(() => {
    loadItems();
    loadCenters();
  }, []);

  useEffect(() => {
    // Actualizar tipos disponibles cuando cambia la categoría en el formulario
    if (formData.category) {
      setAvailableTypes(itemTypesByCategory[formData.category] || []);
    } else {
      setAvailableTypes([]);
    }
  }, [formData.category]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const itemList = await InventoryItem.list();
      setItems(itemList);
    } catch (error) {
      toast.error("Error al cargar el inventario.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      const centersList = await Center.list();
      setCenters(centersList);
    } catch (error) {
      console.error("Error al cargar los centros:", error);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(sortedAndFilteredItems.map(item => item.id)); // Changed from filteredItems
    } else {
      setSelectedItems([]);
    }
  };

  const handleRowClick = (item, event) => {
    // Evitar que el clic en checkbox active la edición
    if (event.target.type === 'checkbox' || event.target.closest('[role="checkbox"]')) {
      return;
    }
    handleOpenForm(item);
  };

  // New handleSort function
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleOpenForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        status: 'Libre',
        location: 'Almacen Central' // Valor por defecto
      });
    }
    setIsFormOpen(true);
  };
  
  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    
    // Si cambia la categoría, resetea el tipo
    if (field === 'category') {
      newFormData.item_type = '';
    }
    
    // Si cambia la ubicación y no es "En mantenimiento", limpiar maintenance_location
    if (field === 'location' && value !== 'En mantenimiento') {
      newFormData.maintenance_location = '';
    }
    
    setFormData(newFormData);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar que si la ubicación es "En mantenimiento" haya especificado dónde
      if (formData.location === 'En mantenimiento' && !formData.maintenance_location?.trim()) {
        toast.error("Por favor, especifica dónde está en mantenimiento.");
        return;
      }

      if (editingItem) {
        await InventoryItem.update(editingItem.id, formData);
        toast.success("Artículo actualizado correctamente.");
      } else {
        await InventoryItem.create(formData);
        toast.success("Artículo creado correctamente.");
      }
      setIsFormOpen(false);
      loadItems();
    } catch (error) {
      toast.error(`Error al ${editingItem ? 'actualizar' : 'crear'} el artículo.`);
      console.error(error);
    }
  };

  // This function is no longer called directly from the UI for individual items,
  // but retained in case it's used elsewhere or for future features.
  const handleDelete = async (itemId) => {
    try {
      await InventoryItem.delete(itemId);
      toast.success("Artículo eliminado correctamente.");
      loadItems();
    } catch(error) {
      toast.error("Error al eliminar el artículo.");
      console.error(error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const deletePromises = selectedItems.map(itemId => InventoryItem.delete(itemId));
      await Promise.all(deletePromises);
      toast.success(`${selectedItems.length} artículo(s) eliminado(s) correctamente.`);
      setSelectedItems([]);
      loadItems();
    } catch (error) {
      toast.error("Error al eliminar los artículos seleccionados.");
      console.error(error);
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const getLocationDisplay = (item) => {
    if (item.location === 'En mantenimiento' && item.maintenance_location) {
      return `En mantenimiento - ${item.maintenance_location}`;
    }
    return item.location || 'Almacén Central';
  };

  // Renamed filteredItems to sortedAndFilteredItems and added sorting logic
  const sortedAndFilteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.inventory_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Handle null/undefined values by treating them as empty strings for comparison
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';
        
        // Case-insensitive string comparison
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
  }, [items, searchTerm, categoryFilter, statusFilter, sortConfig]); // Added sortConfig to dependencies

  const getStatusBadge = (status) => {
    const styles = {
      Libre: 'bg-green-100 text-green-800',
      Ocupado: 'bg-orange-100 text-orange-800',
      Reparacion: 'bg-red-100 text-red-800'
    };
    return <Badge className={styles[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  // Helper component for sortable table headers
  const TableHeaderButton = ({ sortKey, children }) => (
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-2 h-auto py-1.5 hover:bg-slate-100 text-left w-full justify-start font-semibold">
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4 text-slate-500" />
    </Button>
  );

  return (
    <>
      <Toaster richColors />
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Inventario</h1>
              <p className="text-slate-600">Control de artículos y activos de la organización</p>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Artículo
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nombre, código, nº inventario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filtrar por categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="Informatica">Informática</SelectItem>
                      <SelectItem value="Mobiliario">Mobiliario</SelectItem>
                      <SelectItem value="Promocional">Promocional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="Libre">Libre</SelectItem>
                      <SelectItem value="Ocupado">Ocupado</SelectItem>
                      <SelectItem value="Reparacion">Reparación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedItems.length > 0 && (
                  <Button variant="destructive" onClick={() => setIsDeleteAlertOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar ({selectedItems.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Modificar Artículo' : 'Crear Nuevo Artículo'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input id="name" value={formData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input id="code" value={formData.code || ''} onChange={(e) => handleInputChange('code', e.target.value)} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <Select value={formData.category || ''} onValueChange={(value) => handleInputChange('category', value)} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Informatica">Informática</SelectItem>
                        <SelectItem value="Mobiliario">Mobiliario</SelectItem>
                        <SelectItem value="Promocional">Promocional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_type">Tipo *</Label>
                    <Select value={formData.item_type || ''} onValueChange={(value) => handleInputChange('item_type', value)} required disabled={!formData.category}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {availableTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inventory_number">Nº Inventario</Label>
                    <Input id="inventory_number" value={formData.inventory_number || ''} onChange={(e) => handleInputChange('inventory_number', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Nº Serie</Label>
                    <Input id="serial_number" value={formData.serial_number || ''} onChange={(e) => handleInputChange('serial_number', e.target.value)} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select value={formData.status || ''} onValueChange={(value) => handleInputChange('status', value)} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Libre">Libar</SelectItem>
                        <SelectItem value="Ocupado">Ocupado</SelectItem>
                        <SelectItem value="Reparacion">En Reparación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">Fecha de Compra</Label>
                    <Input id="purchase_date" type="date" value={formData.purchase_date || ''} onChange={(e) => handleInputChange('purchase_date', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación *</Label>
                  <Select value={formData.location || ''} onValueChange={(value) => handleInputChange('location', value)} required>
                    <SelectTrigger><SelectValue placeholder="Seleccionar ubicación..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Almacen Central">Almacén Central</SelectItem>
                      <SelectItem value="En mantenimiento">En mantenimiento</SelectItem>
                      {centers.map(center => (
                        <SelectItem key={center.id} value={center.name}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo adicional cuando está en mantenimiento */}
                {formData.location === 'En mantenimiento' && (
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_location">Ubicación del Mantenimiento *</Label>
                    <Input 
                      id="maintenance_location" 
                      value={formData.maintenance_location || ''} 
                      onChange={(e) => handleInputChange('maintenance_location', e.target.value)}
                      placeholder="Especifica dónde está en mantenimiento..."
                      required
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingItem ? 'Guardar Cambios' : 'Crear Artículo'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === sortedAndFilteredItems.length && sortedAndFilteredItems.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(checked)}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    <TableHead><TableHeaderButton sortKey="name">Nombre</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="category">Categoría</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="item_type">Tipo</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="location">Ubicación</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="inventory_number">Nº Inventario</TableHeaderButton></TableHead>
                    <TableHead><TableHeaderButton sortKey="status">Estado</TableHeaderButton></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : sortedAndFilteredItems.length > 0 ? (
                    sortedAndFilteredItems.map((item) => (
                      <TableRow 
                        key={item.id} 
                        data-state={selectedItems.includes(item.id) && "selected"}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={(e) => handleRowClick(item, e)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleSelectItem(item.id)}
                            aria-label={`Seleccionar ${item.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.item_type}</TableCell>
                        <TableCell>{getLocationDisplay(item)}</TableCell>
                        <TableCell>{item.inventory_number || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="7" className="h-24 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center h-full">
                          <Archive className="w-10 h-10 text-slate-400 mb-2" />
                          <h3 className="text-lg font-semibold text-slate-600">No se encontraron artículos</h3>
                          <p className="text-sm text-slate-500">Crea un nuevo artículo para empezar a gestionar tu inventario.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-4 text-sm text-slate-600">
            Mostrando {sortedAndFilteredItems.length} de {items.length} artículos
            {selectedItems.length > 0 && (
              <span className="ml-4 font-medium">
                {selectedItems.length} artículo(s) seleccionado(s)
              </span>
            )}
          </div>

          {/* Delete Multiple Confirmation Alert */}
          <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente 
                  <strong> {selectedItems.length} artículo(s)</strong> del inventario.
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
