
import React, { useState, useEffect } from 'react';
import EmailRecipientSelector from './EmailRecipientSelector';
import EmailTemplateManager from './EmailTemplateManager';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, FileText, Settings, Info, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { SendEmail } from "@/api/integrations";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function SendByEmail() {
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('emailTemplates');
      setTemplates(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  }, []);

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      const emptyRecipients = template.signers.map(signer => ({
        role: signer.role,
        fullName: '',
        email: '',
      }));
      setSelectedRecipients(emptyRecipients);
      toast.info(`Plantilla "${template.name}" seleccionada. Por favor, asigna los destinatarios.`);
    }
  };
  
  const generateSignatureBlock = (signerName, signerRole) => {
    const nameToShow = signerName || '______________________________';
    return `
      <div style="margin-top: 40px; page-break-inside: avoid; border-top: 1px solid #ccc; padding-top: 15px; width: 280px;">
        <p style="margin: 0; padding: 0;">Fdo.: ${nameToShow}</p>
        <p style="margin: 0; padding: 0; font-size: 12px; color: #555;">${signerRole}</p>
        <div style="margin-top:10px; height: 80px; border: 1px solid #e0e0e0; background-color: #f9f9f9; border-radius: 4px;">
           <p style="color: #aaa; font-size: 12px; text-align: center; padding-top: 30px;">Espacio para firma manual</p>
        </div>
      </div>
    `;
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      toast.error('Por favor, selecciona una plantilla para generar el documento.');
      return;
    }
    const incompleteRecipients = selectedRecipients.filter(r => !r.email.trim());
    if (incompleteRecipients.length > 0) {
      toast.error(`Por favor, introduce el email de los ${incompleteRecipients.length} firmante(s) pendiente(s).`);
      return;
    }

    setIsSending(true);

    try {
      const date = new Date();
      const formattedDate = format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
      
      let documentBody = selectedTemplate.document_content
        .replace(/\[FECHA_ACTUAL\]/g, formattedDate);

      selectedRecipients.forEach((recipient, index) => {
        const rolePlaceholder = new RegExp(escapeRegExp(`[ROL_${index + 1}]`), 'g');
        const namePlaceholder = new RegExp(escapeRegExp(`[NOMBRE_${index + 1}]`), 'g');
        const nameToInsert = recipient.fullName.trim() || '______________________________';
        
        documentBody = documentBody.replace(rolePlaceholder, recipient.role);
        documentBody = documentBody.replace(namePlaceholder, nameToInsert);
      });
      
      let signatureSection = '<h3 style="font-family: sans-serif; margin-top: 50px; border-top: 2px solid #333; padding-top: 20px;">Firmas</h3>';
      selectedRecipients.forEach(recipient => {
        signatureSection += generateSignatureBlock(recipient.fullName, recipient.role);
      });

      const fullHtmlContent = `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <div style="white-space: pre-wrap; margin-bottom: 20px;">${selectedTemplate.intro_message}</div>
          <div style="border: 1px solid #eee; padding: 30px; background-color: #fdfdfd; border-radius: 8px;">
            ${documentBody}
          </div>
          ${signatureSection}
        </div>
      `;
      
      toast.info(`Enviando a ${selectedRecipients.length} destinatario(s)...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const recipient of selectedRecipients) {
        if (!recipient.email || !recipient.email.includes('@')) {
          console.warn(`Saltando destinatario con email inválido: ${recipient.fullName}`);
          errorCount++;
          continue;
        }
        try {
          await SendEmail({
            to: recipient.email,
            subject: selectedTemplate.subject,
            body: fullHtmlContent,
          });
          successCount++;
        } catch (e) {
          console.error(`Error enviando a ${recipient.email}:`, e);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} documento(s) enviado(s) correctamente.`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} envío(s) fallaron. Asegúrate de que los emails pertenecen a usuarios registrados en la aplicación.`);
      }

      if (errorCount === 0) {
        setSelectedTemplate(null);
        setSelectedRecipients([]);
      }

    } catch (error) {
      console.error('Ocurrió un error general al enviar el documento:', error);
      toast.error('Ocurrió un error al iniciar el envío de documentos.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Tabs defaultValue="send" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="send"><FileText className="w-4 h-4 mr-2" />Enviar Documento</TabsTrigger>
        <TabsTrigger value="templates"><Settings className="w-4 h-4 mr-2" />Gestionar Plantillas</TabsTrigger>
      </TabsList>

      <TabsContent value="send" className="space-y-6 pt-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="template-select">1. Selecciona una Plantilla</Label>
              <Select onValueChange={handleTemplateChange} value={selectedTemplate?.id || ''}>
                <SelectTrigger id="template-select"><SelectValue placeholder="Elige una plantilla de documento..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(template => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div>
                <Label>2. Asigna los Destinatarios Firmantes</Label>
                <EmailRecipientSelector
                  requiredRecipients={selectedTemplate.signers}
                  onRecipientsChange={setSelectedRecipients}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTemplate && (
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={isSending}>
              {isSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Generar y Enviar a {selectedRecipients.length} Firmante(s)
            </Button>
          </div>
        )}

        {!selectedTemplate && templates.length === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No hay plantillas</AlertTitle>
            <AlertDescription>
              Ve a la pestaña "Gestionar Plantillas" para crear tu primer documento.
            </AlertDescription>
          </Alert>
        )}
      </TabsContent>

      <TabsContent value="templates" className="pt-4">
        <EmailTemplateManager />
      </TabsContent>
    </Tabs>
  );
}
