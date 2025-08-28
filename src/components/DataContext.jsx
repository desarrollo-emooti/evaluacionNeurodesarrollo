
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User } from '@/api/entities';
import { TestAssignment } from '@/api/entities';
import { Student } from '@/api/entities';
import { Center } from '@/api/entities';
import { PreRegisteredUser } from '@/api/entities';
import { toast } from "sonner";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [centers, setCenters] = useState([]);
  const [users, setUsers] = useState([]);
  const [preRegisteredUsers, setPreRegisteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);

      let assignmentList = [];
      let studentList = [];
      let centerList = [];
      let userList = [];
      let preRegisteredUserList = [];

      if (userData.user_type === 'administrador') {
        [assignmentList, studentList, centerList, userList, preRegisteredUserList] = await Promise.all([
          TestAssignment.list('-assigned_date'),
          Student.list(),
          Center.list(),
          User.list(),
          PreRegisteredUser.list()
        ]);
      } else if (userData.user_type === 'familia') {
        // Lógica específica para rol Familia
        studentList = await Student.filter({ family_user_id: userData.id });
        const studentIds = studentList.map(s => s.id);
        // Collect unique center IDs from the students associated with this family
        const centerIds = [...new Set(studentList.map(s => s.center_id).filter(Boolean))]; 

        if (studentIds.length > 0) {
          [assignmentList, centerList] = await Promise.all([
            TestAssignment.filter({ student_id: { $in: studentIds } }, '-assigned_date'),
            Center.filter({ id: { $in: centerIds } })
          ]);
        } else {
          // If no students are found for this family user, ensure lists are empty
          assignmentList = [];
          centerList = [];
        }
        
        // Los familiares no deben ver otros usuarios ni usuarios pre-registrados
        userList = [];
        preRegisteredUserList = [];

      } else { // Para cualquier otro rol (orientador, clinica, etc.)
        if (!userData.center_id) {
          console.warn(`El usuario ${userData.email} (rol: ${userData.user_type}) no tiene un centro asignado.`);
          toast.warning("No tienes un centro asignado", { 
            description: "Por favor, contacta a un administrador para que te asigne a un centro educativo y puedas ver los datos."
          });
          // Se dejan las listas vacías
        } else {
          const studentIdsInCenter = (await Student.filter({ center_id: userData.center_id })).map(s => s.id);
        
          [assignmentList, studentList, centerList, userList, preRegisteredUserList] = await Promise.all([
            TestAssignment.filter({ student_id: { $in: studentIdsInCenter } }, '-assigned_date'),
            Student.filter({ center_id: userData.center_id }),
            Center.filter({ id: userData.center_id }),
            User.filter({ center_id: userData.center_id }),
            PreRegisteredUser.filter({ center_id: userData.center_id })
          ]);
        }
      }

      setAssignments(assignmentList);
      setStudents(studentList);
      setCenters(centerList);
      setUsers(userList);
      setPreRegisteredUsers(preRegisteredUserList);

    } catch (err) {
      console.error('Error cargando datos en el contexto:', err);
      toast.error('Error al sincronizar los datos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadData();

    const intervalId = setInterval(() => {
      console.log("Sincronizando datos en segundo plano...");
      loadData();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loadData]);

  const value = {
    currentUser,
    assignments,
    students,
    centers,
    users,
    preRegisteredUsers,
    isLoading,
    loadData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
