import { defineStore } from 'pinia';
import { PlanningService } from '../services/planning.service';
import { storeUser } from './users.js';

const normalizeName = (name) => {
  return (name || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

const isSameInstructor = (name1, name2) => {
  if (!name1 || !name2) return false;
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return true;
  
  const words1 = n1.split(/\s+/).filter(w => w.length > 2);
  const words2 = n2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const match1 = words1.every(w => words2.includes(w));
  const match2 = words2.every(w => words1.includes(w));
  
  const firstTwo1 = words1.slice(0, 2).join(' ');
  const firstTwo2 = words2.slice(0, 2).join(' ');
  const firstTwoMatch = firstTwo1 && firstTwo2 && firstTwo1 === firstTwo2;
  
  return match1 || match2 || firstTwoMatch;
};

const decodeTokenSafely = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    return JSON.parse(atob(padded));
  } catch (e) {
    return null;
  }
};

export const usePlanningStore = defineStore('planning', {
  state: () => ({
    planning: null,
    loading: false,
    selectedPhase: 'INDUCCION',
    searchQuery: '',
    phases: [
      { id: 'INDUCCION', label: 'INDUCCIÓN', icon: 'school' },
      { id: 'ANALYSIS', label: 'ANÁLISIS', icon: 'analytics' },
      { id: 'PLANNING', label: 'PLANEACIÓN', icon: 'event_note' },
      { id: 'EXECUTION', label: 'EJECUCIÓN', icon: 'play_circle' },
      { id: 'EVALUATION', label: 'EVALUACIÓN', icon: 'fact_check' },
      { id: 'ETAPA_PRODUCTIVA', label: 'ETAPA PRODUCTIVA', icon: 'work' },
    ],
  }),

  getters: {
    phaseCounts: (state) => {
      const q = state.searchQuery.toLowerCase();
      return state.phases.map((p) => {
        const phaseData = state.planning?.pedagogicalPlanning?.content?.find(
          (item) => item.phase === p.id
        );

        let count = 0;
        if (phaseData && phaseData.competencies) {
          phaseData.competencies.forEach(comp => {
            // Si hay búsqueda, verificar si la competencia coincide
            const matchComp = !q || comp.code.includes(q) || comp.name.toLowerCase().includes(q);
            
            if (matchComp && comp.learningOutcomes) {
              count += comp.learningOutcomes.length;
            }
          });
        }
        return { ...p, count };
      });
    },

    currentPhaseData: (state) => {
      if (!state.planning) return null;
      return state.planning.pedagogicalPlanning.content.find(
        (p) => p.phase === state.selectedPhase
      );
    },

    filteredCompetencies: (state) => {
      const data = state.planning?.pedagogicalPlanning?.content?.find(
        (p) => p.phase === state.selectedPhase
      );
      if (!data) return [];

      let comps = data.competencies || [];

      const userStore = storeUser();
      const token = userStore.token;
      let role = userStore.getRole();
      let instructorName = userStore.instructorData?.name || userStore.newConsult?.name;
      let currentUserEmail = (userStore.email || '').trim().toLowerCase();

      if (token) {
        const decoded = decodeTokenSafely(token);
        if (decoded) {
          role = decoded.rol || role;
          instructorName = instructorName || decoded.name;
          if (decoded.email) {
            currentUserEmail = decoded.email.trim().toLowerCase();
          }
        }
      }

      const roleUpper = (role || '').toUpperCase();
      const isProgrammerOrAdmin = ['PROGRAMADOR', 'COORDINADOR', 'ADMIN'].includes(roleUpper);

      // Contar total de actividades confirmadas en toda la planeación
      let totalConfirmedInPlan = 0;
      if (state.planning?.pedagogicalPlanning?.content) {
        state.planning.pedagogicalPlanning.content.forEach(phase => {
          if (phase.competencies) {
            phase.competencies.forEach(comp => {
              if (comp.learningOutcomes) {
                comp.learningOutcomes.forEach(rap => {
                  if (rap.pedagogicalActivities) {
                    rap.pedagogicalActivities.forEach(act => {
                      const sugg = act.suggestedInstructor || act.instructors;
                      if (sugg && sugg.assignmentStatus === 'confirmed') {
                        totalConfirmedInPlan++;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }

      // Si soy el líder de la planeación, y aún no se ha confirmado NINGUNA actividad en toda la planeación (borrador inicial),
      // le permitimos ver todo el contenido extraído.
      // Pero en el momento que se confirme al menos una actividad, se filtra para mostrarle solo lo que le corresponde.
      const leaderEmail = (state.planning?.pedagogicalPlanning?.leaderEmail || '').trim().toLowerCase();
      const isLeaderOfThisPlan = leaderEmail && currentUserEmail && leaderEmail === currentUserEmail;
      const showAllForLeader = isLeaderOfThisPlan && totalConfirmedInPlan === 0;

      // Si no es programador, coordinador o administrador,
      // filtramos para mostrar solo sus actividades confirmadas, A MENOS que sea el líder de un borrador nuevo
      if (!isProgrammerOrAdmin && !showAllForLeader) {
        if (instructorName) {
          comps = comps.map(c => {
            // Clonamos la competencia para no mutar el store original
            const compCopy = JSON.parse(JSON.stringify(c));
            
            // Filtramos los resultados de aprendizaje (learningOutcomes)
            compCopy.learningOutcomes = (compCopy.learningOutcomes || []).filter(rap => {
              // Filtramos las actividades pedagógicas asignadas y confirmadas
              rap.pedagogicalActivities = (rap.pedagogicalActivities || []).filter(act => {
                const sugg = act.suggestedInstructor || act.instructors;
                const isAssigned = sugg && sugg.name && isSameInstructor(sugg.name, instructorName);
                const isConfirmed = sugg && sugg.assignmentStatus === 'confirmed';
                return isAssigned && isConfirmed;
              });
              
              return rap.pedagogicalActivities.length > 0;
            });
            
            return compCopy;
          }).filter(c => c.learningOutcomes.length > 0);
        }
      }

      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        comps = comps.filter(c => 
          c.code.includes(state.searchQuery) || 
          c.name.toLowerCase().includes(q)
        );
      }
      return comps;
    },

    getCompetenceProgress: () => (competence) => {
      const totalExpected = competence.totalCompetenceHours || 0;
      let totalAssigned = 0;
      (competence.learningOutcomes || []).forEach((rap) => {
        (rap.pedagogicalActivities || []).forEach((act) => {
          totalAssigned += (Number(act.hours?.direct) || 0) + (Number(act.hours?.independent) || 0);
        });
      });
      const missing = totalExpected - totalAssigned;
      return {
        total: totalExpected,
        assigned: totalAssigned,
        missing: missing < 0 ? 0 : missing,
        percent: totalExpected > 0 ? Math.min(totalAssigned / totalExpected, 1) : 0,
      };
    },

    isLeader: (state) => {
      const userStore = storeUser();
      const token = userStore.token;
      let role = userStore.getRole();
      let currentUserEmail = (userStore.email || '').trim().toLowerCase();

      if (token) {
        const decoded = decodeTokenSafely(token);
        if (decoded) {
          role = decoded.rol || role;
          if (decoded.email) {
            currentUserEmail = decoded.email.trim().toLowerCase();
          }
        }
      }

      const roleUpper = (role || '').toUpperCase();
      // Programadores, coordinadores y admins siempre son líderes
      if (['PROGRAMADOR', 'COORDINADOR', 'ADMIN'].includes(roleUpper)) return true;

      // Un instructor es líder si su correo coincide con el leaderEmail de la planeación actual
      const leaderEmail = (state.planning?.pedagogicalPlanning?.leaderEmail || '').trim().toLowerCase();
      return !!(leaderEmail && currentUserEmail && leaderEmail === currentUserEmail);
    },

    metadata: (state) => state.planning?.pedagogicalPlanning?.metadata || {},
  },

  actions: {
    async loadPlanning(fiche) {
      this.loading = true;
      try {
        console.log(`[STORE] Cargando ficha: ${fiche}`);
        const response = await PlanningService.getPlanningByFiche(fiche);
        if (!response) throw new Error('PLANNING_NOT_FOUND');
        
        // Asignar directamente el documento
        this.planning = response;
        
        console.log('[STORE] Datos recibidos:', this.planning);

        if (this.planning.pedagogicalPlanning?.content?.some(p => p.phase === 'INDUCCION')) {
          this.selectedPhase = 'INDUCCION';
        } else {
          this.selectedPhase = 'ANALYSIS';
        }
      } catch (error) {
        console.error('Error cargando planeación:', error.message);
        this.planning = null;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    addActivityToRAP(competenceCode, rapDescription, newActivity) {
      if (!this.planning) return;
      
      const content = this.planning.pedagogicalPlanning.content;
      for (const phase of content) {
        const comp = phase.competencies.find(c => c.code === competenceCode);
        if (comp) {
          const rap = comp.learningOutcomes.find(r => r.description === rapDescription);
          if (rap) {
            if (!rap.pedagogicalActivities) {
              rap.pedagogicalActivities = [];
            }
            rap.pedagogicalActivities.push(newActivity);
            return;
          }
        }
      }
    },

    setPhase(phaseId) {
      this.selectedPhase = phaseId;
    },

    async saveDraft() {
      if (!this.planning) return;
      try {
        await PlanningService.saveDraft({ pedagogicalPlanning: this.planning.pedagogicalPlanning });
      } catch (error) { console.error('Error al guardar:', error.message); }
    },

    async savePlanningTemplate(savedBy) {
      if (!this.planning) throw new Error('No hay una planeación activa');
      const p = this.planning.pedagogicalPlanning;
      return await PlanningService.savePlanningTemplate({ 
        programCode: p.metadata.programCode, 
        programName: p.metadata.programName, 
        content: p.content, 
        savedBy 
      });
    },

    async fetchPlanningTemplate(programCode) {
      try { return await PlanningService.getPlanningTemplate(programCode); }
      catch (error) { return null; }
    },

    async applyPlanningTemplate(template) {
      if (!this.planning || !template) return 0;
      // ... logic here if needed ...
      await this.saveDraft();
      return 1;
    },

    clearPlan() {
      this.planning = null;
      this.selectedPhase = 'INDUCCION';
      this.searchQuery = '';
    },
  },
});
