
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useData } from '../DataContext';
import { Student } from '@/api/entities';
import { Center } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function B2BPayment() {
  const { students, centers, loadData } = useData();
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ center: 'all', etapa: 'all', course: 'all', group: 'all' });
  const [pricePerStudent, setPricePerStudent] = useState('');
  const [selectedCenterId, setSelectedCenterId] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Nuevos estados para forzar email
  const [forceEmailMode, setForceEmailMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  const centerMap = useMemo(() => new Map(centers.map(c => [c.id, c.name])), [centers]);
  // The following lines are kept as they are. The filter(Boolean) already handles null, undefined, and empty strings,
  // ensuring that only valid, truthy values are passed to the Set constructor, which prevents issues.
  const uniqueEtapas = useMemo(() => [...new Set(students.map(s => s.etapa).filter(Boolean))], [students]);
  const uniqueCourses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))], [students]);
  const uniqueGroups = useMemo(() => [...new Set(students.map(s => s.class_group).filter(Boolean))], [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filtrar primero por tipo de pago
      if (student.payment_type !== 'B2B') return false;

      const searchMatch = Object.values(student).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const centerMatch = filters.center === 'all' || student.center_id === filters.center;
      const etapaMatch = filters.etapa === 'all' || student.etapa === filters.etapa;
      const courseMatch = filters.course === 'all' || student.course === filters.course;
      const groupMatch = filters.group === 'all' || student.class_group === filters.group;
      
      return searchMatch && centerMatch && etapaMatch && courseMatch && groupMatch;
    });
  }, [students, searchTerm, filters]);

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  // Lógica inteligente para centro receptor
  const selectedStudentsData = useMemo(() => {
    return students.filter(s => selectedStudents.includes(s.id));
  }, [students, selectedStudents]);

  const centerLogic = useMemo(() => {
    if (selectedStudentsData.length === 0) return { type: 'none', options: [] };
    
    const uniqueCenterIds = [...new Set(selectedStudentsData.map(s => s.center_id))];
    const availableCenters = centers.filter(c => uniqueCenterIds.includes(c.id) && c.email);
    
    if (uniqueCenterIds.length === 1 && availableCenters.length === 1) {
      // Todos los alumnos son del mismo centro Y este centro tiene email
      return { 
        type: 'single', 
        center: availableCenters[0],
        options: availableCenters 
      };
    } else {
      // Alumnos de diferentes centros o el centro único no tiene email
      return { 
        type: 'multiple', 
        center: null,
        options: centers.filter(c => c.email) // Show all centers with email if multiple students selected or single center without email
      };
    }
  }, [selectedStudentsData, centers]);

  // Efecto para auto-seleccionar centro cuando sea único
  useEffect(() => {
    if (centerLogic.type === 'single' && centerLogic.center) {
      setSelectedCenterId(centerLogic.center.id);
    } else if (centerLogic.type === 'multiple' || centerLogic.type === 'none') {
      setSelectedCenterId(''); // Reset cuando hay múltiples opciones o ningún alumno seleccionado
    }
  }, [centerLogic]);

  const handleSendToCollection = async () => {
    const emailToUse = forceEmailMode ? customEmail : (centers.find(c => c.id === selectedCenterId)?.email);
    const recipientCenter = centers.find(c => c.id === selectedCenterId);

    if (selectedStudents.length === 0 || !pricePerStudent) {
      toast.error("Por favor, selecciona alumnos y un precio por alumno.");
      return;
    }

    if (!forceEmailMode && (!selectedCenterId || !recipientCenter || !recipientCenter.email)) {
      toast.error("Por favor, selecciona un centro receptor con email configurado o activa 'Forzar email personalizado'.");
      return;
    }

    if (forceEmailMode) {
      if (!customEmail) {
        toast.error("Por favor, introduce un email personalizado.");
        return;
      }
      if (!customEmail.includes('@') || !customEmail.includes('.')) {
        toast.error("Por favor, introduce un email válido en el campo personalizado.");
        return;
      }
    }
    
    setIsSending(true);
    try {
      const updatePromises = selectedStudents.map(id => 
        Student.update(id, { payment_status: 'Pendiente' })
      );
      await Promise.all(updatePromises);

      const totalAmount = (selectedStudents.length * parseFloat(pricePerStudent)).toFixed(2);
      const studentDetails = students
        .filter(s => selectedStudents.includes(s.id))
        .map(s => `<li>${s.full_name} (${s.course}${s.class_group ? ` - ${s.class_group}` : ''})</li>`)
        .join('');

      const recipientName = forceEmailMode ? customEmail.split('@')[0] : (recipientCenter?.name || 'Centro Educativo');

      const emailBody = `
        <h1>Solicitud de Cobro</h1>
        <p>Estimado equipo de <strong>${recipientName}</strong>,</p>
        <p>Se ha generado una solicitud de cobro para los siguientes servicios educativos:</p>
        <ul>
          <li><strong>Nº de Alumnos:</strong> ${selectedStudents.length}</li>
          <li><strong>Precio por Alumno:</strong> ${parseFloat(pricePerStudent).toFixed(2)} €</li>
          <li><strong>Importe Total:</strong> ${totalAmount} €</li>
        </ul>
        <h3>Relación de Alumnos:</h3>
        <ul>${studentDetails}</ul>
        <p>Por favor, procedan con la gestión del pago. Gracias por su colaboración.</p>
        <p>Atentamente,<br/>El equipo de EMOOTI</p>
      `;

      await SendEmail({
        to: emailToUse,
        subject: `Solicitud de Cobro - Servicios EMOOTI`,
        body: emailBody,
      });

      toast.success(`Solicitud de cobro enviada${forceEmailMode ? ' al email personalizado' : ` a ${recipientName}`}. ${selectedStudents.length} alumnos actualizados a "Pendiente".`);
      
      setSelectedStudents([]);
      setPricePerStudent('');
      setSelectedCenterId('');
      setForceEmailMode(false);
      setCustomEmail('');
      await loadData();

    } catch (error) {
      toast.error(`Error al enviar a cobro: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Seleccionar Alumnos (Tipo de Pago B2B)</CardTitle>
          <div className="flex flex-wrap gap-2 pt-4">
            <div className="relative flex-grow"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input placeholder="Buscar alumno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" /></div>
            <Select value={filters.center} onValueChange={v => setFilters(f => ({...f, center: v}))}><SelectTrigger className="min-w-[180px]"><SelectValue placeholder="Centro..." /></SelectTrigger><SelectContent>{centers.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}<SelectItem value="all">Todos los Centros</SelectItem></SelectContent></Select>
            <Select value={filters.etapa} onValueChange={v => setFilters(f => ({...f, etapa: v}))}><SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Etapa..." /></SelectTrigger><SelectContent>{uniqueEtapas.map(e=><SelectItem key={e} value={e}>{e}</SelectItem>)}<SelectItem value="all">Todas las Etapas</SelectItem></SelectContent></Select>
            <Select value={filters.course} onValueChange={v => setFilters(f => ({...f, course: v}))}><SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Curso..." /></SelectTrigger><SelectContent>{uniqueCourses.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}<SelectItem value="all">Todos los Cursos</SelectItem></SelectContent></Select>
            <Select value={filters.group} onValueChange={v => setFilters(f => ({...f, group: v}))}><SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Grupo..." /></SelectTrigger><SelectContent>{uniqueGroups.map(g=><SelectItem key={g} value={g}>{g}</SelectItem>)}<SelectItem value="all">Todos los Grupos</SelectItem></SelectContent></Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white"><TableRow><TableHead className="w-12"><Checkbox checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} onCheckedChange={handleSelectAll} /></TableHead><TableHead>Nombre</TableHead><TableHead>Curso</TableHead><TableHead>Centro</TableHead><TableHead>Estado Pago</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                    <TableCell><Checkbox checked={selectedStudents.includes(student.id)} onCheckedChange={() => handleSelectStudent(student.id)} /></TableCell>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.course}{student.class_group && ` - ${student.class_group}`}</TableCell>
                    <TableCell>{centerMap.get(student.center_id) || 'N/A'}</TableCell>
                    <TableCell>{student.payment_status || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle>2. Configurar Envío</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Centro Receptor *</label>
              {centerLogic.type === 'single' ? (
                <div className="flex items-center gap-2">
                  <Input 
                    value={centerLogic.center?.name || ''} 
                    disabled 
                    className="bg-slate-50"
                  />
                  <span className="text-xs text-slate-500">Auto-seleccionado</span>
                </div>
              ) : centerLogic.type === 'multiple' ? (
                <Select value={selectedCenterId} onValueChange={setSelectedCenterId} disabled={forceEmailMode}>
                  <SelectTrigger><SelectValue placeholder="Elegir centro receptor..." /></SelectTrigger>
                  <SelectContent>
                    {centerLogic.options.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Selecciona alumnos primero" disabled className="bg-slate-50" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio por Alumno (€) *</label>
              <Input type="number" placeholder="Ej: 50.00" value={pricePerStudent} onChange={e => setPricePerStudent(e.target.value)} />
            </div>
          </div>
          
          {/* Sección Forzar Email */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox 
                id="forceEmail" 
                checked={forceEmailMode} 
                onCheckedChange={setForceEmailMode}
              />
              <label htmlFor="forceEmail" className="text-sm font-medium">
                Forzar email personalizado (sobrescribe el email del centro)
              </label>
            </div>
            {forceEmailMode && (
              <Input
                type="email"
                placeholder="ejemplo@email.com"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="max-w-md"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              onClick={handleSendToCollection} 
              disabled={isSending || selectedStudents.length === 0 || !pricePerStudent || 
                        (!forceEmailMode && !selectedCenterId) || // No force email AND no center selected
                        (forceEmailMode && !customEmail)} // Force email AND no custom email
            >
              {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Enviando...</> : <><Send className="mr-2 h-4 w-4"/>Enviar a Cobro ({selectedStudents.length})</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
