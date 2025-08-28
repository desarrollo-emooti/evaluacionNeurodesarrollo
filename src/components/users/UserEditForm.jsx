
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Save, X, Key, AlertCircle, CheckCircle } from "lucide-react"; 
import { Center } from "@/api/entities";
import { toast } from "sonner";

export default function UserEditForm({ user, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({});
  const [centers, setCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  
  // Estados para contraseña
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    async function fetchCenters() {
      if (user?.user_type === 'orientador') {
        setLoadingCenters(true);
        try {
          const centersList = await Center.list();
          setCenters(centersList);
        } catch (error) {
          toast.error("Error al cargar la lista de centros.");
          console.error("Error fetching centers:", error);
        } finally {
          setLoadingCenters(false);
        }
      } else {
        setCenters([]);
        setLoadingCenters(false);
      }
    }
    fetchCenters();

    if (user) {
      setFormData({
        user_id: user.user_id || '',
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        user_type: user.user_type || 'familia',
        center_id: user.center_id || '',
        specialty: user.specialty || '',
        license_number: user.license_number || '',
        active: user.active !== undefined ? user.active : true,
        // Añadir el estado actual para que se envíe siempre
        status: user.status || (user.type === 'preregistered' ? 'pending_invitation' : 'Activo'),
      });
      // Importante: No inicializamos la contraseña por seguridad
      setPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación de contraseña si se está estableciendo una nueva
    if (password) {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
      if (password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
    }

    const dataToSubmit = { ...formData };
    
    // Remover campos que no deben editarse
    delete dataToSubmit.email; 
    delete dataToSubmit.full_name;
    
    // Añadir contraseña y actualizar estado si se introduce una nueva
    if (password) {
      dataToSubmit.password = password;
      // Si el usuario es un pre-registrado, lo activamos
      if (user.type === 'preregistered') {
        dataToSubmit.status = 'active_with_password';
      }
    }

    console.log('Datos a enviar:', dataToSubmit); // Para debugging
    onSubmit(dataToSubmit);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Información básica del usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">ID Usuario</Label>
                <Input id="user_id" value={formData.user_id || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input id="full_name" value={formData.full_name || ''} disabled className="bg-slate-100" />
                <p className="text-xs text-slate-500">Campo no editable</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email || ''} disabled className="bg-slate-100" />
                <p className="text-xs text-slate-500">Campo no editable</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone || ''} onChange={handleChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_type">Rol</Label>
                <Select value={formData.user_type} onValueChange={(value) => handleSelectChange('user_type', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="clinica">Clínica</SelectItem>
                    <SelectItem value="orientador">Orientador</SelectItem>
                    <SelectItem value="examinador">Examinador</SelectItem>
                    <SelectItem value="familia">Familia</SelectItem>
                    <SelectItem value="alumno">Alumno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="center_id">Centro</Label>
                {formData.user_type === 'orientador' ? (
                   <Select value={formData.center_id || ''} onValueChange={(value) => handleSelectChange('center_id', value)} disabled={loadingCenters}>
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
                  <Input id="center_id" value={formData.center_id || ''} onChange={handleChange} placeholder="ID del centro educativo" />
                )}
              </div>
            </div>
            
            {['clinica', 'examinador'].includes(formData.user_type) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_number">Nº Colegiado</Label>
                  <Input id="license_number" value={formData.license_number || ''} onChange={handleChange} />
                </div>
                {formData.user_type === 'clinica' && (
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad</Label>
                    <Input id="specialty" value={formData.specialty || ''} onChange={handleChange} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creación de Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Establecer Nueva Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Activación Inmediata de Cuenta</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    {user?.type === 'preregistered' 
                      ? 'Al establecer una contraseña, este usuario pasará de "Pendiente de Invitación" a "Activo con Contraseña" y podrá acceder inmediatamente con su email y la contraseña que establezcas.'
                      : 'Puedes cambiar la contraseña de este usuario. Una vez guardada, podrá usar la nueva contraseña para acceder.'
                    }
                  </p>
                  <div className="text-xs text-blue-600">
                    <strong>Estado actual:</strong> {user?.status || (user?.type === 'preregistered' ? 'Pendiente' : 'Activo')}
                    {password && password === confirmPassword && password.length >= 6 && (
                      <span className="ml-2 text-green-600">
                        → Será: Activo con Contraseña
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
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
                  />
                </div>
              </div>
              
              {password && confirmPassword && password !== confirmPassword && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">Las contraseñas no coinciden</p>
                </div>
              )}

              {password && password === confirmPassword && password.length >= 6 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <p className="text-sm">Contraseña válida - El usuario podrá acceder inmediatamente</p>
                </div>
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
            {password ? 'Guardar y Activar Usuario' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
