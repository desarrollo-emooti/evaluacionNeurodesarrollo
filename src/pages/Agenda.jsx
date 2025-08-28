
import React, { useState, useEffect, useMemo } from 'react';
import { TestAssignment } from '@/api/entities';
import { Center } from '@/api/entities';
import { Student } from '@/api/entities';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, eachWeekOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Building, BookOpen, Hash, Users, Printer, X } from 'lucide-react'; // Removed Filter import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import _ from 'lodash';

// --- Utils ---
const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const getTextColor = (bgColor) => {
    const r = parseInt(bgColor.substr(1, 2), 16);
    const g = parseInt(bgColor.substr(3, 2), 16);
    const b = parseInt(bgColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'text-black' : 'text-white';
};


// --- Components ---
const CalendarHeader = ({ currentDate, onPrevMonth, onNextMonth, onToday }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-4">
      <h2 className="text-2xl font-bold text-slate-900 capitalize">
        {format(currentDate, 'MMMM yyyy', { locale: es })}
      </h2>
    </div>
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={onPrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
      <Button variant="outline" onClick={onToday}>Hoy</Button>
      <Button variant="outline" onClick={onNextMonth}><ChevronRight className="w-4 h-4" /></Button>
    </div>
  </div>
);

const FilterPanel = ({ filters, onFilterChange, onPrintQR, assignmentsForFiltering, centers }) => {
  // Datos únicos para los filtros, derivados de las asignaciones y dependientes de los filtros aplicados
  const uniqueStages = useMemo(() => {
    let filtered = assignmentsForFiltering;
    if (filters.center !== 'all') {
      filtered = filtered.filter(a => a.center_id === filters.center);
    }
    return [...new Set(filtered.map(a => a.student_etapa).filter(Boolean))].sort();
  }, [assignmentsForFiltering, filters.center]);

  const uniqueCourses = useMemo(() => {
    let filtered = assignmentsForFiltering;
    if (filters.center !== 'all') {
      filtered = filtered.filter(a => a.center_id === filters.center);
    }
    if (filters.etapa !== 'all') {
      filtered = filtered.filter(a => a.student_etapa === filters.etapa);
    }
    return [...new Set(filtered.map(a => a.student_course).filter(Boolean))].sort();
  }, [assignmentsForFiltering, filters.center, filters.etapa]);

  const uniqueClasses = useMemo(() => {
    let filtered = assignmentsForFiltering;
    if (filters.center !== 'all') {
      filtered = filtered.filter(a => a.center_id === filters.center);
    }
    if (filters.etapa !== 'all') {
      filtered = filtered.filter(a => a.student_etapa === filters.etapa);
    }
    if (filters.course !== 'all') {
      filtered = filtered.filter(a => a.student_course === filters.course);
    }
    return [...new Set(filtered.map(a => a.student_group).filter(Boolean))].sort();
  }, [assignmentsForFiltering, filters.center, filters.etapa, filters.course]);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          
          
          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-600">Centro:</Label>
            <Select value={filters.center} onValueChange={(value) => onFilterChange({ center: value, etapa: 'all', course: 'all', class: 'all' })}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos los centros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los centros</SelectItem>
                {centers.map(center => (
                  <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-600">Etapa:</Label>
            <Select value={filters.etapa} onValueChange={(value) => onFilterChange({ ...filters, etapa: value, course: 'all', class: 'all' })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todas las etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {uniqueStages.map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-600">Curso:</Label>
            <Select value={filters.course} onValueChange={(value) => onFilterChange({ ...filters, course: value, class: 'all' })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos los cursos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cursos</SelectItem>
                {uniqueCourses.map(course => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-600">Clase:</Label>
            <Select value={filters.class} onValueChange={(value) => onFilterChange({ ...filters, class: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Todas las clases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las clases</SelectItem>
                {uniqueClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={onPrintQR}>
            <Printer className="w-4 h-4 mr-2" />
            QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EventModal = ({ isOpen, onClose, eventData, students, centers }) => {
  if (!eventData) return null;

  const { center, assignments } = eventData;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: center.color }} />
            {center.name}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(assignments[0].test_date), 'EEEE, d MMMM, yyyy', { locale: es })}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <h4 className="font-semibold text-slate-800 mb-3">Pruebas Asignadas ({assignments.length})</h4>
          <div className="space-y-3">
            {assignments.map(assignment => {
              const student = students.find(s => s.id === assignment.student_id);
              const centerInfo = centers.find(c => c.id === student?.center_id);
              
              return (
                <div key={assignment.id} className="bg-slate-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="font-medium text-slate-900 mb-1">{student?.full_name || 'Alumno no encontrado'}</p>
                      <p className="text-sm text-slate-600 mb-1">
                        <span className="font-medium">Prueba:</span> {assignment.test_title}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Centro:</span> {centerInfo?.name || 'Centro no encontrado'}
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end justify-between">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {student?.etapa && (
                          <Badge variant="outline" className="text-xs">
                            {student.etapa}
                          </Badge>
                        )}
                        {student?.course && (
                          <Badge variant="outline" className="text-xs">
                            {student.course}
                          </Badge>
                        )}
                        {student?.class_group && (
                          <Badge variant="outline" className="text-xs">
                            Clase {student.class_group}
                          </Badge>
                        )}
                      </div>
                      {assignment.test_link && (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(assignment.test_link)}&size=60x60&margin=5`}
                          alt="QR Code"
                          className="border rounded"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MonthView = ({ currentDate, events, centers, students, onEventClick }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="grid grid-cols-7 gap-px">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-slate-600 pb-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = events[dayKey] || [];
          const eventsByCenter = _.groupBy(dayEvents, 'center_id');

          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] p-2 border-t ${
                isSameMonth(day, currentDate) ? 'bg-white' : 'bg-slate-50'
              }`}
            >
              <div
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                  isToday(day) ? 'bg-blue-600 text-white font-bold' : ''
                } ${!isSameMonth(day, currentDate) ? 'text-slate-400' : ''}`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1 mt-1">
                {Object.entries(eventsByCenter).map(([centerId, assignments]) => {
                  const center = centers.find(c => c.id === centerId);
                  if (!center) return null;

                  const uniqueCourses = _.uniq(assignments.map(a => students.find(s => s.id === a.student_id)?.course)).filter(Boolean);
                  const uniqueTestTitles = _.uniq(assignments.map(a => a.test_title));

                  return (
                    <button
                      key={centerId}
                      onClick={() => onEventClick({ center, assignments })}
                      className="w-full text-left p-1.5 rounded-md text-xs hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: center.color, color: getTextColor(center.color) }}
                    >
                      <p className="font-bold truncate flex items-center gap-1.5"><Building className="w-3 h-3 flex-shrink-0" /> {center.name}</p>
                      <p className="flex items-center gap-1.5"><Users className="w-3 h-3 flex-shrink-0" /> {assignments.length} pruebas</p>
                      <p className="flex items-center gap-1.5"><Hash className="w-3 h-3 flex-shrink-0" /> {uniqueCourses.length} cursos</p>
                      <p className="font-medium truncate flex items-center gap-1.5"><BookOpen className="w-3 h-3 flex-shrink-0" /> {uniqueTestTitles.join(', ')}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- Main Page Component ---
export default function Agenda() {
  const [assignments, setAssignments] = useState([]);
  const [centers, setCenters] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day' - kept for future use, not currently utilized beyond month
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    center: 'all',
    etapa: 'all',
    course: 'all',
    class: 'all'
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [assignData, centerData, studentData] = await Promise.all([
          TestAssignment.list(),
          Center.list(),
          Student.list()
        ]);
        setAssignments(assignData.filter(a => a.test_date)); // Only use assignments with a date
        
        const centersWithColor = centerData.map(c => ({...c, color: generateColor(c.id)}));
        setCenters(centersWithColor);
        
        setStudents(studentData);
      } catch (error) {
        console.error("Error loading agenda data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const enrichedAssignmentsBase = useMemo(() => {
    return assignments.map(a => {
        const student = students.find(s => s.id === a.student_id);
        const center = centers.find(c => c.id === student?.center_id);
        return {
            ...a,
            student_course: student?.course,
            student_etapa: student?.etapa,
            student_group: student?.class_group,
            center_id: center?.id,
        }
    }).filter(a => a.center_id); // Filter out assignments without a valid center/student link
  }, [assignments, students, centers]);

  const eventsByDate = useMemo(() => {
    // Apply filters to the enriched assignments
    const filteredAssignmentsForCalendar = enrichedAssignmentsBase.filter(assignment => {
      const centerMatch = filters.center === 'all' || assignment.center_id === filters.center;
      const etapaMatch = filters.etapa === 'all' || assignment.student_etapa === filters.etapa;
      const courseMatch = filters.course === 'all' || assignment.student_course === filters.course;
      const classMatch = filters.class === 'all' || assignment.student_group === filters.class;
      
      return centerMatch && etapaMatch && courseMatch && classMatch;
    });

    return _.groupBy(filteredAssignmentsForCalendar, a => format(new Date(a.test_date), 'yyyy-MM-dd'));
  }, [enrichedAssignmentsBase, filters]);

  // This specific filtered list is for the QR printing functionality, ensuring only valid entries are considered
  const assignmentsForFiltering = useMemo(() => {
    return enrichedAssignmentsBase.filter(a => a.test_link); // Only include assignments with a test_link for QR
  }, [enrichedAssignmentsBase]);

  const handleEventClick = (eventData) => {
    setSelectedEvent(eventData);
    setIsModalOpen(true);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePrintQR = () => {
    // Filter assignments specifically for printing based on current filters and QR availability
    const filteredForPrint = assignmentsForFiltering.filter(assignment => {
      const centerMatch = filters.center === 'all' || assignment.center_id === filters.center;
      const etapaMatch = filters.etapa === 'all' || assignment.student_etapa === filters.etapa;
      const courseMatch = filters.course === 'all' || assignment.student_course === filters.course;
      const classMatch = filters.class === 'all' || assignment.student_group === filters.class;
      
      return centerMatch && etapaMatch && courseMatch && classMatch;
    });

    if (filteredForPrint.length === 0) {
      alert('No hay pruebas con enlaces QR que coincidan con los filtros seleccionados.');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lista de Códigos QR - Pruebas</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .qr-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 20px; 
            padding: 10px; /* Add some padding to the grid container */
          }
          .qr-item { 
            border: 1px solid #ccc; 
            padding: 15px; 
            text-align: center; 
            page-break-inside: avoid;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05); /* Optional: subtle shadow */
          }
          .qr-item img { margin: 10px auto; display: block; } /* Center QR image */
          .student-name { font-weight: bold; margin-bottom: 5px; color: #333; }
          .test-info { font-size: 12px; color: #666; line-height: 1.4; }
          .test-info div { margin-bottom: 3px; }
          @media print {
            body { margin: 0; padding: 10px; }
            .header { margin-bottom: 20px; }
            .qr-grid { grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; } /* Adjust for print */
            .qr-item { border: 1px solid #eee; padding: 12px; box-shadow: none; }
            .qr-item img { max-width: 120px; max-height: 120px; } /* Adjust QR size for print */
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Lista de Códigos QR - Pruebas Educativas</h1>
          <p>Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          <p>Total de pruebas: ${filteredForPrint.length}</p>
        </div>
        <div class="qr-grid">
          ${filteredForPrint.map(assignment => {
            const student = students.find(s => s.id === assignment.student_id);
            const center = centers.find(c => c.id === student?.center_id);
            return `
              <div class="qr-item">
                <div class="student-name">${student?.full_name || 'Alumno no encontrado'}</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(assignment.test_link)}&size=150x150&margin=10" alt="QR Code" />
                <div class="test-info">
                  <div><strong>Prueba:</strong> ${assignment.test_title}</div>
                  <div><strong>Centro:</strong> ${center?.name || 'Centro no encontrado'}</div>
                  <div><strong>Curso:</strong> ${student?.course || 'Sin curso'} ${student?.class_group ? `(${student.class_group})` : ''}</div>
                  <div><strong>Fecha:</strong> ${format(new Date(assignment.test_date), 'dd/MM/yyyy', { locale: es })}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Agenda de Pruebas</h1>
        <p className="text-slate-600 mb-8">Visualiza y gestiona el calendario de pruebas por centro.</p>

        <FilterPanel 
          filters={filters}
          onFilterChange={handleFilterChange}
          onPrintQR={handlePrintQR}
          assignmentsForFiltering={assignmentsForFiltering}
          centers={centers}
        />

        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
          onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
          onToday={() => setCurrentDate(new Date())}
        />
        
        <MonthView 
            currentDate={currentDate} 
            events={eventsByDate}
            centers={centers}
            students={students}
            onEventClick={handleEventClick}
        />

        <EventModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            eventData={selectedEvent}
            students={students}
            centers={centers}
        />
      </div>
    </div>
  );
}
