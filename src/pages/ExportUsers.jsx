
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Student } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Download,
  FileSpreadsheet,
  Settings,
  Filter,
  Eye,
  CheckCircle,
  Plus,
  Trash2,
  Save,
  Edit,
  X
} from "lucide-react";
import { toast } from "sonner";

export default function ExportUsers() {
  const [exportConfig, setExportConfig] = useState({
    platform: 'custom',
    userType: 'all',
    center: 'all',
    etapa: 'all',
    curso: 'all',
    grupo: 'all',
    format: 'csv',
    includedFields: []
  });

  const [customTemplate, setCustomTemplate] = useState({
    id: null,
    name: '',
    description: '',
    fields: [{ entityType: '', sourceField: '', customName: '' }]
  });

  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      const storedTemplates = localStorage.getItem('customExportTemplates');
      return storedTemplates ? JSON.parse(storedTemplates) : [];
    } catch (error) {
      console.error("Failed to load templates from localStorage", error);
      return [];
    }
  });

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('customExportTemplates', JSON.stringify(savedTemplates));
    } catch (error) {
      console.error("Failed to save templates to localStorage", error);
    }
  }, [savedTemplates]);

  const availableSourceFields = [
    { id: 'full_name', label: 'Nombre Completo', entity: 'user' },
    { id: 'email', label: 'Email', entity: 'user' },
    { id: 'phone', label: 'Teléfono', entity: 'user' },
    { id: 'user_type', label: 'Tipo de Usuario', entity: 'user' },
    { id: 'center_id', label: 'Centro', entity: 'user' },
    { id: 'specialty', label: 'Especialidad', entity: 'user' },
    { id: 'license_number', label: 'Nº Colegiado', entity: 'user' },
    { id: 'created_date', label: 'Fecha Creación', entity: 'user' },
    { id: 'last_access', label: 'Último Acceso', entity: 'user' },
    { id: 'full_name', label: 'Nombre Completo', entity: 'student' },
    { id: 'birth_date', label: 'Fecha Nacimiento', entity: 'student' },
    { id: 'gender', label: 'Género', entity: 'student' },
    { id: 'etapa', label: 'Etapa Educativa', entity: 'student' },
    { id: 'course', label: 'Curso', entity: 'student' },
    { id: 'class_group', label: 'Grupo/Clase', entity: 'student' },
    { id: 'center_id', label: 'Centro', entity: 'student' },
    { id: 'medical_observations', label: 'Observaciones Médicas', entity: 'student' },
    { id: 'active', label: 'Estado Activo', entity: 'student' },
    { id: 'consent_given', label: 'Consentimiento', entity: 'student' }
  ];

  const entityTypes = [
    { value: 'user', label: 'Usuario' },
    { value: 'student', label: 'Alumno' }
  ];

  const getVisibleFilters = () => {
    const userType = exportConfig.userType;
    if (userType === 'alumnos' || userType === 'familia') {
      return ['center', 'etapa', 'curso', 'grupo'];
    } else if (userType === 'orientador') {
      return ['center'];
    } else {
      return [];
    }
  };

  const processDataForExport = async (limit = null) => {
    const [users, students] = await Promise.all([User.list(), Student.list()]);
    
    let combinedData = [
      ...users.map(u => ({ ...u, type: 'user' })),
      ...students.map(s => ({ ...s, type: 'student' }))
    ];

    let dataToProcess = combinedData;
    if (exportConfig.userType !== 'all') {
        const userTypesToInclude = [exportConfig.userType];
        if(exportConfig.userType === 'alumnos') userTypesToInclude.push('student');

        dataToProcess = combinedData.filter(item => 
            userTypesToInclude.includes(item.user_type) || 
            (item.type === 'student' && exportConfig.userType === 'alumnos')
        );
    }

    const filteredData = dataToProcess.filter(item => {
        const visibleFilters = getVisibleFilters();
        let passes = true;
        if (visibleFilters.includes('center')) passes = passes && (exportConfig.center === 'all' || item.center_id === exportConfig.center);
        if (visibleFilters.includes('etapa')) passes = passes && (exportConfig.etapa === 'all' || item.etapa === exportConfig.etapa);
        if (visibleFilters.includes('curso')) passes = passes && (exportConfig.curso === 'all' || item.course === exportConfig.curso);
        if (visibleFilters.includes('grupo')) passes = passes && (exportConfig.grupo === 'all' || item.class_group === exportConfig.grupo);
        return passes;
    });

    const mappedData = filteredData.map(item => {
        const row = {};
        if (!selectedTemplate) return row; // Should not happen if selectedTemplate is checked before calling
        selectedTemplate.fields.forEach(field => {
            if (exportConfig.includedFields.includes(field.customName)) {
                let value = '';
                if (item.type === field.entityType) {
                    value = item[field.sourceField];
                }
                row[field.customName] = value !== undefined && value !== null ? value : '';
            }
        });
        return row;
    });

    // Filtrar filas completamente vacías o sin datos significativos
    const cleanedData = mappedData.filter(row => {
        // Verificar si la fila tiene al menos un campo con datos significativos
        return Object.values(row).some(value => {
            const stringValue = String(value).trim();
            return stringValue !== '' && stringValue !== 'null' && stringValue !== 'undefined';
        });
    });

    return limit ? cleanedData.slice(0, limit) : cleanedData;
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    toast.info("Generando vista previa...");
    try {
      const data = await processDataForExport(10);
      setPreviewData(data);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generando vista previa:', error);
      toast.error('No se pudo generar la vista previa.');
    }
  };

  const handleExport = async () => {
    if (!selectedTemplate) return;
    setIsExporting(true);
    toast.info("Generando exportación...");

    try {
      const data = await processDataForExport();

      if (data.length === 0) {
        toast.warning("No se encontraron datos con los filtros seleccionados.");
        setIsExporting(false);
        return;
      }
      
      let fileContent = '';
      const headers = Object.keys(data[0]);

      if (exportConfig.format === 'csv') {
        const csvRows = [];
        // Añadir cabeceras
        csvRows.push(headers.join(';'));

        // Añadir filas de datos
        for (const row of data) {
          const values = headers.map(header => {
            const cellValue = row[header] === null || row[header] === undefined ? '' : String(row[header]);
            // Escapar comillas dobles dentro del valor
            const escaped = cellValue.replace(/"/g, '""'); 
            return `"${escaped}"`;
          });
          csvRows.push(values.join(';'));
        }

        // Unir todas las filas con el salto de línea estándar de Windows (\r\n) y añadir el BOM
        fileContent = '\ufeff' + csvRows.join('\r\n');

      } else { // json
        fileContent = JSON.stringify(data, null, 2);
      }
      
      const blob = new Blob([fileContent], { type: exportConfig.format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedTemplate.name.replace(/\s+/g, '_')}_${Date.now()}.${exportConfig.format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exportación completada.");

    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Ocurrió un error durante la exportación.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleUserTypeChange = (value) => {
    setExportConfig(prevConfig => ({
      ...prevConfig,
      userType: value,
      center: 'all',
      etapa: 'all',
      curso: 'all',
      grupo: 'all'
    }));
  };

  const updateTemplateField = (index, field, value) => {
    setCustomTemplate(prevCustomTemplate => ({
      ...prevCustomTemplate,
      fields: prevCustomTemplate.fields.map((f, i) => {
        if (i === index) {
          const updatedField = { ...f, [field]: value };
          if (field === 'entityType') {
            updatedField.sourceField = '';
            updatedField.customName = '';
          }
          if (field === 'sourceField' && value) {
            const sourceFieldInfo = availableSourceFields.find(sf => sf.id === value && sf.entity === updatedField.entityType);
            if (sourceFieldInfo) {
              updatedField.customName = sourceFieldInfo.label;
            }
          }
          return updatedField;
        }
        return f;
      })
    }));
  };

  const saveCustomTemplate = () => {
    if (!customTemplate.name.trim()) {
      toast.error('Por favor, ingresa un nombre para la plantilla');
      return;
    }
    const validFields = customTemplate.fields.filter(f => f.entityType && f.sourceField && f.customName);
    if (validFields.length === 0) {
      toast.error('Por favor, agrega al menos un campo válido.');
      return;
    }
    let updatedTemplates;
    if (customTemplate.id) {
      updatedTemplates = savedTemplates.map(t =>
        t.id === customTemplate.id ? { ...customTemplate, fields: validFields } : t
      );
    } else {
      const newTemplate = {
        id: Date.now(),
        name: customTemplate.name,
        description: customTemplate.description,
        fields: validFields,
        createdAt: new Date().toISOString()
      };
      updatedTemplates = [...savedTemplates, newTemplate];
    }
    setSavedTemplates(updatedTemplates);
    setCustomTemplate({
      id: null,
      name: '',
      description: '',
      fields: [{ entityType: '', sourceField: '', customName: '' }]
    });
    toast.success('Plantilla guardada correctamente');
  };

  const handleDeleteTemplate = () => {
    if (!templateToDelete) return;
    const updatedTemplates = savedTemplates.filter(t => t.id !== templateToDelete.id);
    setSavedTemplates(updatedTemplates);
    toast.success('Plantilla eliminada correctamente');
    
    // Si la plantilla eliminada era la seleccionada, la deseleccionamos
    if (selectedTemplate && selectedTemplate.id === templateToDelete.id) {
        setSelectedTemplate(null);
        setExportConfig(prev => ({ ...prev, includedFields: [] }));
    }

    setTemplateToDelete(null);
    setIsDeleteAlertOpen(false);
  };

  const selectTemplate = (template) => {
    setSelectedTemplate(template);
    setExportConfig(prevConfig => ({
      ...prevConfig,
      platform: 'custom',
      includedFields: template.fields.map(field => field.customName)
    }));
  };

  const addTemplateField = () => {
    setCustomTemplate(prevCustomTemplate => ({
      ...prevCustomTemplate,
      fields: [...prevCustomTemplate.fields, { entityType: '', sourceField: '', customName: '' }]
    }));
  };

  const removeTemplateField = (index) => {
    setCustomTemplate(prevCustomTemplate => ({
      ...prevCustomTemplate,
      fields: prevCustomTemplate.fields.filter((_, i) => i !== index)
    }));
  };

  const getFilteredSourceFields = (entityType) => {
    return availableSourceFields.filter(field => field.entity === entityType);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Exportar Usuarios</h1>
          <p className="text-slate-600">Exportación a través de plantillas personalizadas</p>
        </div>

        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard">Exportación Personalizada</TabsTrigger>
            <TabsTrigger value="custom">Gestionar Plantillas</TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Download className="w-5 h-5" />
                  Configuración de Exportación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Seleccionar Plantilla</Label>
                  <Select
                    onValueChange={(templateId) => {
                      const template = savedTemplates.find(t => t.id.toString() === templateId);
                      if (template) {
                        selectTemplate(template);
                      }
                    }}
                    value={selectedTemplate ? selectedTemplate.id.toString() : ""}
                  >
                    <SelectTrigger className="w-full md:w-1/2">
                      <SelectValue placeholder="Elige una plantilla..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedTemplates.length > 0 ? (
                        savedTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-templates" disabled>
                          No hay plantillas creadas.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-sm text-slate-600 mt-2">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Usuario</Label>
                    <Select
                      value={exportConfig.userType}
                      onValueChange={handleUserTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        <SelectItem value="alumnos">Alumnos</SelectItem>
                        <SelectItem value="familia">Familia</SelectItem>
                        <SelectItem value="orientador">Orientador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {getVisibleFilters().includes('center') && (
                    <div className="space-y-2">
                      <Label>Centro</Label>
                      <Select
                        value={exportConfig.center}
                        onValueChange={(value) => setExportConfig({ ...exportConfig, center: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los centros</SelectItem>
                          <SelectItem value="centro_001">Centro A</SelectItem>
                          <SelectItem value="centro_002">Centro B</SelectItem>
                          <SelectItem value="centro_003">Centro C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {getVisibleFilters().includes('etapa') && (
                    <div className="space-y-2">
                      <Label>Etapa</Label>
                      <Select
                        value={exportConfig.etapa}
                        onValueChange={(value) => setExportConfig({ ...exportConfig, etapa: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las etapas</SelectItem>
                          <SelectItem value="infantil">Educación Infantil</SelectItem>
                          <SelectItem value="primaria">Educación Primaria</SelectItem>
                          <SelectItem value="eso">ESO</SelectItem>
                          <SelectItem value="bachillerato">Bachillerato</SelectItem>
                          <SelectItem value="fp">Formación Profesional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {getVisibleFilters().includes('curso') && (
                    <div className="space-y-2">
                      <Label>Curso</Label>
                      <Select
                        value={exportConfig.curso}
                        onValueChange={(value) => setExportConfig({ ...exportConfig, curso: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los cursos</SelectItem>
                          <SelectItem value="1_primaria">1º Primaria</SelectItem>
                          <SelectItem value="2_primaria">2º Primaria</SelectItem>
                          <SelectItem value="3_primaria">3º Primaria</SelectItem>
                          <SelectItem value="4_primaria">4º Primaria</SelectItem>
                          <SelectItem value="5_primaria">5º Primaria</SelectItem>
                          <SelectItem value="6_primaria">6º Primaria</SelectItem>
                          <SelectItem value="1_eso">1º ESO</SelectItem>
                          <SelectItem value="2_eso">2º ESO</SelectItem>
                          <SelectItem value="3_eso">3º ESO</SelectItem>
                          <SelectItem value="4_eso">4º ESO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {!getVisibleFilters().includes('grupo') && (
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <Select
                        value={exportConfig.format}
                        onValueChange={(value) => setExportConfig({ ...exportConfig, format: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV (para Excel)</SelectItem>
                          <SelectItem value="json">JSON (.json)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {getVisibleFilters().includes('grupo') && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Grupo</Label>
                      <Select
                        value={exportConfig.grupo}
                        onValueChange={(value) => setExportConfig({ ...exportConfig, grupo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grupos</SelectItem>
                          <SelectItem value="A">Grupo A</SelectItem>
                          <SelectItem value="B">Grupo B</SelectItem>
                          <SelectItem value="C">Grupo C</SelectItem>
                          <SelectItem value="D">Grupo D</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <Select
                        value={exportConfig.format}
                        onValueChange={(value) => setExportConfig({ ...exportConfig, format: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV (para Excel)</SelectItem>
                          <SelectItem value="json">JSON (.json)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Filter className="w-5 h-5" />
                    Campos a Exportar - {selectedTemplate.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedTemplate.fields.map((field, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={field.customName}
                          checked={exportConfig.includedFields.includes(field.customName)}
                          onCheckedChange={() => {
                            const currentFields = exportConfig.includedFields;
                            if (currentFields.includes(field.customName)) {
                              setExportConfig({
                                ...exportConfig,
                                includedFields: currentFields.filter(name => name !== field.customName)
                              });
                            } else {
                              setExportConfig({
                                ...exportConfig,
                                includedFields: [...currentFields, field.customName]
                              });
                            }
                          }}
                        />
                        <Label
                          htmlFor={field.customName}
                          className="flex-1"
                        >
                          {field.customName}
                          <span className="text-xs text-slate-500 block">
                            {field.entityType === 'user' ? 'Usuario' : 'Alumno'}: {field.sourceField}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <strong>Campos seleccionados:</strong> {exportConfig.includedFields.length} de {selectedTemplate.fields.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!selectedTemplate && (
              <Card>
                <CardContent className="text-center py-8">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-600">No has seleccionado ninguna plantilla personalizada</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Elige una plantilla del menú desplegable superior.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="w-5 h-5" />
                  Vista Previa y Exportación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Configuración Actual:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li><strong>Plataforma:</strong> {selectedTemplate ? selectedTemplate.name : 'Ninguna seleccionada'}</li>
                      <li><strong>Tipo de Usuario:</strong> {exportConfig.userType === 'all' ? 'Todos' : exportConfig.userType}</li>
                      {getVisibleFilters().includes('center') && (<li><strong>Centro:</strong> {exportConfig.center === 'all' ? 'Todos' : exportConfig.center}</li>)}
                      {getVisibleFilters().includes('etapa') && (<li><strong>Etapa:</strong> {exportConfig.etapa === 'all' ? 'Todas' : exportConfig.etapa}</li>)}
                      {getVisibleFilters().includes('curso') && (<li><strong>Curso:</strong> {exportConfig.curso === 'all' ? 'Todos' : exportConfig.curso}</li>)}
                      {getVisibleFilters().includes('grupo') && (<li><strong>Grupo:</strong> {exportConfig.grupo === 'all' ? 'Todos' : exportConfig.grupo}</li>)}
                      <li><strong>Formato:</strong> {exportConfig.format.toUpperCase()}</li>
                      <li><strong>Campos:</strong> {selectedTemplate ? `${exportConfig.includedFields.length} de ${selectedTemplate.fields.length} seleccionados` : 'Selecciona una plantilla primero'}</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handlePreview} disabled={!selectedTemplate}>
                      <Eye className="w-4 h-4 mr-2" />
                      Vista Previa
                    </Button>

                    <Button
                      onClick={handleExport}
                      disabled={isExporting || !selectedTemplate || exportConfig.includedFields.length === 0}
                    >
                      {isExporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Exportar Usuarios
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  Crear y Gestionar Plantillas Personalizadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {savedTemplates.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Plantillas Existentes</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {savedTemplates.map((template) => (
                          <div key={template.id} className="border rounded-lg p-3 bg-slate-50">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">{template.name}</h4>
                                <p className="text-sm text-slate-600">{template.description}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(template.createdAt).toLocaleDateString()} • {template.fields.length} campos
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCustomTemplate({
                                      ...template,
                                      fields: template.fields.map(field => ({
                                        ...field,
                                        options: field.options || []
                                      }))
                                    });
                                  }}
                                  className="ml-2"
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTemplateToDelete(template);
                                    setIsDeleteAlertOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template_name">Nombre de la Plantilla *</Label>
                      <Input
                        id="template_name"
                        value={customTemplate.name}
                        onChange={(e) => setCustomTemplate({ ...customTemplate, name: e.target.value })}
                        placeholder="Ej: Exportación PEARSON adaptada"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template_description">Descripción</Label>
                      <Input
                        id="template_description"
                        value={customTemplate.description}
                        onChange={(e) => setCustomTemplate({ ...customTemplate, description: e.target.value })}
                        placeholder="Describe el uso de esta plantilla"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Mapeo de Campos</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCustomTemplate({
                              id: null,
                              name: '',
                              description: '',
                              fields: [{ entityType: '', sourceField: '', customName: '' }]
                            });
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Nueva Plantilla
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addTemplateField}>
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Campo
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {customTemplate.fields.map((field, index) => (
                        <Card key={index} className="p-4 bg-slate-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                            <div className="md:col-span-1 space-y-1">
                              <Label className="text-xs text-slate-600">Tipo</Label>
                              <Select
                                value={field.entityType}
                                onValueChange={(value) => updateTemplateField(index, 'entityType', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {entityTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <Label className="text-xs text-slate-600">Campo de Origen</Label>
                              <Select
                                value={field.sourceField}
                                onValueChange={(value) => updateTemplateField(index, 'sourceField', value)}
                                disabled={!field.entityType}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={!field.entityType ? "Selecciona tipo primero..." : "Seleccionar campo..."} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.entityType && getFilteredSourceFields(field.entityType).map((sourceField) => (
                                    <SelectItem key={sourceField.id} value={sourceField.id}>
                                      {sourceField.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-3 space-y-1">
                              <Label className="text-xs text-slate-600">Nombre en Plantilla</Label>
                              <Input
                                value={field.customName}
                                onChange={(e) => updateTemplateField(index, 'customName', e.target.value)}
                                placeholder="Se auto-completa al seleccionar campo..."
                              />
                            </div>
                            <div className="md:col-span-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTemplateField(index)}
                                disabled={customTemplate.fields.length === 1}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveCustomTemplate}>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Plantilla
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Vista Previa de la Exportación</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData && previewData.length > 0 && Object.keys(previewData[0]).map(header => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData && previewData.length > 0 ? (
                    previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Object.values(row).map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{String(cell)}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={exportConfig.includedFields.length || 1} className="text-center h-24">
                        No se encontraron datos para la vista previa con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es irreversible. Se eliminará permanentemente la plantilla 
                <strong> "{templateToDelete?.name}"</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}
