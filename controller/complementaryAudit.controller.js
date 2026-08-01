import { complementaryAuditHelper } from "../helpers/complementaryAudit.helper.js";
import ComplementaryRequest from "../models/ComplementaryRequest.js";
import Schedule from "../models/Schedule.js";
import fs from "fs";

export const complementaryAuditController = {
  processDF14: async (req, res) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
        return res.status(400).json({ msg: "No se ha subido ningún archivo." });
      }

      const file = req.files.file;
      
      // Parse the file using the helper
      let auditData;
      try {
        auditData = await complementaryAuditHelper.parseDF14(file.tempFilePath);
      } catch (error) {
        return res.status(400).json({ msg: error.message || "Error procesando el archivo Excel." });
      }

      if (!auditData || auditData.length === 0) {
        return res.status(404).json({ msg: "No se encontraron fichas de 'Curso especial' válidas en el archivo." });
      }

      const results = {
        totalProcesadas: auditData.length,
        fichasEvaluadas: 0,
        fichasNoEncontradas: 0,
        faltanRutas: [],
        faltanJuicios: [],
        detalles: []
      };

      for (const item of auditData) {
        // Find corresponding ComplementaryRequest
        const request = await ComplementaryRequest.findOne({ fichaNumber: item.fichaNumber }).populate("instructor", "name email emailpersonal");
        
        if (!request) {
          results.fichasNoEncontradas++;
          results.detalles.push(`Ficha ${item.fichaNumber} no encontrada en el sistema.`);
          continue;
        }

        const fichaData = {
          fichaNumber: item.fichaNumber,
          instructorName: request.instructorName || (request.instructor ? request.instructor.name : "Instructor"),
          courseName: request.catalogCourseName,
          email: request.instructor ? request.instructor.email : null,
        };

        let handled = false;

        // Proceso A: Rutas
        if (item.enTransito > 0) {
          results.faltanRutas.push({
            ...fichaData,
            pendientes: item.enTransito
          });
          results.detalles.push(`Ficha ${item.fichaNumber}: Reportada por Rutas (${item.enTransito} en tránsito).`);
          handled = true;
        }

        // Proceso B: Juicios (Only if in execution or finished)
        if (item.estado === "en ejecución" || item.estado === "terminada") {
          if (item.enFormacion > 0) {
            // Report missing judgments
            results.faltanJuicios.push({
              ...fichaData,
              pendientes: item.enFormacion
            });
            results.detalles.push(`Ficha ${item.fichaNumber}: Reportada por Juicios (${item.enFormacion} pendientes).`);
            handled = true;
          } else if (item.enFormacion === 0) {
            // Everything evaluated. Mark schedules as rated
            const updateResult = await Schedule.updateMany(
              { complementaryRequest: request._id, status: 0, rated: { $ne: true } },
              {
                $set: {
                  rated: true,
                  dateRating: new Date(),
                  statusRating: "Calificado",
                  ratedByProcess: "audit_df14_bulk"
                }
              }
            );
            
            if (updateResult.modifiedCount > 0) {
              results.fichasEvaluadas++;
              results.detalles.push(`Ficha ${item.fichaNumber}: ${updateResult.modifiedCount} horarios marcados como Evaluados.`);
              handled = true;
            }
          }
        }

        if (!handled) {
          results.detalles.push(`Ficha ${item.fichaNumber}: Al día, sin acciones requeridas.`);
        }
      }

      // Cleanup temp file
      if (fs.existsSync(file.tempFilePath)) {
        fs.unlinkSync(file.tempFilePath);
      }

      return res.json({
        msg: "Auditoría masiva completada exitosamente.",
        results
      });

    } catch (error) {
      console.error("[AUDIT-DF14] Error general:", error);
      return res.status(500).json({ msg: "Error interno procesando auditoría DF14" });
    }
  }
};
