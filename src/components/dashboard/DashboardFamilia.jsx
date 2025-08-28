import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Award, Calendar } from 'lucide-react';

const FamilyStatsCard = ({ title, value, icon: Icon }) => (
  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ResultCard = ({ title, description, image }) => (
  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <div className="flex flex-col md:flex-row items-center">
      <div className="md:w-1/3">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-6">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-600 mb-4">{description}</p>
        <Button variant="outline">Ver Detalles</Button>
      </div>
    </div>
  </Card>
);

const RecommendationCard = ({ title, description, image }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 mb-4">{description}</p>
                <Button variant="outline">Ver Actividades</Button>
            </div>
            <div className="md:w-1/3">
                <img src={image} alt={title} className="w-full h-full object-cover" />
            </div>
        </div>
    </Card>
);

export default function DashboardFamilia({ user }) {
  // Simulación de datos
  const childName = "Sofía";

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">¡Bienvenida, {user?.full_name?.split(' ')[0]}!</h1>
          <p className="text-slate-600 text-lg">Aquí encontrarás información sobre el neurodesarrollo y bienestar emocional de tu hijo.</p>
        </div>
        
        <Tabs defaultValue="resumen" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="informe">Informe</TabsTrigger>
            <TabsTrigger value="pruebas">Pruebas Realizadas</TabsTrigger>
            <TabsTrigger value="consulta">Información y estudios</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="mt-8">
            <div className="space-y-8">
                {/* Métricas clave */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FamilyStatsCard title="Pruebas completadas" value="85%" icon={CheckCircle} />
                    <FamilyStatsCard title="Evaluación global" value="78/100" icon={Award} />
                    <FamilyStatsCard title="Próximas Evaluaciones" value="20 de Julio, 2024" icon={Calendar} />
                </div>
                
                {/* Resumen de resultados */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Resumen de Resultados</h2>
                    <div className="space-y-6">
                        <ResultCard
                            title="Evaluación de Neurodesarrollo"
                            description="Es un proceso estructurado que analiza el desarrollo madurativo, motor, cognitivo, comunicativo y conductual de un niño en relación con su edad."
                            image="https://images.unsplash.com/photo-1544717301-9cdcb1f5940f?w=400&auto=format&fit=crop"
                        />
                        <ResultCard
                            title="Evaluación de Bienestar Emocional"
                            description="Análisis sobre el estado emocional, cognitivo y social y posibles necesidades de apoyo o intervención."
                            image="https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&auto=format&fit=crop"
                        />
                    </div>
                </div>

                {/* Recomendaciones */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Recomendaciones</h2>
                     <RecommendationCard
                        title="Actividades para el Neurodesarrollo"
                        description="Sugerencias de actividades para estimular el neurodesarrollo de tus hijos."
                        image="https://images.unsplash.com/photo-1590374585458-a9683e34b8c8?w=400&auto=format&fit=crop"
                    />
                </div>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}