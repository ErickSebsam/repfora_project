import xlsx from 'xlsx-js-style';

export const exportPlanningToExcel = (planningData, $q) => {
  if (!planningData) {
    if ($q) $q.notify({ message: 'No hay datos de planeación para exportar', color: 'red-8' });
    return;
  }
  
  try {
    const metadata = planningData.metadata || {};
    
    // Crear el libro de Excel
    const wb = xlsx.utils.book_new();
    const aoa = [];
    
    // Fila 1 (index 0): Logo y Versión
    aoa.push(['', '', '', '', '', '', '', '', '', '', '', '', '', 'Versión: 04', '', '']);
    // Fila 2 (index 1): Logo y Código
    aoa.push(['', '', '', '', '', '', '', '', '', '', '', '', '', 'Código: GFPI-F-134', '', '']);
    
    // Fila 3 (index 2): Cabecera institucional
    aoa.push(['Proceso Gestión de Formación Profesional Integral', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 4 (index 3): Nombre del formato
    aoa.push(['Formato Planeación Pedagógica', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 5 (index 4): Fecha de elaboración
    aoa.push(['Fecha de Elaboración', '', '', '', new Date().toLocaleDateString('es-CO'), '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 6 (index 5): Denominación del programa
    aoa.push(['Denominación del Programa de Formación', '', '', '', metadata.programName || 'TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 7 (index 6): Modalidad de formación
    aoa.push(['Modalidad de Formación', '', '', '', 'Presencial', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 8 (index 7): Código y versión del programa
    aoa.push(['Código y versión del Programa de Formación', '', '', '', `${metadata.programCode || ''} v ${metadata.version || '1.0'}`, '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 9 (index 8): Nombre del Proyecto Formativo
    aoa.push(['Nombre del Proyecto Formativo (Diligencie esta casilla únicamente si es un programa de formación Titulada)', '', '', '', 'DESARROLLO DE SOFTWARE INTEGRADOR O DE SERVICIOS PARA EMPRESAS', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 10 (index 9): Código de proyecto / ficha
    aoa.push(['Código del Proyecto (Diligencie esta casilla únicamente si es un programa de formación Titulada)', '', '', '', planningData.fiche || '', '', '', '', '', '', '', '', '', '', '', '']);
    
    // Fila 11 (index 10): Equipo gestor
    aoa.push([
      'Nombre Completo de los integrantes del Equipo de Gestión Curricular que realizó la planeación pedagógica', '', '', '', 
      'Nombres y Apellidos', '', '', '', '', '', '', '', 
      'Regional y Centro de formación', '', '', ''
    ]);
    
    // Fila 12 (index 11)
    aoa.push([
      '', '', '', '', 
      'Nombres y Apellidos', '', '', '', '', '', '', '', 
      'Regional y Centro de formación', '', '', ''
    ]);
    
    // Fila 13 (index 12)
    aoa.push([
      '', '', '', '', 
      'Nombres y Apellidos', '', '', '', '', '', '', '', 
      'Regional y Centro de formación', '', '', ''
    ]);
    
    // Fila 14 (index 13)
    aoa.push([
      '', '', '', '', 
      'Nombres y Apellidos', '', '', '', '', '', '', '', 
      'Regional y Centro de formación', '', '', ''
    ]);
    
    // Fila 15 (index 14): Cabeceras de la tabla
    aoa.push([
      'FASE DE\nPROYECTO\nFORMATIVO (Si\nel programa es\nde titulada)',
      'ACTIVIDAD DE\nPROYECTO\nFORMATIVO (\nSi el programa\nes de titulada)',
      'COMPETENCI\nA',
      'RESULTADOS DE APRENDIZAJE',
      'SABERES DE CONCEPTOS Y\nPRINCIPIOS',
      'SABERES DE PROCESO',
      'CRITERIOS DE EVALUACIÓN',
      'ACTIVIDADES DE\nAPRENDIZAJE A\nDESARROLLAR',
      'DURACIÓN ACTIVIDAD DE APRENDIZAJE\n(HORAS)',
      '', 
      'DESCRIPCIÓN DE LA\nEVIDENCIA DE\nAPRENDIZAJE',
      'ESTRATEGIAS\nDIDÁCTICAS\nACTIVAS',
      'AMBIENTES DE\nAPRENDIZAJE TIPIFICADOS',
      '',
      '',
      'OBSERVACIONES'
    ]);
    
    // Fila 16 (index 15): Subcabeceras de la tabla
    aoa.push([
      '', '', '', '', '', '', '', '',
      'HORAS TRABAJO\nDIRECTO',
      'HORAS TRABAJO\nINDEPENDIENTE',
      '', '',
      'AMBIENTE',
      'MATERIALES DE\nFORMACIÓN',
      'INSTRUCTORES\nRESPONSABLES',
      ''
    ]);
    
    // Recorrer el contenido pedagógico de la planeación
    const content = planningData.content || [];
    content.forEach((phase) => {
      const phaseName = phase.phase || '';
      const projectActivity = phase.projectActivity || '';
      
      (phase.competencies || []).forEach((comp) => {
        const concepts = (comp.knowledge?.conceptsAndPrinciples || []).map(x => `* ${x}`).join('\n');
        const processes = (comp.knowledge?.processes || []).map(x => `* ${x}`).join('\n');
        
        (comp.learningOutcomes || []).forEach((rap) => {
          const evalCriteria = (rap.evaluationCriteria || []).map(x => `* ${x}`).join('\n');
          
          (rap.pedagogicalActivities || []).forEach((act) => {
            const evidences = (act.learningEvidences || []).map(x => `* ${x}`).join('\n');
            const strategies = (act.didacticStrategies || []).map(x => `* ${x}`).join('\n');
            const materials = (act.environment?.materials || []).map(x => `* ${x}`).join('\n');
            const envType = act.environment?.type || 'No definido';
            
            let instructorName = act.suggestedInstructor?.name || act.instructors?.name || 'No asignado';
            if (act.scheduleDetails && act.scheduleDetails.assignedDays && act.scheduleDetails.assignedDays.length > 0) {
              instructorName += `\n(Fechas: ${act.scheduleDetails.assignedDays.join(', ')})`;
            }
            
            aoa.push([
              phaseName,
              projectActivity,
              comp.name || '',
              rap.description || '',
              concepts,
              processes,
              evalCriteria,
              act.description || '',
              Number(act.hours?.direct) || 0,
              Number(act.hours?.independent) || 0,
              evidences,
              strategies,
              envType,
              materials,
              instructorName,
              '' // OBSERVACIONES
            ]);
          });
        });
      });
    });
    
    const ws = xlsx.utils.aoa_to_sheet(aoa);
    
    // Configurar fusiones (merges) de celdas
    ws['!merges'] = [
      { s: { r: 0, c: 13 }, e: { r: 0, c: 15 } },
      { s: { r: 1, c: 13 }, e: { r: 1, c: 15 } },

      { s: { r: 2, c: 0 }, e: { r: 2, c: 15 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 15 } },

      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
      { s: { r: 4, c: 4 }, e: { r: 4, c: 15 } },
      { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } },
      { s: { r: 5, c: 4 }, e: { r: 5, c: 15 } },
      { s: { r: 6, c: 0 }, e: { r: 6, c: 3 } },
      { s: { r: 6, c: 4 }, e: { r: 6, c: 15 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 3 } },
      { s: { r: 7, c: 4 }, e: { r: 7, c: 15 } },
      { s: { r: 8, c: 0 }, e: { r: 8, c: 3 } },
      { s: { r: 8, c: 4 }, e: { r: 8, c: 15 } },
      { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } },
      { s: { r: 9, c: 4 }, e: { r: 9, c: 15 } },

      { s: { r: 10, c: 0 }, e: { r: 13, c: 3 } },
      { s: { r: 10, c: 4 }, e: { r: 10, c: 11 } },
      { s: { r: 10, c: 12 }, e: { r: 10, c: 15 } },
      { s: { r: 11, c: 4 }, e: { r: 11, c: 11 } },
      { s: { r: 11, c: 12 }, e: { r: 11, c: 15 } },
      { s: { r: 12, c: 4 }, e: { r: 12, c: 11 } },
      { s: { r: 12, c: 12 }, e: { r: 12, c: 15 } },
      { s: { r: 13, c: 4 }, e: { r: 13, c: 11 } },
      { s: { r: 13, c: 12 }, e: { r: 13, c: 15 } },

      { s: { r: 14, c: 0 }, e: { r: 15, c: 0 } },
      { s: { r: 14, c: 1 }, e: { r: 15, c: 1 } },
      { s: { r: 14, c: 2 }, e: { r: 15, c: 2 } },
      { s: { r: 14, c: 3 }, e: { r: 15, c: 3 } },
      { s: { r: 14, c: 4 }, e: { r: 15, c: 4 } },
      { s: { r: 14, c: 5 }, e: { r: 15, c: 5 } },
      { s: { r: 14, c: 6 }, e: { r: 15, c: 6 } },
      { s: { r: 14, c: 7 }, e: { r: 15, c: 7 } },
      { s: { r: 14, c: 8 }, e: { r: 14, c: 9 } },
      { s: { r: 14, c: 10 }, e: { r: 15, c: 10 } },
      { s: { r: 14, c: 11 }, e: { r: 15, c: 11 } },
      { s: { r: 14, c: 12 }, e: { r: 14, c: 14 } },
      { s: { r: 14, c: 15 }, e: { r: 15, c: 15 } },
    ];
    
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 } 
    ];

    const borderThin = {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } }
    };

    for (const key in ws) {
      if (key[0] === '!') continue; 
      
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (!match) continue;
      
      const col = match[1];
      const row = parseInt(match[2], 10);
      const cell = ws[key];
      
      if (row === 1 || row === 2) {
        if (col === 'N' || col === 'O' || col === 'P') {
          cell.s = {
            font: { name: 'Calibri', sz: 9, color: { rgb: '000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          };
        }
      } else if (row === 3 || row === 4) {
        cell.s = {
          fill: { fgColor: { rgb: '595959' } },
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        };
      } else if (row >= 5 && row <= 14) {
        const isLabel = (col === 'A' || col === 'B' || col === 'C' || col === 'D');
        cell.s = {
          fill: { fgColor: { rgb: 'FFFFFF' } },
          font: { name: 'Calibri', sz: 9, bold: isLabel, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: borderThin
        };
      } else if (row === 15 || row === 16) {
        cell.s = {
          fill: { fgColor: { rgb: '595959' } },
          font: { name: 'Calibri', sz: 9, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: borderThin
        };
      } else if (row >= 17) {
        cell.s = {
          font: { name: 'Calibri', sz: 9, color: { rgb: '000000' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: borderThin
        };
      }
    }
    
    xlsx.utils.book_append_sheet(wb, ws, 'PLANEACION');
    
    const fileName = `Planeacion_Pedagogica_Ficha_${planningData.fiche || 'Sin_Ficha'}.xlsx`;
    xlsx.writeFile(wb, fileName);
    
    if ($q) {
      $q.notify({
        message: '¡Excel oficial de Planeación exportado con éxito con formato estandarizado!',
        color: 'green-9',
        icon: 'check_circle',
        position: 'top'
      });
    }
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    if ($q) {
      $q.notify({
        message: 'Error al exportar a Excel oficial con estilos',
        color: 'red-8',
        icon: 'error',
        position: 'top'
      });
    }
  }
};

