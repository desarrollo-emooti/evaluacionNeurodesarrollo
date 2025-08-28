import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from 'react-router-dom';

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  isLoading,
  onTitleClick,
  onValueClick,
  titleHref,
  valueHref,
  trendHref,
  onTrendClick
}) {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800 border-blue-200",
    green: "bg-gradient-to-br from-green-50 to-green-100 text-green-800 border-green-200",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800 border-orange-200",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800 border-purple-200",
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600", 
    orange: "text-orange-600",
    purple: "text-purple-600",
  };

  if (isLoading) {
    return (
      <Card className={`${colorClasses[color] || colorClasses.blue} border shadow-sm`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24 bg-white/50" />
              <Skeleton className="h-8 w-16 bg-white/50" />
              <Skeleton className="h-3 w-32 bg-white/50" />
            </div>
            <Skeleton className="w-12 h-12 rounded-full bg-white/50" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const CardTitle = ({ children, href, onClick }) => {
    if (href) {
      return (
        <Link to={href} className="hover:underline cursor-pointer">
          {children}
        </Link>
      );
    }
    if (onClick) {
      return (
        <button onClick={onClick} className="hover:underline cursor-pointer text-left">
          {children}
        </button>
      );
    }
    return children;
  };

  const CardValue = ({ children, href, onClick }) => {
    if (href) {
      return (
        <Link to={href} className="hover:underline cursor-pointer block">
          {children}
        </Link>
      );
    }
    if (onClick) {
      return (
        <button onClick={onClick} className="hover:underline cursor-pointer text-left">
          {children}
        </button>
      );
    }
    return children;
  };

  const TrendText = ({ children, href, onClick }) => {
    if (href) {
      return (
        <Link to={href} className="hover:underline cursor-pointer">
          {children}
        </Link>
      );
    }
    if (onClick) {
      return (
        <button onClick={onClick} className="hover:underline cursor-pointer text-left">
          {children}
        </button>
      );
    }
    return children;
  };

  return (
    <Card className={`${colorClasses[color] || colorClasses.blue} border shadow-sm hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <CardTitle href={titleHref} onClick={onTitleClick}>
              <h3 className="text-sm font-medium text-slate-700">{title}</h3>
            </CardTitle>
            <CardValue href={valueHref} onClick={onValueClick}>
              <p className="text-3xl font-bold">{value}</p>
            </CardValue>
            {trend && (
              <TrendText href={trendHref} onClick={onTrendClick}>
                <p className="text-sm text-slate-600">{trend}</p>
              </TrendText>
            )}
          </div>
          {Icon && (
            <div className={`w-12 h-12 rounded-full bg-white/30 flex items-center justify-center ${iconColors[color] || iconColors.blue}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}