// ────────────────────────────────────────────────────────────
// Mock data para desarrollo (estructura MongoDB real)
// ────────────────────────────────────────────────────────────
export const MOCK_PLANNING = {
  _id: 'mock-001',
  pedagogicalPlanning: {
    metadata: {
      programName: 'EJECUCIÓN DE PROGRAMAS DEPORTIVOS',
      programCode: '639209',
      version: '2',
      center: 'CENTRO DE SERVICIOS Y GESTIÓN EMPRESARIAL',
      totalHours: 2208,
      lectivaHours: 1344,
      productivaHours: 864,
    },
    fiche: '3065259',
    startDate: '2026-01-15',
    status: 'draft',
    content: [
      {
        phase: 'ANALYSIS',
        projectActivity: 'Diagnosticar las conditions físicas, técnicas y tácticas de los deportistas para la formulación de programas deportivos',
        competencies: [
          {
            name: 'ORIENTAR PROCESOS FORMATIVOS EN LA METODOLOGÍA DE LA INVESTIGACIÓN',
            code: '240201501',
            totalCompetenceHours: 48,
            knowledge: {
              conceptsAndPrinciples: ['Metodología de la investigación', 'Técnicas de recolección de datos', 'Análisis cuantitativo y cualitativo'],
              processes: ['Aplicar instrumentos de recolección', 'Analizar resultados', 'Formular hipótesis'],
            },
            learningOutcomes: [
              {
                description: 'Definir el problema de investigación con base en la observación y análisis del contexto deportivo',
                evaluationCriteria: ['Identifica variables del problema', 'Aplica técnicas de observación', 'Documenta hallazgos'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Identificar instrumentos de recolección de información según el tipo de investigación deportiva',
                evaluationCriteria: ['Selecciona instrumentos adecuados', 'Diseña formatos de registro', 'Valida instrumentos'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
          {
            name: 'VALORAR LA CONDICIÓN FÍSICA DEL DEPORTISTA SEGÚN PROTOCOLOS Y NORMATIVIDAD',
            code: '230101068',
            totalCompetenceHours: 120,
            knowledge: {
              conceptsAndPrinciples: ['Fisiología del ejercicio', 'Cineantropometría', 'Tests de condición física', 'Protocolos de valoración'],
              processes: ['Aplicar baterías de tests', 'Interpretar resultados fisiológicos', 'Elaborar informes de valoración'],
            },
            learningOutcomes: [
              {
                description: 'Ejecutar protocolos de valoración de la condición física según parámetros técnicos establecidos',
                evaluationCriteria: ['Aplica protocolos correctamente', 'Registra datos con precisión', 'Utiliza equipos de medición'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Analizar resultados de la valoración física para determinar el estado del deportista',
                evaluationCriteria: ['Interpreta datos cuantitativos', 'Compara con tablas de referencia', 'Genera diagnósticos individuales'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Diseñar programas de acondicionamiento con base en los resultados de las pruebas físicas',
                evaluationCriteria: ['Estructura planes de entrenamiento', 'Define cargas and volúmenes', 'Periodiza el entrenamiento'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
          {
            name: 'PROMOVER LA INTERACCIÓN IDÓNEA CONSIGO MISMO, CON LOS DEMÁS Y CON LA NATURALEZA',
            code: '240201500',
            totalCompetenceHours: 48,
            knowledge: {
              conceptsAndPrinciples: ['Comunicación asertiva', 'Trabajo en equipo', 'Resolución de conflictos', 'Ética deportiva'],
              processes: ['Aplicar técnicas de comunicación', 'Liderar grupos', 'Mediar en conflictos'],
            },
            learningOutcomes: [
              {
                description: 'Desarrollar procesos comunicativos eficaces y asertivos en el contexto deportivo',
                evaluationCriteria: ['Demuestra habilidades comunicativas', 'Genera ambientes de respeto'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
        ],
      },
      {
        phase: 'PLANNING',
        projectActivity: 'Planificar programas de entrenamiento deportivo según necesidades identificadas',
        competencies: [
          {
            name: 'PROGRAMAR ACTIVIDADES DE PREPARACIÓN FÍSICA SEGÚN PLAN DE ENTRENAMIENTO',
            code: '230101069',
            totalCompetenceHours: 168,
            knowledge: {
              conceptsAndPrinciples: ['Planificación deportiva', 'Periodización', 'Macrociclos y mesociclos', 'Cargas de entrenamiento'],
              processes: ['Diseñar macrociclos', 'Definir objetivos por periodo', 'Calcular volúmenes e intensidades'],
            },
            learningOutcomes: [
              {
                description: 'Diseñar macrociclos de entrenamiento según las necesidades del deporte y el deportista',
                evaluationCriteria: ['Define periodos de preparación', 'Establece objetivos medibles', 'Calcula cargas progresivas'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Elaborar planes de sesión de entrenamiento de acuerdo con la periodización establecida',
                evaluationCriteria: ['Estructura sesiones completas', 'Incluye calentamiento y vuelta a la calma'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
          {
            name: 'COMPRENDER TEXTOS EN INGLÉS EN FORMA ESCRITA Y AUDITIVA',
            code: '240201502',
            totalCompetenceHours: 180,
            knowledge: {
              conceptsAndPrinciples: ['Vocabulario técnico deportivo en inglés', 'Gramática básica', 'Comprensión lectora'],
              processes: ['Leer documentos técnicos', 'Comprender instrucciones en inglés', 'Traducir terminología deportiva'],
            },
            learningOutcomes: [
              {
                description: 'Comprender frases y vocabulario habitual sobre temas deportivos de interés personal',
                evaluationCriteria: ['Identifica vocabulario deportivo en inglés', 'Comprende instrucciones básicas'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
        ],
      },
      {
        phase: 'EXECUTION',
        projectActivity: 'Ejecutar programas de entrenamiento deportivo aplicando metodologías apropiadas',
        competencies: [
          {
            name: 'DIRIGIR SESIONES DE ENTRENAMIENTO DEPORTIVO SEGÚN PLAN DE PREPARACIÓN',
            code: '230101070',
            totalCompetenceHours: 240,
            knowledge: {
              conceptsAndPrinciples: ['Metodología del entrenamiento', 'Técnicas de dirección', 'Control de cargas', 'Recuperación deportiva'],
              processes: ['Dirigir sesiones', 'Controlar intensidades', 'Aplicar correctivos técnicos'],
            },
            learningOutcomes: [
              {
                description: 'Dirigir sesiones de entrenamiento aplicando los principios metodológicos del deporte',
                evaluationCriteria: ['Conduce sesiones con fluidez', 'Aplica principios de entrenamiento', 'Controla el grupo'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Implementar estrategias de recuperación física post-entrenamiento según protocolos',
                evaluationCriteria: ['Aplica técnicas de recuperación', 'Monitorea la fatiga', 'Registra datos de recuperación'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Aplicar correctivos técnicos y tácticos durante la práctica deportiva',
                evaluationCriteria: ['Identifica errores técnicos', 'Comunica correcciones de forma efectiva'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
          {
            name: 'GESTIONAR EVENTOS DEPORTIVOS SEGÚN NORMATIVIDAD Y REQUERIMIENTOS',
            code: '230101071',
            totalCompetenceHours: 96,
            knowledge: {
              conceptsAndPrinciples: ['Organización de eventos', 'Logística deportiva', 'Normatividad de competencias'],
              processes: ['Planificar eventos', 'Coordinar logística', 'Ejecutar protocolos de competencia'],
            },
            learningOutcomes: [
              {
                description: 'Organizar eventos deportivos aplicando los protocolos de la normatividad vigente',
                evaluationCriteria: ['Planifica etapas del evento', 'Coordina personal y recursos'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
        ],
      },
      {
        phase: 'EVALUATION',
        projectActivity: 'Evaluar el impacto de los programas deportivos implementados',
        competencies: [
          {
            name: 'EVALUAR PROGRAMAS DEPORTIVOS SEGÚN INDICADORES DE GESTIÓN Y RESULTADOS',
            code: '230101072',
            totalCompetenceHours: 144,
            knowledge: {
              conceptsAndPrinciples: ['Indicadores de rendimiento', 'Evaluación de programas', 'Estadística deportiva'],
              processes: ['Diseñar indicadores', 'Recolectar datos de rendimiento', 'Analizar impacto'],
            },
            learningOutcomes: [
              {
                description: 'Evaluar el cumplimiento de objetivos del programa deportivo mediante indicadores de gestión',
                evaluationCriteria: ['Aplica indicadores cuantitativos', 'Interpreta resultados', 'Genera informes de evaluación'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
              {
                description: 'Diseñar instrumentos de seguimiento y control para los procesos deportivos',
                evaluationCriteria: ['Elabora matrices de seguimiento', 'Define puntos de control'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
          {
            name: 'RESULTADOS DE APRENDIZAJE ETAPA PRÁCTICA',
            code: '999999999',
            totalCompetenceHours: 864,
            knowledge: {
              conceptsAndPrinciples: ['Práctica empresarial', 'Aplicación de conocimientos'],
              processes: ['Ejecutar funciones en contexto real'],
            },
            learningOutcomes: [
              {
                description: 'Aplicar en la resolución de problemas reales del sector productivo los conocimientos adquiridos',
                evaluationCriteria: ['Demuestra competencias en contexto real', 'Cumple con funciones asignadas'],
                pedagogicalActivities: [
                  { description: '', hours: { direct: 0, independent: 0 } },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};