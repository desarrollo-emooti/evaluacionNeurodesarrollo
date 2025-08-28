
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Copy, DollarSign, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Center } from "@/api/entities";
import { User } from "@/api/entities"; // Added User import
import { toast } from "sonner";

const educationalStages = {
  "Educación Infantil": ["1º Infantil", "2º Infantil", "3º Infantil"],
  "Educación Primaria": ["1º Primaria", "2º Primaria", "3º Primaria", "4º Primaria", "5º Primaria", "6º Primaria"],
  "ESO": ["1º ESO", "2º ESO", "3º ESO", "4º ESO"],
  "Bachillerato": ["1º Bachillerato", "2º Bachillerato"],
  "Formación Profesional": ["FP Grado Medio", "FP Grado Superior"]
};

const classGroups = ["A", "B", "C", "D", "E", "F", "G"];

// Función para generar ID de pago único
const generatePaymentId = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PAY_${timestamp}_${randomSuffix}`;
};

// Función para obtener fecha actual en formato YYYY-MM-DD
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

export default function StudentEditForm({ student, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});
  const [centers, setCenters] = useState([]);
  const [familyUsers, setFamilyUsers] = useState([]); // New state for family users
  const [availableCourses, setAvailableCourses] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [centersList, usersList] = await Promise.all([
          Center.list(),
          User.filter({ user_type: 'familia' }) // Fetch users with type 'familia'
        ]);
        setCenters(centersList);
        setFamilyUsers(usersList);
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar centros o usuarios familiares.');
      }
    }
    fetchData();

    if (student) {
      const initialData = {
        student_id: student.student_id || '',
        full_name: student.full_name || '',
        birth_date: student.birth_date ? student.birth_date.split('T')[0] : '',
        gender: student.gender || '',
        etapa: student.etapa || '',
        course: student.course || '',
        class_group: student.class_group || '',
        center_id: student.center_id || '',
        family_user_id: student.family_user_id || '', // Initialize family_user_id
        medical_observations: student.medical_observations || '',
        consent_given: student.consent_given || 'Pendiente',
        active: student.active !== undefined ? student.active : true,
        // Nuevos campos de pago
        payment_id: student.payment_id || '',
        payment_date: student.payment_date ? student.payment_date.split('T')[0] : '',
        payment_type: student.payment_type || '',
        payment_amount: student.payment_amount || '',
        payment_status: student.payment_status || 'Pendiente', // Por defecto Pendiente
      };
      setFormData(initialData);
      
      // Configurar cursos disponibles basados en la etapa
      if (initialData.etapa) {
        setAvailableCourses(educationalStages[initialData.etapa] || []);
      }
    }
  }, [student]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (fieldId, value) => {
    console.log('Cambiando campo:', fieldId, 'a valor:', value);
    setFormData(prev => {
      const newData = { ...prev, [fieldId]: value };
      
      // Si cambia la etapa, resetear el curso
      if (fieldId === 'etapa') {
        newData.course = '';
        setAvailableCourses(educationalStages[value] || []);
      }
      
      // LÓGICA AUTOMÁTICA DE PAGO
      if (fieldId === 'payment_status') {
        if (value === 'Pagado') {
          // Si no tiene ID o fecha de pago, generarlos automáticamente
          if (!newData.payment_id) {
            newData.payment_id = generatePaymentId();
          }
          if (!newData.payment_date) {
            newData.payment_date = getCurrentDate();
          }
        } else if (value === 'Pendiente' || value === 'N/A') {
          // Si cambia a Pendiente o N/A, limpiar ID y fecha
          newData.payment_id = '';
          newData.payment_date = '';
        }
      }

      // Si cambia el tipo de pago, limpiar el family_user_id para evitar inconsistencias
      if (fieldId === 'payment_type') {
        newData.family_user_id = '';
      }
      
      return newData;
    });
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(formData.student_id);
      toast.success('ID copiado al portapapeles');
    } catch (error) {
      console.error('Error al copiar:', error);
      toast.error('No se pudo copiar el ID');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };

    // Si el importe de pago es una cadena vacía, lo convertimos a null
    // para que la API lo acepte, ya que el campo es de tipo número y opcional.
    if (dataToSubmit.payment_amount === '') {
      dataToSubmit.payment_amount = null;
    }
    // Si family_user_id es una cadena vacía (o 'null' si se seleccionó 'Ninguno' que se convierte a null en handleSelectChange)
    // asegurarse de que sea null para la DB si es opcional y no hay valor.
    if (dataToSubmit.family_user_id === '' || dataToSubmit.family_user_id === 'null') {
      dataToSubmit.family_user_id = null;
    }
    
    console.log('Enviando datos del formulario:', dataToSubmit);
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 py-4">
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5"/> Datos del Alumno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student_id">ID Alumno</Label>
              <div className="flex gap-2">
                <Input 
                  id="student_id" 
                  value={formData.student_id || ''} 
                  disabled 
                  className="bg-slate-100 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyId}
                  className="shrink-0"
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500">Campo no editable - Haz clic en copiar</p>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input id="full_name" value={formData.full_name || ''} onChange={handleChange} required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
              <Input id="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} required className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <Select value={formData.gender || ''} onValueChange={(value) => handleSelectChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar género..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="center_id">Centro Educativo *</Label>
              <Select value={formData.center_id || ''} onValueChange={(value) => handleSelectChange('center_id', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar centro..." />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(center => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etapa">Etapa Educativa *</Label>
              <Select value={formData.etapa || ''} onValueChange={(value) => handleSelectChange('etapa', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(educationalStages).map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Curso *</Label>
              <Select 
                value={formData.course || ''} 
                onValueChange={(value) => handleSelectChange('course', value)} 
                required 
                disabled={!formData.etapa}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.etapa ? "Selecciona etapa primero..." : "Seleccionar curso..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_group">Grupo/Clase</Label>
              <Select value={formData.class_group || ''} onValueChange={(value) => handleSelectChange('class_group', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {classGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medical_observations">Observaciones Médicas</Label>
              <Textarea id="medical_observations" value={formData.medical_observations || ''} onChange={handleChange} placeholder="Alergias, medicación, etc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consent_given">Consentimiento</Label>
              <Select value={formData.consent_given || 'Pendiente'} onValueChange={(value) => handleSelectChange('consent_given', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado del consentimiento..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sí">Sí</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5"/> Información de Pago</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="payment_status">Estado del Pago</Label>
                <Select value={formData.payment_status || 'Pendiente'} onValueChange={(value) => handleSelectChange('payment_status', value)}>
                    <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pagado">Pagado</SelectItem>
                        <SelectItem value="Pendiente">Pendiente</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="payment_type">Tipo de Pago</Label>
                <Select value={formData.payment_type || ''} onValueChange={(value) => handleSelectChange('payment_type', value)}>
                    <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2B2C">B2B2C</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="payment_amount">Importe</Label>
                <Input id="payment_amount" name="payment_amount" type="number" step="0.01" value={formData.payment_amount || ''} onChange={handleChange} placeholder="Ej: 50.00" />
            </div>

            {formData.payment_type === 'B2B' && (
                <div className="space-y-2 md:col-span-3">
                    <Label>Cobro gestionado por Centro Educativo</Label>
                    <Input 
                        disabled 
                        value={centers.find(c => c.id === formData.center_id)?.name || 'Centro no asignado'}
                        className="bg-slate-100"
                    />
                </div>
            )}

            {formData.payment_type === 'B2B2C' && (
                <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="family_user_id">Familiar Responsable del Pago</Label>
                    <Select 
                      value={formData.family_user_id || ''} 
                      onValueChange={(value) => handleSelectChange('family_user_id', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar familiar..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="null">Ninguno</SelectItem> {/* Explicitly pass "null" string to map to null */}
                            {familyUsers.map(fam => (
                                <SelectItem key={fam.id} value={fam.id}>
                                    {fam.full_name || fam.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="payment_date">Fecha de Pago</Label>
                <Input 
                  id="payment_date" 
                  name="payment_date" 
                  type="date" 
                  value={formData.payment_date || ''} 
                  onChange={handleChange}
                  disabled={formData.payment_status !== 'Pagado'}
                  className={formData.payment_status !== 'Pagado' ? 'bg-slate-100' : ''}
                />
                {formData.payment_status !== 'Pagado' && (
                  <p className="text-xs text-slate-500">Se autorellena cuando el estado sea "Pagado"</p>
                )}
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="payment_id">ID de Pago</Label>
                <div className="flex gap-2">
                  <Input 
                    id="payment_id" 
                    name="payment_id" 
                    value={formData.payment_id || ''} 
                    onChange={handleChange} 
                    placeholder="Se autogenera al marcar como Pagado"
                    disabled={formData.payment_status !== 'Pagado'}
                    className={formData.payment_status !== 'Pagado' ? 'bg-slate-100 flex-1' : 'flex-1'}
                  />
                  {formData.payment_id && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(formData.payment_id);
                          toast.success('ID de pago copiado');
                        } catch (error) {
                          toast.error('No se pudo copiar');
                        }
                      }}
                      title="Copiar ID de pago"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.payment_status !== 'Pagado' && (
                  <p className="text-xs text-slate-500">Se autogenera cuando el estado sea "Pagado"</p>
                )}
            </div>
        </CardContent>
      </Card>


      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
