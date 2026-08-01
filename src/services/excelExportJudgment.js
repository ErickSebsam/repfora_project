import { utils, writeFileXLSX } from "xlsx";
import {
  notifyErrorRequest,
  notifySuccessRequest,
  notifyWarningRequest,
} from "../common/notify.js";

export async function outcomePending(row) {
  try {
    //craer un arreglo de objetos con los datos de los resultados que tenga estudiantes por evaluar
    let outcomesPending = [];
    row.forEach((item) => {
      if (item.studentsEvaluate.formacion > 0) {
        const students = item.studentsEvaluate.students
          .map((student) => {
            if (student.status == "EN FORMACION") {
              return `${student.name} ${student.lastname}`;
            }
          })
          .filter((student) => student != undefined);

        outcomesPending.push({
          COMPETENCIA: item.competence.split("-")[1],
          RESULTADO: item.outcome.split("-")[1],
          INSTRUCTOR: item.instructorEval
            ? item.instructorEval.split("-")[1].toUpperCase()
            : "",
          FECHA_INICIO: item.fstart ? item.fstart : "",
          FECHA_FIN: item.fend ? item.fend : "",
          //si deben más de la mitad de los estudiantes se muestra "evaluar toda la ficha"
          APRENDICES_PENDIENTES:
            students.length >
            parseInt(
              item.studentsEvaluate.formacion + item.studentsAproved.formacion
            ) /
              2
              ? "Evaluar toda la ficha"
              : students.join("\n"),
        });
      }
    });

    const wb = utils.book_new();
    const ws1 = utils.json_to_sheet(outcomesPending);
    ws1["!cols"] = [
      { wch: 30 },
      { wch: 40 },
      { wch: 40 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
    ];
    utils.book_append_sheet(wb, ws1, "RESULTADOS PENDIENTES");
    await writeFileXLSX(wb, "RESULTADOS PENDIENTES.xlsx");
    notifySuccessRequest("Excel generado correctamente");
  } catch (error) {
    console.log(error);
    notifyErrorRequest("Error al generar el excel");
  }
}
