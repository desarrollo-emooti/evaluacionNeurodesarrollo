
import React, { useState, useEffect, useRef } from 'react';
import { PreRegisteredUser } from '@/api/entities';
import { Student } from '@/api/entities';
import { Center } from '@/api/entities'; // Assuming a Center entity exists for fetching centers
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { UserPlus, Users, GraduationCap, Save, AlertCircle, CheckCircle, Mail, Key, FileUp, FileX } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User } from '@/api/entities'; // Mantenemos User para User.me()
import { processImportFile } from '../components/importer'; // Corregir la ruta de importación
import { toast } from 'sonner';

const educationalStages = {
  "Educación Infantil": ["1º Infantil", "2º Infantil", "3º Infantil"],
  "Educación Primaria": ["1º Primaria", "2º Primaria", "3º Primaria", "4º Primaria", "5º Primaria", "6º Primaria"],
  "ESO": ["1º ESO", "2º ESO", "3º ESO", "4º ESO"],
  "Bachillerato": ["1º Bachillerato", "2º Bachillerato"],
  "Formación Profesional": ["FP Grado Medio", "FP Grado Superior"]
};

export default function CreateUser() {
  const [activeTab, setActiveTab] = useState("user");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(true);

  // Estados para activación de cuenta
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationMethod, setActivationMethod] = useState('invitation'); // 'invitation' or 'password'

  // Estados para importación
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [importFileType, setImportFileType] = useState(null);
  const fileInputRef = useRef(null);


  // Fetch centers on component mount
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const currentUser = await User.me();
        let fetchedCenters;
        if (currentUser.user_type === 'administrador') {
          fetchedCenters = await Center.list();
        } else {
          // Si no es admin, solo puede crear usuarios/alumnos en su propio centro
          fetchedCenters = await Center.filter({ id: currentUser.center_id });
        }
        setCenters(fetchedCenters);
      } catch (error) {
        console.error("Error fetching centers:", error);
        setMessage({ type: 'error', text: 'Error al cargar los centros educativos.' });
      } finally {
        setLoadingCenters(false);
      }
    };
    fetchCenters();
  }, []);
  
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    user_type: 'familia',
    center_id: '',
    specialty: '',
    license_number: ''
  });

  const [studentData, setStudentData] = useState({
    full_name: '',
    birth_date: '',
    gender: '',
    etapa: '',
    course: '',
    class_group: '',
    center_id: '',
    medical_observations: '',
    // Campos de pago con valores por defecto
    payment_status: 'Pendiente',
    payment_type: 'B2B', // Predeterminado a B2B
    payment_amount: '',
    payment_id: '',
    payment_date: ''
  });
  
  const [availableCourses, setAvailableCourses] = useState([]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validación de contraseña si se eligió ese método
    if (activationMethod === 'password') {
      if (!password) {
        setMessage({ type: 'error', text: "Por favor, introduce una contraseña." });
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: "Las contraseñas no coinciden." });
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setMessage({ type: 'error', text: "La contraseña debe tener al menos 6 caracteres." });
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const preRegData = {
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        user_type: userData.user_type,
        center_id: userData.center_id,
        specialty: userData.specialty,
        license_number: userData.license_number,
        // Establecer el estado según si tiene contraseña o no
        status: activationMethod === 'password' ? 'active_with_password' : 'pending_invitation'
      };

      // Añadir contraseña solo si se especificó
      if (activationMethod === 'password' && password) {
        preRegData.password = password;
      }

      // Remover campos vacíos
      Object.keys(preRegData).forEach(key => {
        if (preRegData[key] === '' || preRegData[key] === null || preRegData[key] === undefined) {
          delete preRegData[key];
        }
      });

      await PreRegisteredUser.create(preRegData);
      
      let successMessage;
      if (activationMethod === 'password') {
        successMessage = `Usuario creado y activado correctamente. Ya puede acceder con email: ${userData.email} y la contraseña establecida.`;
      } else {
        successMessage = `Usuario pre-registrado correctamente. Ahora puedes invitarlo a la plataforma desde el panel de Base44.`;
      }
      
      setMessage({ 
        type: 'success', 
        text: successMessage
      });
      
      setUserData({
        full_name: '',
        email: '',
        phone: '',
        user_type: 'familia',
        center_id: '',
        specialty: '',
        license_number: ''
      });
      setPassword('');
      setConfirmPassword('');
      setActivationMethod('invitation'); // Reset to default

    } catch (error) {
      console.error('Error creando usuario:', error);
      setMessage({ 
        type: 'error', 
        text: `Error al crear el usuario: ${error.message || 'Error desconocido'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Crear objeto solo con los campos permitidos por la entidad Student
      const studentDataToCreate = {
        full_name: studentData.full_name,
        birth_date: studentData.birth_date,
        gender: studentData.gender,
        etapa: studentData.etapa,
        course: studentData.course,
        class_group: studentData.class_group,
        center_id: studentData.center_id,
        medical_observations: studentData.medical_observations,
        active: true,
        consent_given: 'Pendiente',
        // Campos de pago con valores por defecto
        payment_status: 'Pendiente',
        payment_type: studentData.payment_type || 'B2B', // Asegurar que sea B2B por defecto
        payment_amount: studentData.payment_amount || null,
        payment_id: '', // Vacío por defecto
        payment_date: '' // Vacío por defecto
      };

      // Remover campos vacíos (excepto los requeridos)
      Object.keys(studentDataToCreate).forEach(key => {
        if (!['full_name', 'birth_date', 'etapa', 'course', 'center_id'].includes(key) && 
            (studentDataToCreate[key] === '' || studentDataToCreate[key] === null || studentDataToCreate[key] === undefined)) {
          delete studentDataToCreate[key];
        }
      });

      await Student.create(studentDataToCreate);
      
      setMessage({ type: 'success', text: `Alumno creado correctamente con tipo de pago: ${studentDataToCreate.payment_type}` });
      
      setStudentData({
        full_name: '',
        birth_date: '',
        gender: '',
        etapa: '',
        course: '',
        class_group: '',
        center_id: '',
        medical_observations: '',
        payment_status: 'Pendiente',
        payment_type: 'B2B', // Reset a B2B
        payment_id: '',
        payment_date: ''
      });
      setAvailableCourses([]); // Reset available courses
    } catch (error) {
      console.error('Error creando alumno:', error);
      setMessage({ 
        type: 'error', 
        text: `Error al crear el alumno: ${error.message || 'Error desconocido'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEtapaChange = (value) => {
    setStudentData(prev => ({ ...prev, etapa: value, course: '' })); // Reset course when etapa changes
    setAvailableCourses(educationalStages[value] || []);
  };

  const triggerFileInput = (type) => {
    setImportFileType(type);
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportResults(null);

    await processImportFile({
      file,
      fileType: importFileType,
      onProgress: setImportProgress,
      onComplete: (results) => {
        setImportResults(results);
        // No cerramos el modal automáticamente para que el usuario vea los resultados
      },
      onError: (error) => {
        toast.error(`Error al importar: ${error.message}`);
        setIsImporting(false);
      },
    });
    
    // Limpiar el valor del input para permitir subir el mismo archivo de nuevo
    event.target.value = null; 
  };
  
  const closeImportModal = () => {
    setIsImporting(false);
    setImportProgress(0);
    setImportResults(null);
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv"
        className="hidden"
      />
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Crear Usuarios y Alumnos</h1>
          <p className="text-slate-600">Pre-registra usuarios y da de alta alumnos.</p>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {message.type === 'error' ? 
              <AlertCircle className="h-4 w-4 text-red-600" /> : 
              <CheckCircle className="h-4 w-4 text-green-600" />
            }
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Crear Usuario
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Crear Alumno
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserPlus className="w-5 h-5" />
                  Crear Usuario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserSubmit} className="space-y-6">
                  
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nombre Completo *</Label>
                      <Input
                        id="full_name"
                        value={userData.full_name}
                        onChange={(e) => setUserData({...userData, full_name: e.target.value})}
                        placeholder="Nombre y apellidos"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={userData.phone}
                        onChange={(e) => setUserData({...userData, phone: e.target.value})}
                        placeholder="Número de teléfono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="user_type">Tipo de Usuario *</Label>
                      <Select value={userData.user_type} onValueChange={(value) => setUserData({...userData, user_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="clinica">Clínica</SelectItem>
                          <SelectItem value="orientador">Orientador</SelectItem>
                          <SelectItem value="examinador">Examinador</SelectItem>
                          <SelectItem value="familia">Familia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Professional Information */}
                  {['clinica', 'orientador', 'examinador'].includes(userData.user_type) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="center_id">Centro *</Label>
                          {userData.user_type === 'orientador' ? (
                            <Select 
                              value={userData.center_id} 
                              onValueChange={(value) => setUserData({...userData, center_id: value})}
                              required
                              disabled={loadingCenters}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingCenters ? "Cargando..." : "Seleccionar centro..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {centers.map(center => (
                                  <SelectItem key={center.id} value={center.id}>
                                    {center.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id="center_id"
                              value={userData.center_id}
                              onChange={(e) => setUserData({...userData, center_id: e.target.value})}
                              placeholder="ID del centro educativo"
                              required
                            />
                          )}
                        </div>
                        
                        {userData.user_type === 'clinica' && (
                          <div className="space-y-2">
                            <Label htmlFor="specialty">Especialidad</Label>
                            <Input
                              id="specialty"
                              value={userData.specialty}
                              onChange={(e) => setUserData({...userData, specialty: e.target.value})}
                              placeholder="Especialidad clínica"
                            />
                          </div>
                        )}
                      </div>
                      
                      {userData.user_type === 'clinica' && (
                        <div className="space-y-2">
                          <Label htmlFor="license_number">Número de Colegiado</Label>
                          <Input
                            id="license_number"
                            value={userData.license_number}
                            onChange={(e) => setUserData({...userData, license_number: e.target.value})}
                            placeholder="Número de colegiado profesional"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Activación de cuenta */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        Activación de Cuenta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={activationMethod} onValueChange={setActivationMethod} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="invitation" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Enviar Invitación
                          </TabsTrigger>
                          <TabsTrigger value="password" className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            Crear Contraseña
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="invitation" className="mt-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-blue-900 mb-2">Invitación por Email</h4>
                                <p className="text-sm text-blue-700 mb-3">
                                  El usuario quedará en estado "Pendiente de Invitación". Deberás enviarle la invitación desde el panel de Base44 para que pueda acceder.
                                </p>
                                <div className="text-xs text-blue-600">
                                  <strong>Estado:</strong> Pendiente de Invitación
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="password" className="mt-4">
                          <div className="bg-green-50 rounded-lg p-4 space-y-4">
                            <div className="flex items-start gap-3">
                              <Key className="w-5 h-5 text-green-600 mt-0.5" />
                              <div>
                                <h4 className="font-medium text-green-900 mb-2">Activación Inmediata</h4>
                                <p className="text-sm text-green-700 mb-3">
                                  El usuario quedará activo inmediatamente y podrá acceder con su email y la contraseña que establezcas.
                                </p>
                                <div className="text-xs text-green-600 mb-3">
                                  <strong>Estado:</strong> Activo con Contraseña
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input 
                                  id="password" 
                                  type="password" 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Mínimo 6 caracteres"
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                                <Input 
                                  id="confirmPassword" 
                                  type="password" 
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Repite la contraseña"
                                  required
                                />
                              </div>
                            </div>
                            
                            {password && confirmPassword && password !== confirmPassword && (
                              <p className="text-sm text-red-600">Las contraseñas no coinciden</p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {activationMethod === 'password' ? 'Crear Usuario Activo' : 'Pre-registrar Usuario'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Sección de Importación */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Importación Masiva</h3>
                  <p className="text-sm text-slate-600 mb-4">Como alternativa, puedes importar múltiples usuarios desde un archivo CSV.</p>
                  <Button type="button" variant="secondary" onClick={() => triggerFileInput('usuarios')}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Importar Usuarios desde CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5" />
                  Crear Alumno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentSubmit} className="space-y-6">
                  
                  {/* Student Basic Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="student_name">Nombre Completo *</Label>
                      <Input
                        id="student_name"
                        value={studentData.full_name}
                        onChange={(e) => setStudentData({...studentData, full_name: e.target.value})}
                        placeholder="Nombre y apellidos del alumno"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={studentData.birth_date}
                        onChange={(e) => setStudentData({...studentData, birth_date: e.target.value})}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Género</Label>
                      <Select value={studentData.gender} onValueChange={(value) => setStudentData({...studentData, gender: value})}>
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
                      <Label htmlFor="center_id_student">Centro Educativo *</Label>
                      <Select 
                        value={studentData.center_id} 
                        onValueChange={(value) => setStudentData({...studentData, center_id: value})} 
                        required
                        disabled={loadingCenters}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCenters ? "Cargando centros..." : "Seleccionar centro..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {centers.length > 0 ? (
                            centers.map(center => (
                              <SelectItem key={center.id} value={center.id}>
                                {center.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value={null} disabled>No hay centros disponibles</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Etapa, Course and Class Group */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="etapa">Etapa Educativa *</Label>
                      <Select value={studentData.etapa} onValueChange={handleEtapaChange} required>
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
                        value={studentData.course} 
                        onValueChange={(value) => setStudentData({...studentData, course: value})}
                        disabled={!studentData.etapa}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!studentData.etapa ? 'Selecciona etapa primero...' : 'Seleccionar curso...'} />
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
                      <Select value={studentData.class_group} onValueChange={(value) => setStudentData({...studentData, class_group: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar grupo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["A", "B", "C", "D", "E", "F", "G"].map(group => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medical_observations">Observaciones Médicas</Label>
                    <Textarea
                      id="medical_observations"
                      value={studentData.medical_observations}
                      onChange={(e) => setStudentData({...studentData, medical_observations: e.target.value})}
                      placeholder="Observaciones médicas relevantes (opcional)"
                      className="h-24"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Crear Alumno
                        </>
                      )}
                    </Button>
                  </div>
                </form>
                
                {/* Sección de Importación */}
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-2">Importación Masiva</h3>
                  <p className="text-sm text-slate-600 mb-4">Como alternativa, puedes importar múltiples alumnos desde un archivo CSV.</p>
                  <Button type="button" variant="secondary" onClick={() => triggerFileInput('alumnos')}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Importar Alumnos desde CSV
                  </Button>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
      
      {/* Modal de Importación */}
      <Dialog open={isImporting} onOpenChange={!importResults ? setIsImporting : undefined}>
        <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              {importResults ? 'Resultados de la Importación' : `Importando ${importFileType === 'usuarios' ? 'Usuarios' : 'Alumnos'}`}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {!importResults ? (
              <div className="space-y-4">
                <p>Procesando archivo... Por favor, espera.</p>
                <Progress value={importProgress} className="w-full" />
                <p className="text-center text-lg font-semibold">{importProgress}%</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{importResults.total}</p>
                    <p className="text-sm text-slate-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                    <p className="text-sm text-slate-500">Éxitos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600">{importResults.errors}</p>
                    <p className="text-sm text-slate-500">Errores</p>
                  </div>
                </div>
                {importResults.errorDetails.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2"><FileX className="w-4 h-4"/> Detalles de Errores</h4>
                    <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border bg-slate-50 p-2">
                      {importResults.errorDetails.map((err, index) => (
                        <p key={index} className="text-xs text-red-700"><b>Fila {err.row}:</b> {err.error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {importResults && (
            <DialogFooter>
              <Button onClick={closeImportModal}>Cerrar</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
