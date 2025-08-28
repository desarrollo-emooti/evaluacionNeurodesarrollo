
import React, { useState, useEffect, useMemo } from 'react';
import { Center } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  MapPin, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Centers() {
  const [centers, setCenters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCenter, setEditingCenter] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' }); // Default sort by name ascending

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    setIsLoading(true);
    try {
      const centersList = await Center.list();
      setCenters(centersList);
    } catch (error) {
      toast.error("Error al cargar los centros.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (editingCenter) {
        await Center.update(editingCenter.id, data);
        toast.success("Centro actualizado correctamente.");
      } else {
        await Center.create(data);
        toast.success("Centro creado correctamente.");
      }
      setIsFormOpen(false);
      setEditingCenter(null);
      loadCenters();
    } catch (error) {
      toast.error(`Error al ${editingCenter ? 'actualizar' : 'crear'} el centro.`);
      console.error(error);
    }
  };
  
  const handleEdit = (center) => {
    setEditingCenter(center);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (centerId) => {
    try {
      await Center.delete(centerId);
      toast.success("Centro eliminado correctamente.");
      loadCenters();
    } catch(error) {
      toast.error("Error al eliminar el centro.");
      console.error(error);
    }
  }
  
  const sortedAndFilteredCenters = useMemo(() => {
    let filtered = centers.filter(center =>
      center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle null/undefined values by treating them as empty strings for comparison
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';

        // Convert to lowercase for case-insensitive string sorting
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
  }, [centers, searchTerm, sortConfig]);

  const getTypeColor = (type) => ({
    publico: 'bg-blue-100 text-blue-800',
    concertado: 'bg-purple-100 text-purple-800',
    privado: 'bg-orange-100 text-orange-800'
  }[type] || 'bg-gray-100 text-gray-800');

  const getTypeLabel = (type) => ({
    publico: 'Público',
    concertado: 'Concertado',
    privado: 'Privado'
  }[type] || type);

  const TableHeaderButton = ({ sortKey, children }) => (
    <Button variant="ghost" onClick={() => handleSort(sortKey)} className="flex items-center justify-start px-2 h-auto">
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Centros</h1>
            <p className="text-slate-600">Creación y modificación de datos de centros educativos</p>
          </div>
          <Button onClick={() => { setEditingCenter(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Centro
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar centros por nombre, ciudad o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingCenter ? 'Editar Centro' : 'Crear Nuevo Centro'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
               {/* Form fields here */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Centro *</Label>
                  <Input id="name" name="name" defaultValue={editingCenter?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código del Centro *</Label>
                  <Input id="code" name="code" defaultValue={editingCenter?.code} required />
                </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input id="address" name="address" defaultValue={editingCenter?.address} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" name="city" defaultValue={editingCenter?.city} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input id="postal_code" name="postal_code" defaultValue={editingCenter?.postal_code} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input id="phone" name="phone" defaultValue={editingCenter?.phone} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingCenter?.email} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="director">Director/a</Label>
                  <Input id="director" name="director" defaultValue={editingCenter?.director} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Centro</Label>
                <Select name="type" defaultValue={editingCenter?.type}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publico">Público</SelectItem>
                    <SelectItem value="concertado">Concertado</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">{editingCenter ? 'Guardar Cambios' : 'Crear Centro'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">
                    <TableHeaderButton sortKey="name">Nombre</TableHeaderButton>
                  </TableHead>
                  <TableHead>
                    <TableHeaderButton sortKey="code">Código</TableHeaderButton>
                  </TableHead>
                  <TableHead>
                    <TableHeaderButton sortKey="address">Dirección</TableHeaderButton>
                  </TableHead>
                  <TableHead>
                    <TableHeaderButton sortKey="city">Ciudad</TableHeaderButton>
                  </TableHead>
                  <TableHead>
                    <TableHeaderButton sortKey="type">Tipo</TableHeaderButton>
                  </TableHead>
                  <TableHead className="text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedAndFilteredCenters.length > 0 ? (
                  sortedAndFilteredCenters.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell className="font-medium pl-6">{center.name}</TableCell>
                      <TableCell>{center.code}</TableCell>
                      <TableCell>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.address || ''}, ${center.postal_code || ''} ${center.city || ''}`)}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {center.address || 'No especificada'}
                        </a>
                      </TableCell>
                      <TableCell>{center.city}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(center.type)}>
                          {getTypeLabel(center.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(center)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el centro educativo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(center.id)}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="6" className="h-24 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Building className="w-10 h-10 text-slate-400 mb-2" />
                        <h3 className="text-lg font-semibold text-slate-600">No se encontraron centros</h3>
                        <p className="text-sm text-slate-500">Intenta crear un nuevo centro o ajusta los criterios de búsqueda.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
    </>
  );
}
