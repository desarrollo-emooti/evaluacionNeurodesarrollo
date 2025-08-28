
import React, { useState, useEffect } from 'react';
import { ImportTemplate } from '@/api/entities';
import { TestAssignment } from '@/api/entities'; // Added Import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Copy, Eye, Save, X, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

const fieldTypes = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'booleano', label: 'Booleano' },
  { value: 'email', label: 'Email' },
  { value: 'telefono', label: 'Teléfono' },
  { value: 'lista', label: 'Lista' }
];

export default function ImportTests() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [destinationFields, setDestinationFields] = useState([]); // Added state

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    template_type: 'pruebas',
    fields: [{ field_name: '', field_type: 'texto', is_required: false, description: '', destination_field: '', options: [] }],
    active: true
  });

  useEffect(() => {
    loadTemplates();
    loadDestinationFields(); // Added function call
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const templateList = await ImportTemplate.list();
      setTemplates(templateList);
    } catch (error) {
      toast.error("Error al cargar las plantillas.");
    } finally {
      setIsLoading(false);
    }
  };

  // Added function
  const loadDestinationFields = async () => {
    try {
      const schema = await TestAssignment.schema();
      const fields = Object.entries(schema.properties).map(([key, value]) => ({
        value: `TestAssignment.${key}`,
        label: value.description || key,
      }));
      setDestinationFields(fields);
    } catch (error) {
      console.error("Error loading database fields:", error);
      toast.error("Error al cargar los campos de destino de la base de datos.");
    }
  };

  const handleOpenForm = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateData({
        ...template,
        fields: template.fields || [{ field_name: '', field_type: 'texto', is_required: false, description: '', destination_field: '', options: [] }]
      });
    } else {
      setEditingTemplate(null);
      setTemplateData({
        name: '',
        description: '',
        template_type: 'pruebas',
        fields: [{ field_name: '', field_type: 'texto', is_required: false, description: '', destination_field: '', options: [] }],
        active: true
      });
    }
    setShowTemplateForm(true);
  };

  const handleAddField = () => {
    setTemplateData(prev => ({
      ...prev,
      fields: [...prev.fields, { field_name: '', field_type: 'texto', is_required: false, description: '', destination_field: '', options: [] }]
    }));
  };

  const handleRemoveField = (index) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
  };

  const handleFieldChange = (index, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i === index) {
          const updatedField = { ...f, [field]: value };
          if (field === 'field_type' && value === 'lista' && !updatedField.options) {
            updatedField.options = [''];
          }
          if (field === 'field_type' && value !== 'lista') {
            updatedField.options = [];
          }
          return updatedField;
        }
        return f;
      })
    }));
  };

  const handleOptionsChange = (fieldIndex, optionIndex, value) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i === fieldIndex) {
          const newOptions = [...(f.options || [])];
          newOptions[optionIndex] = value;
          return { ...f, options: newOptions };
        }
        return f;
      })
    }));
  };

  const handleAddOption = (fieldIndex) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i === fieldIndex) {
          return { ...f, options: [...(f.options || []), ''] };
        }
        return f;
      })
    }));
  };

  const handleRemoveOption = (fieldIndex, optionIndex) => {
    setTemplateData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => {
        if (i === fieldIndex) {
          const currentOptions = f.options || [];
          return { ...f, options: currentOptions.filter((_, oi) => oi !== optionIndex) };
        }
        return f;
      })
    }));
  };

  const handleSubmitTemplate = async (e) => {
    e.preventDefault();

    const validFields = templateData.fields.filter(f => f.field_name.trim());
    if (validFields.length === 0) {
      toast.error("Debe agregar al menos un campo con nombre.");
      return;
    }

    const dataToSave = {
      ...templateData,
      fields: validFields
    };

    try {
      if (editingTemplate) {
        await ImportTemplate.update(editingTemplate.id, dataToSave);
        toast.success("Plantilla actualizada correctamente.");
      } else {
        await ImportTemplate.create(dataToSave);
        toast.success("Plantilla creada correctamente.");
      }
      setShowTemplateForm(false);
      loadTemplates();
    } catch (error) {
      toast.error("Error al guardar la plantilla.");
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      await ImportTemplate.delete(templateToDelete.id);
      toast.success("Plantilla eliminada correctamente.");
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (error) {
      toast.error("Error al eliminar la plantilla.");
    }
  };

  const handleDownloadTemplate = (template) => {
    const headers = template.fields.map(field => `"${field.field_name.replace(/"/g, '""')}"`);
    const csvContent = headers.join(';') + '\n';

    // Añadir BOM para compatibilidad con Excel y caracteres españoles
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${template.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link); // Append to body for broader browser compatibility
    link.click();
    document.body.removeChild(link); // Clean up
    URL.revokeObjectURL(url);

    toast.success(`Plantilla "${template.name}" descargada.`);
  };

  const handleDuplicateTemplate = (template) => {
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copia)`,
      id: undefined
    };
    setEditingTemplate(null);
    setTemplateData(duplicatedTemplate);
    setShowTemplateForm(true);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeColor = (type) => {
    const colors = {
      pruebas: 'bg-blue-100 text-blue-800',
      resultados: 'bg-green-100 text-green-800',
      usuarios: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type) => {
    const labels = {
      pruebas: 'Pruebas',
      resultados: 'Resultados',
      usuarios: 'Usuarios'
    };
    return labels[type] || type;
  };

  const getFieldTypeLabel = (type) => {
    const field = fieldTypes.find(ft => ft.value === type);
    return field ? field.label : type;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Importación de Pruebas</h1>
          <p className="text-slate-600">Gestiona plantillas personalizadas para importar datos de pruebas</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getTypeColor(template.template_type)}>
                          {getTypeLabel(template.template_type)}
                        </Badge>
                        <Badge variant="outline">
                          {template.fields ? template.fields.length : 0} campos
                        </Badge>
                      </div>
                    </div>
                    {!template.active && (
                      <Badge variant="destructive">Inactiva</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {template.description || 'Sin descripción'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenForm(template)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadTemplate(template)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setTemplateToDelete(template);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-12">
                  <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay plantillas</h3>
                  <p className="text-slate-600 mb-4">
                    {searchTerm ? 'No se encontraron plantillas que coincidan con la búsqueda.' : 'Crea tu primera plantilla de importación para comenzar.'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => handleOpenForm()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Plantilla
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Formulario de Plantilla */}
        <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Plantilla' : 'Crear Nueva Plantilla'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitTemplate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Plantilla *</Label>
                  <Input
                    id="name"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                    placeholder="Ej: Plantilla WISC-V"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template_type">Tipo de Plantilla</Label>
                  <Select
                    value={templateData.template_type}
                    onValueChange={(value) => setTemplateData({...templateData, template_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pruebas">Pruebas</SelectItem>
                      <SelectItem value="resultados">Resultados</SelectItem>
                      <SelectItem value="usuarios">Usuarios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={templateData.description}
                  onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                  placeholder="Describe el propósito de esta plantilla..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Campos de la Plantilla</Label>
                  <Button type="button" onClick={handleAddField} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Campo
                  </Button>
                </div>

                <div className="space-y-4">
                  {templateData.fields.map((field, index) => (
                    <Card key={index} className="p-4 bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2 lg:col-span-1">
                          <Label>Nombre del Campo *</Label>
                          <Input
                            value={field.field_name}
                            onChange={(e) => handleFieldChange(index, 'field_name', e.target.value)}
                            placeholder="Ej: Id Alumno"
                          />
                        </div>

                        <div className="space-y-2 lg:col-span-1">
                          <Label>Tipo</Label>
                          <Select
                            value={field.field_type}
                            onValueChange={(value) => handleFieldChange(index, 'field_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 lg:col-span-1">
                          <Label>Campo Destino</Label>
                          <Select
                            value={field.destination_field || ''} // Use || '' to handle null/undefined
                            onValueChange={(value) => handleFieldChange(index, 'destination_field', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar destino..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={null}>(No asignar)</SelectItem> {/* Option for not assigning */}
                              {destinationFields.map(df => (
                                <SelectItem key={df.value} value={df.value} title={df.value}>
                                  {df.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 lg:col-span-1">
                          <Label>Descripción</Label>
                          <Input
                            value={field.description}
                            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                            placeholder="Describe este campo..."
                          />
                        </div>

                        <div className="space-y-2 lg:col-span-1 flex flex-col justify-between">
                          <div className="flex items-center space-x-2 pt-7">
                            <Checkbox
                              id={`required_${index}`}
                              checked={field.is_required}
                              onCheckedChange={(checked) => handleFieldChange(index, 'is_required', checked)}
                            />
                            <Label htmlFor={`required_${index}`} className="text-sm">
                              Obligatorio
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveField(index)}
                            disabled={templateData.fields.length === 1}
                            className="w-full"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </div>

                      {field.field_type === 'lista' && (
                        <div className="mt-4">
                          <Label className="text-sm font-medium">Opciones disponibles:</Label>
                          <div className="space-y-2 mt-2">
                            {(field.options || []).map((option, optionIndex) => (
                              <div key={optionIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => handleOptionsChange(index, optionIndex, e.target.value)}
                                  placeholder={`Opción ${optionIndex + 1}`}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveOption(index, optionIndex)}
                                  disabled={(field.options || []).length === 1}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddOption(index)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Agregar Opción
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowTemplateForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Vista Previa */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Vista Previa: {previewTemplate?.name}</DialogTitle>
            </DialogHeader>

            {previewTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Tipo:</strong> {getTypeLabel(previewTemplate.template_type)}
                  </div>
                  <div>
                    <strong>Campos:</strong> {previewTemplate.fields ? previewTemplate.fields.length : 0}
                  </div>
                </div>

                <div>
                  <strong>Descripción:</strong>
                  <p className="text-sm text-slate-600 mt-1">
                    {previewTemplate.description || 'Sin descripción'}
                  </p>
                </div>

                <div>
                  <strong>Campos definidos:</strong>
                  <div className="mt-2 space-y-2">
                    {(previewTemplate.fields || []).map((field, index) => (
                      <div key={index} className="border rounded p-3 bg-slate-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{field.field_name}</p>
                            <p className="text-sm text-slate-600">
                              {getFieldTypeLabel(field.field_type)}
                              {field.is_required && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            {field.destination_field && (
                              <p className="text-xs text-blue-600 mt-1">Destino: {field.destination_field}</p>
                            )}
                            {field.description && (
                              <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                            )}
                          </div>
                          {field.field_type === 'lista' && field.options && field.options.length > 0 && (
                            <div className="text-xs">
                              <strong>Opciones:</strong> {(field.options || []).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmación de Eliminación */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla
                {templateToDelete && <span> "<strong>{templateToDelete.name}</strong>"</span>} y todos sus datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTemplate}>
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
