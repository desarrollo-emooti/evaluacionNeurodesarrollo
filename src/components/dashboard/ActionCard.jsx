import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActionCard({ icon: Icon, title, description, link, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <Skeleton className="w-10 h-10 rounded-lg mb-4" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </div>
    );
  }

  return (
    <Link to={link}>
      <Card className="group bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between border-white/20">
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="w-12 h-12 primary-gradient rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </CardContent>
        <div className="p-6 pt-0">
           <div className="flex items-center text-sm font-medium text-blue-600 group-hover:gap-2 transition-all duration-300">
              Ver más <ArrowRight className="w-4 h-4 ml-1" />
           </div>
        </div>
      </Card>
    </Link>
  );
}