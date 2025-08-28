import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, UserPlus, Users, Edit3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function RecipientSelector({ selectedRecipients, onSelectionChange, templateDetails, requiredSigners }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(-1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await User.list();
        setAllUsers(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allUsers]);

  const handleSelectUser = (user, index) => {
    const updatedRecipients = [...selectedRecipients];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      isManual: false
    };
    onSelectionChange(updatedRecipients);
    setEditingIndex(-1);
  };

  const handleManualEdit = (index, field, value) => {
    const updatedRecipients = [...selectedRecipients];
    updatedRecipients[index] = {
      ...updatedRecipients[index],
      [field]: value,
      isManual: true
    };
    onSelectionChange(updatedRecipients);
  };

  const clearRecipient = (index) => {
    const updatedRecipients = [...selectedRecipients];
    updatedRecipients[index] = {
      id: `temp_${index}`,
      role: templateDetails?.signer_roles[index]?.role || `Firmante ${index + 1}`,
      full_name: '',
      email: '',
      phone: '',
      isManual: true
    };
    onSelectionChange(updatedRecipients);
    setEditingIndex(-1);
  };
  
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('') || 'U';
  };

  if (!templateDetails || !requiredSigners) {
    return (
      <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg">
        <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">Selecciona una plantilla para configurar los firmantes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Información de firmantes requeridos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">
            Se requieren {requiredSigners} firmantes para esta plantilla
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {templateDetails.signer_roles?.map((role, index) => (
            <Badge key={index} variant="outline" className="bg-white border-blue-300 text-blue-700">
              {role.role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Lista de firmantes requeridos */}
      <div className="space-y-3">
        {selectedRecipients.map((recipient, index) => (
          <div key={index} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">
                  {recipient.role || `Firmante ${index + 1}`}
                </span>
                {recipient.full_name && recipient.email && (
                  <Badge className="bg-green-100 text-green-800">Completado</Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingIndex(editingIndex === index ? -1 : index)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {editingIndex === index ? 'Cerrar' : 'Seleccionar'}
                </Button>
                
                {recipient.full_name && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearRecipient(index)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Información del firmante actual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium">Nombre *</Label>
                <Input
                  value={recipient.full_name}
                  onChange={(e) => handleManualEdit(index, 'full_name', e.target.value)}
                  placeholder="Nombre completo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Email *</Label>
                <Input
                  value={recipient.email}
                  onChange={(e) => handleManualEdit(index, 'email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="mt-1"
                  type="email"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Teléfono</Label>
                <Input
                  value={recipient.phone}
                  onChange={(e) => handleManualEdit(index, 'phone', e.target.value)}
                  placeholder="Teléfono (opcional)"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Panel de selección de usuario */}
            {editingIndex === index && (
              <div className="mt-4 border-t pt-4">
                <Label className="text-sm font-medium mb-2 block">
                  O seleccionar de usuarios existentes:
                </Label>
                
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar usuarios por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <ScrollArea className="h-32 border rounded-md p-2">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.slice(0, 10).map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleSelectUser(user, index)}
                          className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={``} />
                            <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{user.full_name || 'Sin nombre'}</div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          </div>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-center text-sm text-slate-500 py-4">
                          No se encontraron usuarios
                        </p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Firmantes configurados: {selectedRecipients.filter(r => r.full_name && r.email).length} de {requiredSigners}
          </span>
          {selectedRecipients.filter(r => r.full_name && r.email).length === requiredSigners && (
            <Badge className="bg-green-100 text-green-800">
              ✓ Todos los firmantes configurados
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}