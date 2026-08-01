import { utils, writeFileXLSX } from "xlsx";
import {
  notifyErrorRequest,
  notifySuccessRequest,
  notifyWarningRequest,
} from "../common/notify.js";

export async function exportHoursToExcel(data, month, nameFile, form) {
  try {
    let newsToExcel = [];
    const wb = utils.book_new();

    //recorrer los instructores y sus meses
    data.forEach((ins) => {
      let insToExcel = {
        "NOMBRE INSTRUCTOR": ins.name,
        DOCUMENTO: ins.document,
      };

      //recorrer los meses
      month.forEach((m) => {
        //buscar el mes en el instructor
        let monthIns = ins.months.find((mi) => mi.concat === m.concat);
        if (monthIns) {
          insToExcel[m.concat] = monthIns.hours;
        } else {
          insToExcel[m.concat] = 0;
        }
      });

      newsToExcel.push(insToExcel);
    });

    // Crear una nueva hoja de trabajo
    const ws1 = utils.json_to_sheet(
      newsToExcel,
      //insertar desde la segunda fila
      {
        origin: "A4",
        header: [
          "NOMBRE INSTRUCTOR",
          "DOCUMENTO",
          ...month.map((m) => m.concat),
        ],
      }
    );

    //combinar las celdas A1 B1 C1 ... X1
    ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];

    // Insertar el nombre en la celda A1
    ws1["A1"] = {
      v: `Reporte de horas trabajadas ${form.fstart} - ${form.fend}`,
      t: "s",
    }; // 'v' es el valor, 't' es el tipo (en este caso, cadena)

    ws1["!cols"] = [
      { wch: 40 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
      { wch: 34 },
    ];

    utils.book_append_sheet(wb, ws1, "REPORTE");

    await writeFileXLSX(wb, `${nameFile}.xlsx`);
    notifySuccessRequest("Excel generado correctamente");
  } catch (error) {
    console.log(error);
    notifyErrorRequest("Error al generar el excel");
  }
}
