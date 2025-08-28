import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle, ArrowRight } from "lucide-react";

const alertConfig = {
  high: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  medium: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  low: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' }
};

export default function AlertsWidget({ alerts }) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-slate-600" />
          Sistema de Alertas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => {
            const config = alertConfig[alert.level] || alertConfig.low;
            const Icon = config.icon;
            return (
              <div key={index} className={`p-4 rounded-xl flex items-start gap-4 ${config.bg} border border-slate-200/50`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${config.color} bg-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{alert.title} ({alert.count})</p>
                  <p className="text-sm text-slate-600">{alert.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 self-center" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}