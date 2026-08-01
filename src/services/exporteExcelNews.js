
import { utils, writeFileXLSX } from "xlsx";
import {
  notifyErrorRequest,
  notifySuccessRequest,
  notifyWarningRequest,
} from "../common/notify.js";

export async function exportNewToExcel(rows, name, isImprovement = false) {
  try {
    let date = new Date();
    let nameFile = `${name}_${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;
    let newsToExcel = [];
    const wb = utils.book_new();

    if (!isImprovement) {
      rows.forEach((row) => {
        let newObject = {
          "Código": row.code,
          Acta: row.acta,
          "Tipo de novedad": row.tpnew,
          "Tipo de traslado": row.typetransfer,
          "Subtipo de novedad": row.subtype,
          Jornada: row.workingday,
          Centro: row.center,
          Ciudad: row.city,
          Duración: row.duration,
          "Fecha de fin": row.fend?.split("T")[0],
          "Tipo de documento": row.tpdocument,
          Documento: row.document,
          Nombre: row.name,
          Correo: row.email,
          Teléfono: row.phone,
          Causa: row.cause,
          "Fecha registro sofia plus": row.datesofia?.split("T")[0],
          Ficha: row.fiche.number + " - " + row.fiche.program.name,
          Proceso: row.answers
            ?.map((answer) => {
              return `${answer.data}. (${answer.date.split("T")[0]}) \n\n`;
            })
            .join(""),
          Procesada: row.processed ? "Si" : "No",
          "Fecha de procesamiento": row.dateprocessed?.split("T")[0],
          Estado: row.state,
          "Fecha de registro": row.createdAt.split("T")[0],
          Imagen: row.img?.url,
        };

        newsToExcel.push(newObject);
      });
    } else {
      rows.forEach((row) => {
        let newObject = {
          "Código": row.code,
          "Tipo de novedad": row.tpnew,
          "Tipo de documento": row.tpdocument,
          Documento: row.document,
          Nombre: row.name,
          Correo: row.email,
          Teléfono: row.phone,
          Ficha: row.fiche.number + " - " + row.fiche.program.name,
          Competencia: `${row.competence.number} - ${row.competence.name}`,
          Resultado: `${row.outcome.code} - ${row.outcome.outcomes}`,
          Estado: row.state,
          Actividad: row.activity,
          "Fecha de entrega": row.fend?.split("T")[0],
          "Fecha de registro": row.createdAt.split("T")[0],
        };

        newsToExcel.push(newObject);
      });
    }

    // Crear una nueva hoja de trabajo
    const ws1 = utils.json_to_sheet(newsToExcel,
      //insertar desde la segunda fila
      { origin: "A3" }

      );
    
    //combinar las celdas A1 B1 C1 ... X1
    ws1["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 23 } },
    ];


    // Insertar el nombre en la celda A1
    ws1['A1'] = { v: name, t: 's' };  // 'v' es el valor, 't' es el tipo (en este caso, cadena)

  

    if (!isImprovement) {
      ws1["!cols"] = [
        { wch: 10 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 30 },
        { wch: 40 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
      ];
    } else {
      ws1["!cols"] = [
        { wch: 10 },
        { wch: 20 },
        { wch: 10 },
        { wch: 20 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
        { wch: 40 },
        { wch: 40 },
        { wch: 40 },
        { wch: 20 },
        { wch: 40 },
        { wch: 20 },
        { wch: 20 },
      ];
    }

    utils.book_append_sheet(wb, ws1, "Novedades");

    await writeFileXLSX(wb, `${nameFile}.xlsx`);
    notifySuccessRequest("Excel generado correctamente");
  } catch (error) {
    console.log(error);
    notifyErrorRequest("Error al generar el excel");
  }
}
