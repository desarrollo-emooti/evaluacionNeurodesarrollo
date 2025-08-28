import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Building, 
  Save, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    user_type: '',
    center_id: '',
    specialty: '',
    license_number: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        user_type: userData.user_type || '',
        center_id: userData.center_id || '',
        specialty: userData.specialty || '',
        license_number: userData.license_number || ''
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
      setMessage({ type: 'error', text: 'Error al cargar el perfil del usuario' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      await User.updateMyUserData(formData);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      await loadUserProfile(); // Recargar datos actualizados
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleDisplayName = (userType) => {
    const names = {
      'administrador': 'Administrador',
      'clinica': 'Clínica',
      'orientador': 'Orientador',
      'examinador': 'Examinador', 
      'familia': 'Familia',
      'alumno': 'Alumno'
    };
    return names[userType] || 'Usuario';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mi Perfil</h1>
          <p className="text-slate-600">Gestiona tu información personal y configuración de cuenta</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserIcon className="w-5 h-5" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarImage src={``} alt={formData.full_name} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {formData.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{formData.full_name}</h3>
                <p className="text-slate-600">{getRoleDisplayName(formData.user_type)}</p>
                <p className="text-sm text-slate-500">{formData.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Editar Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-500">El email no se puede modificar</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Número de teléfono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="user_type">Tipo de Usuario</Label>
                  <Select 
                    value={formData.user_type} 
                    disabled
                  >
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-slate-500">El rol no se puede modificar</p>
                </div>
              </div>

              {/* Professional Information */}
              {['clinica', 'orientador', 'examinador'].includes(formData.user_type) && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="center_id">Centro</Label>
                      <Input
                        id="center_id"
                        value={formData.center_id}
                        onChange={(e) => handleInputChange('center_id', e.target.value)}
                        placeholder="ID del centro educativo"
                      />
                    </div>
                    
                    {formData.user_type === 'clinica' && (
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Especialidad</Label>
                        <Input
                          id="specialty"
                          value={formData.specialty}
                          onChange={(e) => handleInputChange('specialty', e.target.value)}
                          placeholder="Especialidad clínica"
                        />
                      </div>
                    )}
                  </div>
                  
                  {['clinica', 'orientador'].includes(formData.user_type) && (
                    <div className="space-y-2">
                      <Label htmlFor="license_number">Número de Colegiado</Label>
                      <Input
                        id="license_number"
                        value={formData.license_number}
                        onChange={(e) => handleInputChange('license_number', e.target.value)}
                        placeholder="Número de colegiado profesional"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
              
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}