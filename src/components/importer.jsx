import { User } from '@/api/entities';
import { PreRegisteredUser } from '@/api/entities';
import { Student } from '@/api/entities';
import { toast } from "sonner";

// Simple CSV parser
function parseCSV(text) {
  const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return { headers: [], data: [] };

  const splitRegex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;

  const parseLine = (line) => {
    return line.split(splitRegex).map(v => {
      let value = v.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      return value.replace(/""/g, '"');
    });
  };

  const headers = parseLine(lines[0]);
  const data = lines.slice(1).map(line => {
    const values = parseLine(line);
    let row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] === '' ? null : values[index];
    });
    return row;
  });
  return { headers, data };
}

export const processImportFile = async ({ file, fileType, onProgress, onComplete, onError }) => {
  if (!file || !fileType) {
    onError(new Error("Archivo o tipo de archivo no especificado."));
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const text = event.target.result;
      const { data } = parseCSV(text);
      
      let results = {
        total: data.length,
        success: 0,
        errors: 0,
        errorDetails: []
      };

      if (data.length === 0) {
        toast.info("El archivo CSV está vacío o solo contiene la cabecera.");
        onComplete({ ...results });
        return;
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 2; // +1 for zero-index, +1 for header
        try {
          if (fileType === 'usuarios') {
            if (!row['Email'] || !row['Tipo de Usuario']) throw new Error("Faltan campos obligatorios: Email, Tipo de Usuario.");
            
            const userType = row['Tipo de Usuario']?.toLowerCase();
            const validUserTypes = ['administrador', 'clinica', 'orientador', 'examinador', 'familia'];
            if (!validUserTypes.includes(userType)) throw new Error(`Tipo de usuario inválido: '${row['Tipo de Usuario']}'.`);
            
            if (!/\S+@\S+\.\S+/.test(row['Email'])) throw new Error(`Formato de email inválido: '${row['Email']}'.`);
            
            await PreRegisteredUser.create({
              full_name: row['Nombre Completo'],
              email: row['Email'],
              phone: row['Teléfono'],
              user_type: userType,
              dni: row['DNI'],
              birth_date: row['Fecha de Nacimiento (YYYY-MM-DD)'],
              nationality: row['Nacionalidad'],
              address: row['Dirección'],
              postal_code: row['Código Postal'],
              city: row['Localidad'],
              province: row['Provincia'],
              country: row['País'],
              center_id: row['ID Centro (Si aplica)'] || undefined,
              specialty: row['Especialidad (Para clínica/orientador)'] || undefined,
              license_number: row['Número Colegiado (Para clínica/orientador)'] || undefined,
              password: row['Contraseña (Opcional)'],
              responsible_id: row['ID Responsable (Email/DNI, si aplica)'],
              observations: row['Observaciones'],
              status: row['Contraseña (Opcional)'] ? 'active_with_password' : 'pending_invitation'
            });

          } else if (fileType === 'alumnos') {
            if (!row['Nombre Completo'] || !row['Fecha de Nacimiento (YYYY-MM-DD)'] || !row['Etapa'] || !row['Curso'] || !row['ID Centro']) throw new Error("Faltan campos: Nombre, Fecha Nacimiento, Etapa, Curso, ID Centro.");
            
            const birthDate = row['Fecha de Nacimiento (YYYY-MM-DD)'];
            if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error(`Formato de fecha inválido: '${birthDate}'. Use YYYY-MM-DD.`);
            
            let disabilityDegree = parseFloat(row['Grado de Discapacidad (%)']);
            if (row['Grado de Discapacidad (%)'] !== null && (isNaN(disabilityDegree) || disabilityDegree < 0 || disabilityDegree > 100)) {
              disabilityDegree = 0; // Default to 0 if invalid
            } else if (row['Grado de Discapacidad (%)'] === null) {
              disabilityDegree = 0;
            }

            const studentData = {
              full_name: row['Nombre Completo'],
              birth_date: birthDate,
              gender: row['Género']?.toLowerCase() || undefined,
              dni: row['DNI (Opcional)'] || undefined,
              nationality: row['Nacionalidad'] || undefined,
              address: row['Dirección'] || undefined,
              postal_code: row['Código Postal'] || undefined,
              city: row['Localidad'] || undefined,
              province: row['Provincia'] || undefined,
              country: row['País'] || undefined,
              etapa: row['Etapa'],
              course: row['Curso'],
              class_group: row['Grupo/Clase'] || undefined,
              center_id: row['ID Centro'],
              family_user_id: row['ID Padre/Madre/Tutor 1 (Email o DNI)'] || undefined,
              family_user_id_2: row['ID Padre/Madre/Tutor 2 (Email o DNI)'] || undefined,
              disability_degree: disabilityDegree,
              special_educational_needs: row['Necesidades Educativas Especiales (NEE)'] || undefined,
              medical_observations: row['Observaciones Médicas'] || undefined,
              general_observations: row['Observaciones Generales'] || undefined,
              active: true,
              consent_given: ['sí', 'si', 'pendiente', 'n/a'].includes(row['Consentimiento Informado (Sí, No, Pendiente, N/A)']?.toLowerCase()) ? row['Consentimiento Informado (Sí, No, Pendiente, N/A)'] : 'Pendiente',
              payment_type: ['B2B', 'B2B2C'].includes(row['Tipo de Pago (B2B/B2B2C)']?.toUpperCase()) ? row['Tipo de Pago (B2B/B2B2C)'].toUpperCase() : 'B2B'
            };
            
            Object.keys(studentData).forEach(key => { if (studentData[key] === undefined) delete studentData[key]; });
            await Student.create(studentData);
          }
          results.success++;
        } catch (error) {
          results.errors++;
          results.errorDetails.push({ row: rowIndex, error: error.message });
        }
        onProgress(Math.round(((i + 1) / data.length) * 100));
      }

      onComplete(results);

    } catch (error) {
      onError(error);
    }
  };
  reader.readAsText(file, 'UTF-8');
};