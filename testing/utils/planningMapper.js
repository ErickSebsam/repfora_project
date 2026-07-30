export function parseSenaPlan(data) {
  if (!data || !data.pedagogicalPlanning) return null;

  const planning = data.pedagogicalPlanning;
  const meta = planning.metadata || {};

  return {
    id: data._id,
    fiche: planning.fiche,
    status: planning.status,
    program: {
      name: meta.programName,
      code: meta.programCode,
      totalHours: meta.totalHours,
      lectivaHours: meta.lectivaHours,
      productivaHours: meta.productivaHours,
      startDate: meta.lectivaStartDate?.$date || meta.lectivaStartDate,
      endDate: meta.lectivaEndDate?.$date || meta.lectivaEndDate,
    },
    phases: (planning.content || []).map((phaseItem) => ({
      phase: phaseItem.phase,
      projectActivity: phaseItem.projectActivity,
      competencies: (phaseItem.competencies || []).map((comp) => ({
        name: comp.name,
        code: comp.code,
        totalHours: comp.totalCompetenceHours,
        requirements: comp.academicRequirements?.trim(),
        outcomesCount: comp.learningOutcomes?.length || 0,
        outcomes: (comp.learningOutcomes || []).map((rap) => ({
          description: rap.description,
          instructors: (rap.pedagogicalActivities || [])
            .map((act) => act.suggestedInstructor?.name)
            .filter((name) => name && name !== ""),
          environments: (rap.pedagogicalActivities || [])
            .map((act) => act.environment?.type)
            .filter(Boolean)
        }))
      }))
    }))
  };
}   