
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileX,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { processImportFile } from '../components/importer'; // Corregir la ruta de importación

export default function ImportUsers() {
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [fileType, setFileType] = useState(null); // 'usuarios' o 'alumnos'

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadResults(null);
      setPreviewData(null);

      // Determine file type based on name for processing logic
      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.includes('alumnos')) {
        setFileType('alumnos');
      } else if (fileNameLower.includes('usuarios')) {
        setFileType('usuarios');
      } else {
        setFileType(null);
        toast.warning("Tipo de plantilla no determinado. Asegúrate de que el nombre del archivo contenga 'usuarios' o 'alumnos'.");
      }
    }
  };

  const processFile = async () => {
    if (!uploadFile) return;

    if (!fileType) {
        toast.error("Tipo de plantilla no determinado. Asegúrate de que el nombre del archivo contenga 'usuarios' o 'alumnos'.");
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    await processImportFile({
        file: uploadFile,
        fileType: fileType,
        onProgress: setUploadProgress,
        onComplete: (results) => {
            setUploadResults(results);
            if (results.errors > 0) {
              toast.warning(`${results.errors} registro(s) no se pudieron importar.`);
            }
            if (results.success > 0) {
              toast.success(`${results.success} registro(s) importados correctamente.`);
            }
            if (results.success === 0 && results.errors === 0 && results.total > 0) {
              toast.info("No se realizaron importaciones. Verifica el formato de tus datos.");
            }
            setIsUploading(false);
        },
        onError: (error) => {
            toast.error(`Error procesando el archivo: ${error.message}`);
            setIsUploading(false);
        }
    });
  };

  const showPreview = () => {
    if (!uploadFile) {
      toast.error("Por favor, selecciona un archivo para previsualizar.");
      return;
    }
    
    // Simple preview logic
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        // Ensure we handle different line endings and filter out empty lines
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

        if (lines.length < 2) { // At least one header and one data row expected
          setPreviewData([]);
          toast.info("El archivo está vacío o no contiene datos para previsualizar.");
          return;
        }

        // Define a regex to split by semicolon, correctly handling quoted fields for preview
        const splitRegex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;

        const parseLineForPreview = (line) => {
          return line.split(splitRegex).map(v => {
            let value = v.trim();
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.substring(1, value.length - 1);
            }
            return value.replace(/""/g, '"');
          });
        };

        const headers = parseLineForPreview(lines[0]);
        // Show first 3 data rows for preview
        const dataRows = lines.slice(1, 4).map(parseLineForPreview); 

        const preview = dataRows.map(rowValues => {
            let rowObj = {};
            headers.forEach((header, index) => {
                rowObj[header] = rowValues[index] === '' ? null : rowValues[index];
            });
            return rowObj;
        });

        if (preview.length > 0) {
          setPreviewData(preview);
        } else {
          setPreviewData([]);
          toast.info("El archivo está vacío o no contiene datos para previsualizar.");
        }
      } catch (error) {
        toast.error("Error al leer el archivo para previsualización.");
        console.error("Preview read error:", error);
        setPreviewData(null);
      }
    };
    reader.readAsText(uploadFile, 'UTF-8');
  };

  const downloadTemplate = (type) => {
    let csvContent = '';
    let filename = '';
    const bom = '\uFEFF'; // UTF-8 BOM for better Excel compatibility
    const delimiter = ';'; // Semicolon as delimiter for better Excel compatibility in some regions

    // Function to ensure proper CSV quoting and escaping for Excel
    const formatCsvField = (value) => {
      const stringValue = String(value); // Ensure value is a string
      // Escape double quotes by doubling them
      const escapedValue = stringValue.replace(/"/g, '""');
      // Enclose the value in double quotes
      return `"${escapedValue}"`;
    };

    if (type === 'usuarios') {
      const headers = [
        'Nombre Completo',
        'Email',
        'Teléfono',
        'Tipo de Usuario', // administrador, clinica, orientador, examinador, familia
        'DNI',
        'Fecha de Nacimiento (YYYY-MM-DD)',
        'Nacionalidad',
        'Dirección',
        'Código Postal',
        'Localidad',
        'Provincia',
        'País',
        'ID Centro (Si aplica)', // Link to an existing center ID
        'Especialidad (Para clínica/orientador)',
        'Número Colegiado (Para clínica/orientador)',
        'Contraseña (Opcional)', // If they want to pre-set passwords
        'ID Responsable (Email/DNI, si aplica)', // For examiners supervised by another user
        'Observaciones'
      ];

      const sampleRow = [
        'Ana García López',
        'ana.garcia@email.com',
        '612345678',
        'familia',
        '12345678A',
        '1985-06-20',
        'Española',
        'Calle Falsa 123',
        '28001',
        'Madrid',
        'Madrid',
        'España',
        'CENTRO_001',
        '', // Especialidad
        '', // Número Colegiado
        'micontraseña123',
        '', // ID Responsable
        'Notas adicionales para Ana'
      ];

      csvContent = headers.map(formatCsvField).join(delimiter) + '\n' + sampleRow.map(formatCsvField).join(delimiter);
      filename = 'plantilla_usuarios.csv';

    } else if (type === 'alumnos') {
      const headers = [
        'Nombre Completo',
        'Fecha de Nacimiento (YYYY-MM-DD)',
        'Género', // masculino, femenino, otro
        'DNI (Opcional)',
        'Nacionalidad',
        'Dirección',
        'Código Postal',
        'Localidad',
        'Provincia',
        'País',
        'Etapa', // Educación Infantil, Educación Primaria, ESO, Bachillerato, Formación Profesional
        'Curso', // Depende de la etapa seleccionada
        'Grupo/Clase', // A, B, C, D, E, F, G
        'ID Centro', // Link to an existing center ID
        'ID Padre/Madre/Tutor 1 (Email o DNI)', // Link to existing users (family type)
        'ID Padre/Madre/Tutor 2 (Email o DNI)',
        'Grado de Discapacidad (%)',
        'Necesidades Educativas Especiales (NEE)', // e.g., TDAH, Dislexia, TEA
        'Observaciones Médicas',
        'Observaciones Generales',
        'Consentimiento Informado (Sí, No, Pendiente, N/A)', // Added consent field
        'Tipo de Pago (B2B/B2B2C)' // Nuevo campo
      ];

      const sampleRow = [
        'Juan Pérez Martín',
        '2015-03-15',
        'masculino',
        '98765432B', // DNI
        'Española',
        'Avenida Siempre Viva 742',
        '08001',
        'Barcelona',
        'Barcelona',
        'España',
        'Educación Primaria',
        '3º Primaria',
        'A',
        'CENTRO_001',
        'padre.juan@email.com',
        'madre.juan@email.com',
        '0', // Grado de Discapacidad
        'Dislexia', // NEE
        'Alergia al cacahuete',
        'Necesita atención especial en lectura',
        'Pendiente', // Sample consent value
        'B2B' // Sample payment type
      ];

      csvContent = headers.map(formatCsvField).join(delimiter) + '\n' + sampleRow.map(formatCsvField).join(delimiter);
      filename = 'plantilla_alumnos.csv';
    }

    // Prepend BOM to the final CSV content
    const finalCsvContent = bom + csvContent;

    // Crear y descargar el archivo CSV real
    const blob = new Blob([finalCsvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up the URL object
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Importar Usuarios y Alumnos</h1>
          <p className="text-slate-600">Importación masiva desde Excel/CSV con validación estructural</p>
        </div>

        <div className="space-y-6">

          {/* Download Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Download className="w-5 h-5" />
                Plantillas de Importación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('usuarios')}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                >
                  <FileSpreadsheet className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">Plantilla Usuarios</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Para administradores, clínica, orientadores, examinadores y familias
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('alumnos')}
                  className="flex items-center gap-2 h-auto p-4 flex-col"
                >
                  <FileSpreadsheet className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">Plantilla Alumnos</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Para estudiantes con datos académicos completos
                    </div>
                  </div>
                </Button>
              </div>

              <Alert className="mt-6 border-blue-200 bg-blue-50">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Importante:</strong> Las plantillas se descargan en formato CSV compatible con Excel.
                  <br />
                  <strong>Plantilla Usuarios:</strong> Incluye campos como nombre, email, teléfono, tipo de usuario, DNI, fecha de nacimiento, datos de contacto, centro, especialidad y número de colegiado.
                  <br />
                  <strong>Plantilla Alumnos:</strong> Incluye campos como nombre, fecha de nacimiento, género, DNI, datos de contacto, etapa, curso, grupo, centro, tutores, y necesidades educativas.
                  <br />
                  Rellena las filas con tus datos y sube el archivo para importación masiva.
                </AlertDescription>
              </Alert>

              {/* Instructions for each template */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">Instrucciones - Plantilla Usuarios</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• <strong>Tipo de Usuario:</strong> administrador, clinica, orientador, examinador, familia</li>
                    <li>• <strong>Email:</strong> Debe ser único en el sistema</li>
                    <li>• <strong>ID Centro:</strong> ID del centro al que pertenece el usuario (ej: CENTRO_001). Debe existir en el sistema.</li>
                    <li>• <strong>Especialidad:</strong> Obligatorio para tipo "clinica" y "orientador"</li>
                    <li>• <strong>Número Colegiado:</strong> Para "clinica" y "orientador"</li>
                    <li>• <strong>Fecha de Nacimiento:</strong> Formato YYYY-MM-DD</li>
                    <li>• <strong>Contraseña:</strong> Campo opcional. Si se deja vacío, el sistema generará una.</li>
                    <li>• <strong>ID Responsable:</strong> Email o DNI de un usuario existente (ej: un administrador que supervisa un examinador).</li>
                    <li>• <strong>Formato:</strong> CSV compatible con Excel</li>
                  </ul>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-2">Instrucciones - Plantilla Alumnos</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• <strong>Fecha Nacimiento:</strong> Formato YYYY-MM-DD</li>
                    <li>• <strong>Género:</strong> masculino, femenino, otro</li>
                    <li>• <strong>Etapa:</strong> Educación Infantil, Educación Primaria, ESO, Bachillerato, Formación Profesional</li>
                    <li>• <strong>Curso:</strong> Depende de la etapa seleccionada (ej: 3º Primaria, 1º Bachillerato)</li>
                    <li>• <strong>Grupo/Clase:</strong> A, B, C, D, E, F, G, etc.</li>
                    <li>• <strong>ID Centro:</strong> ID del centro al que pertenece el alumno (ej: CENTRO_001). Debe existir en el sistema.</li>
                    <li>• <strong>ID Padre/Madre/Tutor:</strong> Email o DNI de usuarios de tipo "familia" ya registrados.</li>
                    <li>• <strong>Grado de Discapacidad:</strong> Porcentaje numérico (0-100).</li>
                    <li>• <strong>Necesidades Educativas Especiales (NEE):</strong> Texto libre (ej: TDAH, Dislexia, TEA).</li>
                    <li>• <strong>Consentimiento:</strong> Sí, No, Pendiente, N/A. Por defecto es Pendiente.</li>
                    <li>• <strong>Tipo de Pago:</strong> B2B o B2B2C. Por defecto es B2B.</li>
                    <li>• <strong>Formato:</strong> CSV compatible con Excel</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Upload className="w-5 h-5" />
                Subir Archivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-lg font-medium text-slate-600 hover:text-blue-600">
                    Haz clic para seleccionar archivo
                  </span>
                  <p className="text-sm text-slate-500 mt-1">o arrastra y suelta aquí</p>
                  <p className="text-xs text-slate-400 mt-2">Archivo en formato CSV (guardado desde Excel)</p>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {uploadFile && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium text-slate-900">{uploadFile.name}</p>
                        <p className="text-sm text-slate-500">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {fileType && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tipo detectado: <span className="font-semibold">{fileType === 'usuarios' ? 'Usuarios' : 'Alumnos'}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={showPreview} disabled={isUploading}>
                        <Eye className="w-4 h-4 mr-2" />
                        Vista Previa
                      </Button>
                      <Button
                        onClick={processFile}
                        disabled={isUploading || !fileType} // Disable if no fileType detected
                        size="sm"
                      >
                        {isUploading ? 'Procesando...' : 'Importar'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Procesando archivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Data */}
          {previewData && previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="w-5 h-5" />
                  Vista Previa (Primeras {previewData.length} filas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-50">
                       {Object.keys(previewData[0]).map(key => (
                         <th key={key} className="border border-slate-300 p-2 text-left text-xs sm:text-sm whitespace-nowrap">
                            {key}
                          </th>
                       ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i} className="border border-slate-300 p-2 text-xs sm:text-sm whitespace-nowrap">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Resultados de la Importación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"> {/* Adjusted grid cols */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{uploadResults.total}</p>
                    <p className="text-sm text-slate-600">Total Registros</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{uploadResults.success}</p>
                    <p className="text-sm text-slate-600">Importados</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{uploadResults.errors}</p>
                    <p className="text-sm text-slate-600">Errores</p>
                  </div>
                </div>

                {/* Error Details */}
                {uploadResults.errorDetails && uploadResults.errorDetails.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileX className="w-4 h-4" />
                      Detalles de Errores ({uploadResults.errorDetails.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 p-2 rounded-md bg-white">
                      {uploadResults.errorDetails.map((error, index) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-sm">
                            <span className="font-medium text-red-800">Fila {error.row}:</span>
                            <span className="text-red-600 ml-2">{error.error}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      {/* Placeholder for download error log functionality */}
                      <Button variant="outline" size="sm" onClick={() => toast.info("Funcionalidad de descarga de log de errores no implementada aún.")}>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Log de Errores
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
