
import React, { useState, useEffect } from 'react';
import { DataProvider } from '../components/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Users } from 'lucide-react';
import { Toaster } from "sonner";
import B2BPayment from '../components/payments/B2BPayment';
import B2B2CPayment from '../components/payments/B2B2CPayment';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('b2b');

  // Leer parámetros URL para establecer tab inicial
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  return (
    <DataProvider>
      <Toaster richColors position="top-center" />
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gestión de Pagos</h1>
            <p className="text-slate-600">Genera y envía solicitudes de cobro a centros y familias.</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-200/80 mb-6">
              <TabsTrigger value="b2b" className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                <Briefcase className="w-4 h-4" />
                B2B (Cobro a Centros)
              </TabsTrigger>
              <TabsTrigger value="b2b2c" className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                <Users className="w-4 h-4" />
                B2B2C (Cobro a Familias)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="b2b">
              <B2BPayment />
            </TabsContent>

            <TabsContent value="b2b2c">
              <B2B2CPayment />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </DataProvider>
  );
}
