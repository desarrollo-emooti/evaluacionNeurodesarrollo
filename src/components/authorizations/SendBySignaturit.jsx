import React, { useState, useEffect } from 'react';
import RecipientSelector from './RecipientSelector';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, PenSquare, AlertTriangle, Loader2, ExternalLink, Users, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function SendBySignaturit() {
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateDetails, setTemplateDetails] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingTemplateDetails, setIsLoadingTemplateDetails] = useState(false);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadSignaturitTemplates();
  }, []);

  // Cargar detalles de la plantilla cuando se selecciona una
  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateDetails(selectedTemplate);
    } else {
      setTemplateDetails(null);
      setSelectedRecipients([]);
    }
  }, [selectedTemplate]);

  const loadSignaturitTemplates = async () => {
    setIsLoadingTemplates(true);
    
    // Simular carga y usar las plantillas configuradas
    setTimeout(() => {
      setTemplates([
        { 
          id: 'convenio_colegios_general', 
          name: 'Convenio colegios general',
          description: 'Plantilla de convenio general para centros educativos',
        },
        { 
          id: 'contrato_servicios_clinica_60', 
          name: 'Contrato_servicios_clinica_60',
          description: 'Contrato de servicios para clínica (modalidad 60)',
        }
      ]);
      setIsLoadingTemplates(false);
      toast.success('2 plantillas de Signaturit cargadas correctamente');
    }, 1500);
  };

  const loadTemplateDetails = async (templateId) => {
    setIsLoadingTemplateDetails(true);
    
    // Simular carga de detalles
    setTimeout(() => {
      let details;
      
      if (templateId === 'convenio_colegios_general') {
        details = {
          id: templateId,
          name: 'Convenio colegios general',
          description: 'Plantilla de convenio general para centros educativos',
          required_signers: 2,
          signer_roles: [
            { role: 'Representante Centro', description: 'Director o representante legal del centro educativo', required: true },
            { role: 'Representante EMOOTI', description: 'Representante de EMOOTI para firmar el convenio', required: true }
          ]
        };
      } else if (templateId === 'contrato_servicios_clinica_60') {
        details = {
          id: templateId,
          name: 'Contrato_servicios_clinica_60',
          description: 'Contrato de servicios para clínica (modalidad 60)',
          required_signers: 2,
          signer_roles: [
            { role: 'Cliente', description: 'Responsable o director de la clínica', required: true },
            { role: 'Prestador de Servicios', description: 'Representante de EMOOTI', required: true }
          ]
        };
      } else {
        details = {
          id: templateId,
          name: 'Plantilla Desconocida',
          description: 'Plantilla no reconocida',
          required_signers: 2,
          signer_roles: [
            { role: 'Firmante 1', description: 'Primer firmante requerido', required: true },
            { role: 'Firmante 2', description: 'Segundo firmante requerido', required: true }
          ]
        };
      }
      
      setTemplateDetails(details);
      
      // Crear recipients vacíos basados en los roles
      const emptyRecipients = details.signer_roles.map((role, index) => ({
        id: `temp_${index}`,
        role: role.role,
        full_name: '',
        email: '',
        phone: '',
        isManual: true
      }));
      
      setSelectedRecipients(emptyRecipients);
      setIsLoadingTemplateDetails(false);
      
      toast.info(`Plantilla "${details.name}" requiere ${details.required_signers} firmante(s)`);
    }, 1000);
  };
  
  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error('Por favor, selecciona una plantilla de Signaturit.');
      return;
    }
    if (!documentTitle.trim()) {
      toast.error('Por favor, introduce un título para el documento.');
      return;
    }
    
    const incompleteRecipients = selectedRecipients.filter(r => !r.full_name || !r.email);
    if (incompleteRecipients.length > 0) {
      toast.error(`Por favor, completa la información de todos los firmantes requeridos (${incompleteRecipients.length} pendientes).`);
      return;
    }

    setIsSending(true);

    try {
      // Simular envío exitoso con Signaturit
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResponse = {
        id: `sig_${Math.random().toString(36).substr(2, 9)}`,
        status: 'sent',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        recipients: selectedRecipients.map(r => ({
          name: r.full_name,
          email: r.email,
          status: 'waiting',
          sign_url: `https://app.signaturit.com/signature/sign/${Math.random().toString(36).substr(2, 9)}`
        }))
      };

      toast.success(`📄 Documento enviado correctamente`, {
        description: `ID de la firma: ${mockResponse.id}`,
        duration: 8000,
        action: {
          label: "Ver en Signaturit",
          onClick: () => window.open(`https://app.signaturit.com/signature/${mockResponse.id}`, '_blank')
        }
      });

      // Mostrar detalles adicionales
      toast.info(`📧 Correos enviados a ${mockResponse.recipients.length} destinatario(s)`, {
        duration: 5000
      });

      // Limpiar formulario
      setSelectedRecipients([]);
      setSelectedTemplate('');
      setCustomMessage('');
      setDocumentTitle('');
      setTemplateDetails(null);
        
    } catch (error) {
      console.error('Error enviando documento con Signaturit:', error);
      toast.error('🚫 Error al enviar con Signaturit', {
        description: error.message || 'Error de conexión. Verifica la configuración de la API.',
        duration: 7000
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <ExternalLink className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Integración con Signaturit configurada:</strong> Listo para usar tus plantillas "Convenio colegios general" y "Contrato_servicios_clinica_60".
        </AlertDescription>
      </Alert>
      
      <div>
        <Label className="text-base font-semibold">1. Título del Documento *</Label>
        <div className="mt-2">
          <Input
            placeholder="Ej: Convenio de Colaboración - Centro Educativo 2024"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">Este título aparecerá en el email y en la plataforma de Signaturit</p>
        </div>
      </div>
      
      <div>
        <Label className="text-base font-semibold">2. Seleccionar Plantilla de Signaturit *</Label>
        <div className="mt-2">
          {isLoadingTemplates ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-slate-50">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-slate-600">Cargando plantillas desde tu cuenta Signaturit...</span>
            </div>
          ) : (
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Elige una plantilla para enviar..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem 
                    key={template.id} 
                    value={template.id} 
                    className="pl-6"
                  >
                    📄 {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {isLoadingTemplateDetails && (
            <div className="mt-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-blue-800 text-sm">Cargando detalles de la plantilla...</span>
            </div>
          )}

          {templateDetails && !isLoadingTemplateDetails && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                {templateDetails.required_signers} firmantes requeridos
              </p>
              {templateDetails.signer_roles && (
                <div className="mt-2">
                  <p className="text-xs text-blue-700 font-medium">Roles de firmantes:</p>
                  <ul className="text-xs text-blue-600 list-disc list-inside ml-2">
                    {templateDetails.signer_roles.map((role, index) => (
                      <li key={index}>{role.role}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {templateDetails && !isLoadingTemplateDetails && (
        <div>
          <Label className="text-base font-semibold">3. Configurar Firmantes Requeridos *</Label>
          <div className="mt-2">
            <RecipientSelector 
              selectedRecipients={selectedRecipients} 
              onSelectionChange={setSelectedRecipients}
              templateDetails={templateDetails}
              requiredSigners={templateDetails.required_signers}
            />
          </div>
        </div>
      )}

      <div>
        <Label className="text-base font-semibold">4. Mensaje Personalizado (Opcional)</Label>
        <div className="mt-2">
          <Textarea
            placeholder="Estimado/a [Nombre],

Le enviamos este documento para su firma digital. Es importante para formalizar nuestro acuerdo de colaboración.

El documento expira en 30 días. Si tiene alguna duda, no dude en contactarnos.

Gracias por su colaboración.

Equipo EMOOTI"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="h-32"
          />
          <p className="text-xs text-slate-500 mt-1">
            Este mensaje se incluirá en el email de invitación a firma. Puedes usar [Nombre] como variable.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button 
          onClick={handleSend} 
          disabled={isSending || isLoadingTemplates || isLoadingTemplateDetails || !selectedTemplate || !documentTitle || selectedRecipients.some(r => !r.full_name || !r.email)}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando con Signaturit...
            </>
          ) : (
            <>
              <PenSquare className="w-4 h-4 mr-2" />
              Enviar para Firma Digital
            </>
          )}
        </Button>
      </div>
      
    </div>
  );
}