import React, { useState, useEffect } from 'react';
import { TestAssignment } from '@/api/entities';
import { Student } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, ClipboardCheck, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestAssignmentPage() {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
    
    // Leer parámetros URL para establecer filtros
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam) {
      if (statusParam === 'realizado') {
        setStatusFilter('Sí');
      } else if (statusParam === 'pendiente') {
        setStatusFilter('Pendiente');
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsList, studentsList] = await Promise.all([
        TestAssignment.list('-assigned_date'),
        Student.list()
      ]);
      setAssignments(assignmentsList);
      setStudents(studentsList);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear un mapa de estudiantes para lookup rápido
  const studentsMap = new Map(students.map(s => [s.id, s]));

  const filteredAssignments = assignments.filter(assignment => {
    const student = studentsMap.get(assignment.student_id);
    const studentName = student?.full_name || 'Estudiante no encontrado';
    
    const matchesSearch = 
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.test_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.assigned_by?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.test_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusColors = {
      'Sí': 'bg-green-100 text-green-800',
      'No': 'bg-red-100 text-red-800', 
      'Pendiente': 'bg-yellow-100 text-yellow-800',
      'N/A': 'bg-gray-100 text-gray-800'
    };
    
    const displayStatus = status || 'Pendiente';
    const colorClass = statusColors[displayStatus] || statusColors['Pendiente'];
    
    return (
      <Badge className={colorClass}>
        {displayStatus === 'Sí' && <ClipboardCheck className="w-3 h-3 mr-1" />}
        {displayStatus === 'Pendiente' && <Clock className="w-3 h-3 mr-1" />}
        {displayStatus === 'No' && <AlertCircle className="w-3 h-3 mr-1" />}
        {displayStatus}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'baja': 'bg-blue-100 text-blue-800',
      'media': 'bg-yellow-100 text-yellow-800',
      'alta': 'bg-orange-100 text-orange-800',
      'urgente': 'bg-red-100 text-red-800'
    };
    
    const displayPriority = priority || 'media';
    const colorClass = priorityColors[displayPriority] || priorityColors['media'];
    
    return <Badge className={colorClass}>{displayPriority}</Badge>;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Asignación de Pruebas</h1>
          <p className="text-slate-600">
            Gestiona las asignaciones de pruebas a los alumnos y su estado de realización
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Asignaciones</CardTitle>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 min-w-[250px] md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar por alumno o prueba..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Sí">Realizada</SelectItem>
                  <SelectItem value="No">No realizada</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alumno</TableHead>
                    <TableHead>Prueba</TableHead>
                    <TableHead>Fecha Programada</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Asignado Por</TableHead>
                    <TableHead>Consentimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(8).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredAssignments.length > 0 ? (
                    filteredAssignments.map((assignment) => {
                      const student = studentsMap.get(assignment.student_id);
                      return (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {student?.full_name || 'Estudiante no encontrado'}
                          </TableCell>
                          <TableCell>{assignment.test_title}</TableCell>
                          <TableCell>
                            {assignment.test_date ? new Date(assignment.test_date).toLocaleDateString() : 'No programada'}
                          </TableCell>
                          <TableCell>{getStatusBadge(assignment.test_status)}</TableCell>
                          <TableCell>{getPriorityBadge(assignment.priority)}</TableCell>
                          <TableCell className="text-slate-600">{assignment.assigned_by || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(assignment.consent_given)}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan="7" className="h-24 text-center">
                        No se encontraron asignaciones.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 text-sm text-slate-600">
              Mostrando {filteredAssignments.length} asignaciones
              {statusFilter !== 'all' && ` con estado: ${statusFilter}`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}