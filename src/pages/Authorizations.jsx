import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, PenSquare } from 'lucide-react';
import SendByEmail from '../components/authorizations/SendByEmail';
import SendBySignaturit from '../components/authorizations/SendBySignaturit';
import { Toaster } from "sonner";

export default function Authorizations() {
  return (
    <>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/react-quill@1.3.3/dist/quill.snow.css"
        />
      </head>
      <Toaster richColors position="top-center" />
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Envío de Autorizaciones</h1>
            <p className="text-slate-600">Gestiona el envío de consentimientos y documentos para firma</p>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-200/80">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Generar y Enviar por Email
              </TabsTrigger>
              <TabsTrigger value="signaturit" className="flex items-center gap-2">
                <PenSquare className="w-4 h-4" />
                Enviar con Signaturit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generar Documento y Enviar para Firma por Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <SendByEmail />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signaturit" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Envío para Firma Digital con Signaturit</CardTitle>
                </CardHeader>
                <CardContent>
                  <SendBySignaturit />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </>
  );
}