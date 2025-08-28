import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Save, X, FileText, Users, Info } from 'lucide-react';
import { toast } from "sonner";
import ReactQuill from 'react-quill';

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem('emailTemplates');
      return stored ? JSON.parse(stored) : [
        {
          id: 'convenio_basico',
          name: 'Convenio Básico',
          description: 'Convenio estándar de colaboración para dos firmantes.',
          subject: 'Firma Requerida: Convenio de Colaboración',
          intro_message: 'Estimados/as,\n\nPor favor, revisen el siguiente Convenio de Colaboración. Para formalizarlo, es necesario que impriman este correo, lo firmen en los espacios indicados y lo envíen escaneado en respuesta a este mismo email.\n\nMuchas gracias por su colaboración.',
          document_content: '<h2>Convenio de Colaboración</h2><p>Celebrado el día [FECHA_ACTUAL], entre:</p><p><strong>[NOMBRE_1]</strong> en calidad de <strong>[ROL_1]</strong></p><p>Y</p><p><strong>[NOMBRE_2]</strong> en calidad de <strong>[ROL_2]</strong></p><p>Ambas partes acuerdan los siguientes términos...</p>',
          signers: [
            { role: 'Representante del Centro' },
            { role: 'Representante de EMOOTI' }
          ]
        },
      ];
    } catch {
      return [];
    }
  });

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    subject: '',
    intro_message: '',
    document_content: '',
    signers: [{ role: '' }]
  });

  useEffect(() => {
    try {
      localStorage.setItem('emailTemplates', JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  }, [templates]);

  const openTemplateDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateData({
        name: template.name,
        description: template.description,
        subject: template.subject,
        intro_message: template.intro_message || '',
        document_content: template.document_content || '',
        signers: template.signers || [{ role: '' }]
      });
    } else {
      setEditingTemplate(null);
      setTemplateData({
        name: '', description: '', subject: '',
        intro_message: '', document_content: '',
        signers: [{ role: '' }]
      });
    }
    setShowTemplateDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!templateData.name.trim() || !templateData.subject.trim()) {
      toast.error('El nombre y el asunto de la plantilla son obligatorios.');
      return;
    }
    const validSigners = templateData.signers.filter(s => s.role.trim());
    if (validSigners.length === 0) {
      toast.error('Debe haber al menos un firmante con un rol definido.');
      return;
    }

    const template = {
      id: editingTemplate?.id || `template_${Date.now()}`,
      ...templateData,
      signers: validSigners
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? template : t));
      toast.success('Plantilla actualizada correctamente.');
    } else {
      setTemplates(prev => [...prev, template]);
      toast.success('Plantilla creada correctamente.');
    }
    setShowTemplateDialog(false);
  };

  const handleDelete = () => {
    if (!templateToDelete) return;
    setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
    toast.success('Plantilla eliminada.');
    setShowDeleteDialog(false);
    setTemplateToDelete(null);
  };

  const addSigner = () => setTemplateData(prev => ({ ...prev, signers: [...prev.signers, { role: '' }] }));
  const updateSignerRole = (index, value) => setTemplateData(prev => ({ ...prev, signers: prev.signers.map((s, i) => i === index ? { ...s, role: value } : s) }));
  const removeSigner = (index) => setTemplateData(prev => ({ ...prev, signers: prev.signers.filter((_, i) => i !== index) }));

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'], ['clean']
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestor de Plantillas de Documentos</h3>
          <p className="text-sm text-slate-600">Crea plantillas con contenido y roles de firmantes.</p>
        </div>
        <Button onClick={() => openTemplateDialog()}><Plus className="w-4 h-4 mr-2" />Nueva Plantilla</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base"><FileText className="w-5 h-5" />{template.name}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openTemplateDialog(template)}><Edit className="w-3 h-3" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => { setTemplateToDelete(template); setShowDeleteDialog(true); }}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3">{template.description}</p>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Users className="w-4 h-4" /><span>{template.signers.length} firmante(s):</span>
                <span className="text-slate-500">{template.signers.map(s => s.role).join(', ')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="name">Nombre *</Label><Input id="name" value={templateData.name} onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })} required /></div>
              <div><Label htmlFor="description">Descripción</Label><Input id="description" value={templateData.description} onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })} /></div>
            </div>
            <div><Label htmlFor="subject">Asunto del Email *</Label><Input id="subject" value={templateData.subject} onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })} required /></div>
            <div><Label htmlFor="intro_message">Mensaje de Introducción del Email</Label><Textarea id="intro_message" value={templateData.intro_message} onChange={(e) => setTemplateData({ ...templateData, intro_message: e.target.value })} placeholder="Este texto aparecerá al inicio del email..." rows={3} /></div>
            
            <div>
              <Label>Contenido del Documento</Label>
              <div className="bg-white rounded-md border">
                <ReactQuill theme="snow" modules={quillModules} value={templateData.document_content} onChange={(content) => setTemplateData({ ...templateData, document_content: content })} />
              </div>
              <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded-md border flex items-start gap-2">
                <Info className="w-6 h-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Usa placeholders como <strong>[FECHA_ACTUAL]</strong>, <strong>[ROL_1]</strong>, y <strong>[NOMBRE_1]</strong> para autorellenar datos. El número corresponde al orden de los firmantes.</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3"><Label className="text-base font-semibold">Roles de Firmantes</Label><Button type="button" onClick={addSigner} size="sm"><Plus className="w-4 h-4 mr-2" />Agregar Rol</Button></div>
              <div className="space-y-3">
                {templateData.signers.map((signer, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-slate-50 flex items-center gap-3">
                    <Label className="text-sm shrink-0">Rol Firmante {index + 1} *</Label>
                    <Input className="flex-grow" value={signer.role} onChange={(e) => updateSignerRole(index, e.target.value)} placeholder={`Ej: Director del Centro`} />
                    {templateData.signers.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeSigner(index)} className="text-red-500 hover:bg-red-100"><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(false)}><X className="w-4 h-4 mr-2" />Cancelar</Button>
              <Button type="submit"><Save className="w-4 h-4 mr-2" />{editingTemplate ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará la plantilla "{templateToDelete?.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}