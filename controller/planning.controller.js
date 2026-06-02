import Planning from '../models/Planning.js';
import Fiche from '../models/Fiche.js';
import Program from '../models/Program.js';
import Competence from '../models/Competence.js';
import Outcome from '../models/Outcome.js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadPlanning = async (req, res) => {
  try {
    const { fiche, pedagogicalPlanning } = req.body;
    let planning = await Planning.findOneAndUpdate(
      { 'pedagogicalPlanning.fiche': fiche },
      { $set: { pedagogicalPlanning } },
      { upsert: true, new: true }
    );
    res.json({ message: 'Planeación guardada con éxito', data: planning });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar planeación', error: error.message });
  }
};

export const getPlanningByFiche = async (req, res) => {
  try {
    const { fiche } = req.params;
    const planning = await Planning.findOne({ 'pedagogicalPlanning.fiche': fiche });
    if (!planning) return res.status(404).json({ message: 'No se encontró la planeación' });
    res.json(planning);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos', error: error.message });
  }
};

export const extractFromPDFs = async (req, res) => {
  try {
    const { fiche, leaderEmail } = req.body;
    if (!req.files || !req.files.programPdf || !req.files.projectPdf) {
      return res.status(400).json({ message: 'Faltan archivos esenciales (Programa y Proyecto)' });
    }

    const programPath = path.resolve(req.files.programPdf.tempFilePath);
    const projectPath = path.resolve(req.files.projectPdf.tempFilePath);
    const teamPath = req.files.teamPdf ? path.resolve(req.files.teamPdf.tempFilePath) : null;
    
    const scriptsDir = path.resolve(__dirname, '../scripts');
    const extractorPath = path.join(scriptsDir, 'extractor.py');

    console.log(`[EXTRACT] Iniciando para ficha ${fiche}. Equipo Ejecutor: ${teamPath ? 'SÍ' : 'NO'}`);

    // Construir comando dinámico
    const pyCmd = process.platform === 'win32' ? 'py' : 'python3';
    let command = teamPath
      ? `${pyCmd} "${extractorPath}" "${programPath}" "${projectPath}" "${teamPath}" "${fiche}"`
      : `${pyCmd} "${extractorPath}" "${programPath}" "${projectPath}" "${fiche}"`;

    exec(command, { timeout: 120000 }, async (error, stdout, stderr) => {
      const cleanup = () => {
        try {
          if (fs.existsSync(programPath)) fs.unlinkSync(programPath);
          if (fs.existsSync(projectPath)) fs.unlinkSync(projectPath);
          if (teamPath && fs.existsSync(teamPath)) fs.unlinkSync(teamPath);
          console.log('[CLEANUP] Archivos temporales eliminados');
        } catch (e) { console.error('Error cleanup:', e.message); }
      };

      if (error) {
        cleanup();
        console.error('[ERROR] Extractor:', stderr || error.message);
        return res.status(500).json({ message: 'Error en la extracción', error: stderr || error.message });
      }

      // CAPTURAR JSON DESDE STDOUT (Sincrónico y Seguro)
      let planningData = null;
      const jsonMatch = stdout.match(/---JSON_START---([\s\S]*?)---JSON_END---/);
      if (jsonMatch) {
        try {
          planningData = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          console.error('[ERROR] Falló el parseo del JSON extraído:', e.message);
        }
      }

      if (!planningData) {
        cleanup();
        return res.status(500).json({ message: 'No se extrajeron datos válidos del PDF', stdout });
      }

      // GUARDAR O ACTUALIZAR EN BASE DE DATOS
      const finalFiche = planningData.pedagogicalPlanning.fiche || fiche;
      try {
        if (leaderEmail) {
          planningData.pedagogicalPlanning.leaderEmail = leaderEmail.trim().toLowerCase();
        }

        // Asegurar nombres de competencias para evitar errores en UI
        if (planningData.pedagogicalPlanning.content) {
          planningData.pedagogicalPlanning.content.forEach(phase => {
            if (phase.competencies) {
              phase.competencies.forEach(comp => {
                if (!comp.name) comp.name = `COMPETENCIA ${comp.code || 'SIN CODIGO'}`;
              });
            }
          });
        }

        let planning = await Planning.findOneAndUpdate(
          { 'pedagogicalPlanning.fiche': finalFiche },
          { $set: planningData },
          { upsert: true, new: true }
        );

        cleanup();
        console.log(`[EXTRACT] Éxito para ficha ${finalFiche}`);
        return res.json({ message: 'Éxito', data: planning, finalFiche });
      } catch (dbError) {
        cleanup();
        console.error('[ERROR] Error al guardar en BD:', dbError.message);
        return res.status(500).json({ message: 'Error al guardar datos extraídos', error: dbError.message });
      }
    });
  } catch (err) {
    console.error('[ERROR GLOBAL]:', err.message);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};

export const getAllPlannings = async (req, res) => {
  try {
    const plannings = await Planning.find({}, { 'pedagogicalPlanning.metadata': 1, 'pedagogicalPlanning.fiche': 1 });
    res.json(plannings);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener planeaciones', error: error.message });
  }
};

export const scheduleOutcomeInCalendar = async (req, res) => {
  try {
    const { fiche, phaseId, competenceCode, outcomeDesc, scheduleData } = req.body;
    const planning = await Planning.findOne({ 'pedagogicalPlanning.fiche': fiche });
    if (!planning) return res.status(404).json({ message: 'Planeación no encontrada' });
    const phase = planning.pedagogicalPlanning.content.find(p => p.phase === phaseId);
    const comp = phase?.competencies.find(c => c.code === competenceCode);
    const outcome = comp?.learningOutcomes.find(o => o.description === outcomeDesc);
    if (outcome) {
      outcome.pedagogicalActivities[0].scheduleDetails = scheduleData;
      await planning.save();
      res.json({ message: 'Calendario actualizado', data: planning });
    } else {
      res.status(404).json({ message: 'Resultado no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al programar', error: error.message });
  }
};

export const savePlanningTemplate = async (req, res) => {
  try {
    const { programCode, template } = req.body;
    res.json({ message: 'Planilla guardada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar planilla' });
  }
};

export const getPlanningTemplate = async (req, res) => {
  try {
    const { programCode } = req.params;
    res.json(null);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener planilla' });
  }
};