
import React, { useState, useMemo, useContext } from 'react';
import { useData } from '../DataContext';
import { Student } from '@/api/entities';
import { User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function B2B2CPayment() {
  const { students, centers, users, loadData } = useData();
  const familyUsers = useMemo(() => users.filter(u => u.user_type === 'familia' && u.email), [users]);
  
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ center: 'all', etapa: 'all', course: 'all', group: 'all' });
  const [pricePerStudent, setPricePerStudent] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Nuevos estados para forzar email
  const [forceEmailMode, setForceEmailMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  const centerMap = useMemo(() => new Map(centers.map(c => [c.id, c.name])), [centers]);
  const uniqueEtapas = useMemo(() => [...new Set(students.map(s => s.etapa).filter(Boolean))], [students]);
  const uniqueCourses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))], [students]);
  const uniqueGroups = useMemo(() => [...new Set(students.map(s => s.class_group).filter(Boolean))], [students]);
  
  const studentFamilyMap = useMemo(() => {
      const map = new Map();
      students.forEach(student => {
          if (student.family_user_id) {
              const family = familyUsers.find(u => u.id === student.family_user_id);
              if (family) {
                  map.set(student.id, family);
              }
          }
      });
      return map;
  }, [students, familyUsers]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filtrar primero por tipo de pago
      if (student.payment_type !== 'B2B2C') {
        return false;
      }
      
      const searchMatch = Object.values(student).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
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
    setSelectedStudents(checked ? filteredStudents.map(s => s.id) : []);
  };

  const handleSendToCollection = async () => {
    if (selectedStudents.length === 0 || !pricePerStudent) {
      toast.error("Por favor, selecciona alumnos y un precio.");
      return;
    }

    if (forceEmailMode && (!customEmail || !customEmail.includes('@'))) {
      toast.error("Por favor, introduce un email válido para el envío personalizado.");
      return;
    }
    
    setIsSending(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const updatePromises = selectedStudents.map(id => Student.update(id, { payment_status: 'Pendiente' }));
      await Promise.all(updatePromises);

      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        const family = studentFamilyMap.get(studentId);

        if (student) {
          try {
            // Determinar el email de destino
            const emailToUse = forceEmailMode ? customEmail : family?.email;
            const recipientName = forceEmailMode ? customEmail.split('@')[0] : family?.full_name;

            if (!emailToUse) {
              errorCount++;
              console.warn(`Skipping email for student ${student.full_name}: No email address found or provided.`);
              continue; // Skip to next student if no email
            }

            const emailBody = `
              <h1>Solicitud de Pago - Servicios Educativos</h1>
              <p>Estimado/a <strong>${recipientName || 'Familia'}</strong>,</p>
              <p>Se ha generado una solicitud de pago para los servicios educativos de <strong>${student.full_name}</strong>.</p>
              <ul>
                <li><strong>Alumno/a:</strong> ${student.full_name}</li>
                <li><strong>Importe a Pagar:</strong> ${parseFloat(pricePerStudent).toFixed(2)} €</li>
              </ul>
              <p>En breve recibirá instrucciones para completar el pago de forma segura. Gracias por su colaboración.</p>
              <p>Atentamente,<br/>El equipo de EMOOTI</p>
            `;

            await SendEmail({ 
              to: emailToUse, 
              subject: `Importante: Solicitud de Pago para ${student.full_name}`, 
              body: emailBody 
            });
            successCount++;
          } catch(e) {
            errorCount++;
            console.error(`Failed to send email for student ${studentId}:`, e);
          }
        } else {
            errorCount++;
            console.warn(`Skipping email for student ID ${studentId}: Student data not found.`);
        }
      }

      const successMessage = forceEmailMode 
        ? `${successCount} solicitudes enviadas al email personalizado y actualizadas a "Pendiente".`
        : `${successCount} solicitudes enviadas y actualizadas a "Pendiente".`;

      toast.success(successMessage);
      if (errorCount > 0) {
          toast.warning(`${errorCount} solicitudes no pudieron ser enviadas por falta de datos o email.`);
      }
      
      setSelectedStudents([]);
      setPricePerStudent('');
      setForceEmailMode(false); // Reset force email mode
      setCustomEmail(''); // Clear custom email
      await loadData();

    } catch (error) {
      toast.error(`Error al procesar los cobros: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Debug: mostrar información útil
  console.log('Estudiantes totales:', students.length);
  console.log('Estudiantes con payment_type B2B2C:', students.filter(s => s.payment_type === 'B2B2C').length);
  console.log('Usuarios familia con email:', familyUsers.length);
  console.log('Estudiantes filtrados para B2B2C (visibles):', filteredStudents.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Seleccionar Alumnos (Tipo de Pago B2B2C)</CardTitle>
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
              <TableHeader className="sticky top-0 bg-white"><TableRow><TableHead className="w-12"><Checkbox checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} onCheckedChange={handleSelectAll}/></TableHead><TableHead>Nombre Alumno</TableHead><TableHead>Contacto Familiar</TableHead><TableHead>Email Familiar</TableHead><TableHead>Estado Pago</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredStudents.map(student => {
                  const family = studentFamilyMap.get(student.id);
                  return (
                    <TableRow key={student.id} data-state={selectedStudents.includes(student.id) && "selected"}>
                      <TableCell><Checkbox checked={selectedStudents.includes(student.id)} onCheckedChange={() => handleSelectStudent(student.id)}/></TableCell>
                      <TableCell className="font-medium">{student.full_name}</TableCell>
                      <TableCell>{family?.full_name || 'N/A'}</TableCell>
                      <TableCell>{family?.email || 'N/A'}</TableCell>
                      <TableCell>{student.payment_status || 'N/A'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            Mostrando {filteredStudents.length} alumnos con tipo de pago B2B2C.
             <p className="text-xs italic text-slate-500 mt-1">
              * Nota: Solo los alumnos con un contacto familiar (y con email) correctamente asignado podrán recibir la solicitud de cobro.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>2. Configurar Envío</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Precio por Alumno (€) *</label>
              <Input type="number" placeholder="Ej: 50.00" value={pricePerStudent} onChange={e => setPricePerStudent(e.target.value)}/>
            </div>
          </div>
          
          {/* Sección Forzar Email */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox 
                id="forceEmailB2C" 
                checked={forceEmailMode} 
                onCheckedChange={setForceEmailMode}
              />
              <label htmlFor="forceEmailB2C" className="text-sm font-medium">
                Forzar email personalizado (sobrescribe el email de las familias)
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
              disabled={isSending || selectedStudents.length === 0 || !pricePerStudent || (forceEmailMode && (!customEmail || !customEmail.includes('@')))}
            >
              {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Enviando...</> : <><Send className="mr-2 h-4 w-4"/>Enviar a Cobro ({selectedStudents.length})</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
