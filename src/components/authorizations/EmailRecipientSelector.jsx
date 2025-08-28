
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmailRecipientSelector({ requiredRecipients, onRecipientsChange }) {
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientsData, setRecipientsData] = useState([]);

  useEffect(() => {
    const initialData = requiredRecipients.map(signer => ({
      role: signer.role,
      fullName: '',
      email: '',
    }));
    setRecipientsData(initialData);
    onRecipientsChange(initialData);
  }, [requiredRecipients, onRecipientsChange]); // Added onRecipientsChange to dependency array

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

  const handleRecipientChange = (index, field, value) => {
    const updatedRecipients = recipientsData.map((recipient, i) => {
      if (i === index) {
        return { ...recipient, [field]: value };
      }
      return recipient;
    });
    setRecipientsData(updatedRecipients);
    onRecipientsChange(updatedRecipients);
  };
  
  const handleUserSelect = (index, userId) => {
    if (userId === "manual") {
      handleRecipientChange(index, 'fullName', '');
      handleRecipientChange(index, 'email', '');
      return;
    }
    const selectedUser = allUsers.find(u => u.id === userId);
    if (selectedUser) {
      const updatedRecipients = recipientsData.map((recipient, i) => {
        if (i === index) {
          return { ...recipient, fullName: selectedUser.full_name, email: selectedUser.email };
        }
        return recipient;
      });
      setRecipientsData(updatedRecipients);
      onRecipientsChange(updatedRecipients);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-2">
        {Array.from({ length: requiredRecipients.length }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 bg-white space-y-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      {recipientsData.map((recipient, index) => (
        <div key={index} className="border rounded-lg p-4 bg-white">
          <Label className="text-base font-semibold text-slate-800">
            Firmante {index + 1}: <span className="text-blue-600">{recipient.role}</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <Label className="text-sm font-medium">Asignar Usuario</Label>
              <Select onValueChange={(userId) => handleUserSelect(index, userId)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar usuario..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">-- Escribir Manualmente --</SelectItem>
                  {allUsers.map(user => <SelectItem key={user.id} value={user.id}>{user.full_name} ({user.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Nombre</Label>
              <Input
                value={recipient.fullName}
                onChange={(e) => handleRecipientChange(index, 'fullName', e.target.value)}
                placeholder="Nombre completo (o dejar en blanco)"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input
                type="email"
                value={recipient.email}
                onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
