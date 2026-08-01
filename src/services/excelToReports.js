import { utils, writeFileXLSX } from "xlsx";

import { notifyErrorRequest, notifySuccessRequest } from "../common/notify.js";

const calculateMonth = (month) => {
  switch (month) {
    case 1:
      return "ENERO";
    case 2:
      return "FEBRERO";
    case 3:
      return "MARZO";
    case 4:
      return "ABRIL";
    case 5:
      return "MAYO";
    case 6:
      return "JUNIO";
    case 7:
      return "JULIO";
    case 8:
      return "AGOSTO";
    case 9:
      return "SEPTIEMBRE";
    case 10:
      return "OCTUBRE";
    case 11:
      return "NOVIEMBRE";
    case 12:
      return "DICIEMBRE";
  }
};

export function generateInfoFormated(events) {
  if (!events) return [];

  let dataFormated = [];

  events.forEach((event) => {
    let fiche = event.fiche;

    let index = dataFormated.findIndex(
      (f) =>
        f.fiche == fiche &&
        f.backgroundColor == event.backgroundColor &&
        f.outcome == event.outcome
    );
    if (index == -1) {
      dataFormated.push({
        fiche: fiche,
        instructor: event.instructor
          ? event.instructor
          : event.title
          ? event.title
          : "NO ENCONTRADO",

        environment: event.environment,
        program: event.program,
        outcome: event.outcome,
        competence: event.competence,
        supporttext: event.supporttext,
        observation: event.observation,
        tstart: event.tstart,
        tend: event.tend,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        textColor: event.textColor,
        type: event.type,
        dates: {
          [new Date(event.start).getUTCMonth() + 1]: {
            nameMonth: calculateMonth(new Date(event.start).getUTCMonth() + 1),
            dates: [event.start.split("-")[2]],
            tstart: event.tstart,
            tend: event.tend,
            year: event.start.split("-")[0],
          },
        },
      });
    } else {
      let month = new Date(event.start).getUTCMonth() + 1;
      let indexMonth = dataFormated[index].dates[month];

      if (indexMonth) {
        dataFormated[index].dates[month].dates.push(event.start.split("-")[2]);
      } else {
        dataFormated[index].dates[month] = {
          nameMonth: calculateMonth(month),
          dates: [event.start.split("-")[2]],
          tstart: event.tstart,
          tend: event.tend,
          year: event.start.split("-")[0],
        };
      }
    }
  });

  //ordenar los días de menor a mayor
  dataFormated.forEach((fiche) => {
    let dates = fiche.dates;
    let datesKeys = Object.keys(dates);

    datesKeys.forEach((key) => {
      dates[key].dates.sort((a, b) => a - b);
    });
  });

  return dataFormated;
}

export function generateInfoOtherActivities(events) {
  if (!events) return [];

  let dataOtherActivities = [];

  events.forEach((event) => {
    let index = dataOtherActivities.findIndex(
      (f) => f.backgroundColor == event.backgroundColor
    );
    if (index == -1) {
      dataOtherActivities.push({
        title: event.title,
        instructor: event.instructor,
        typeactivity: event.typeactivity,
        additionalactivity: event.additionalactivity,
        justification: event.justification,
        tstart: event.tstart,
        tend: event.tend,
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        textColor: event.textColor,
        type: event.type,
        dates: {
          [new Date(event.start).getUTCMonth() + 1]: {
            nameMonth: calculateMonth(new Date(event.start).getUTCMonth() + 1),
            dates: [event.start.split("-")[2]],
            tstart: event.tstart,
            tend: event.tend,
            year: event.start.split("-")[0],
          },
        },
      });
    } else {
      let month = new Date(event.start).getUTCMonth() + 1;
      let indexMonth = dataOtherActivities[index].dates[month];

      if (indexMonth) {
        dataOtherActivities[index].dates[month].dates.push(
          event.start.split("-")[2]
        );
      } else {
        dataOtherActivities[index].dates[month] = {
          nameMonth: calculateMonth(month),
          dates: [event.start.split("-")[2]],
          tstart: event.tstart,
          tend: event.tend,
          year: event.start.split("-")[0],
        };
      }
    }
  });

  //ordenar los días de menor a mayor
  dataOtherActivities.forEach((fiche) => {
    let dates = fiche.dates;
    let datesKeys = Object.keys(dates);

    datesKeys.forEach((key) => {
      dates[key].dates.sort((a, b) => a - b);
    });
  });

  return dataOtherActivities;
}

export const excelToReports = async (data) => {
  try {
    let dataFormated = [];
    let dataOtherActivities = [];

    if (data) {
      data = Object.values(data);
      data.forEach((events) => {
        events.forEach((event) => {
          if (event.type == 0) {
            dataFormated.push(event);
          } else {
            dataOtherActivities.push(event);
          }
        });
      });

      dataFormated = dataFormated.flat();
      dataOtherActivities = dataOtherActivities.flat();
    }

    const data1 = generateInfoFormated(dataFormated);
    const data2 = generateInfoOtherActivities(dataOtherActivities);

    const wb = utils.book_new();

        if (data1.length > 0) {
      let dataExcel = [];
      data1.forEach((item) => {
        let dates = [];
        for (const key in item.dates) {
          dates.push(
            `${item.dates[key].nameMonth}: ${item.dates[key].dates.join(
              ", "
            )} del ${item.dates[key].year}`
          ); // 02, 03, 09, 10, 17, 23, 24, 30, 31 de OCTUBRE de 2023
        }

        dataExcel.push({
          FICHA: item.fiche,
          INSTRUCTOR: item.instructor,
          AMBIENTE: item.environment,
          PROGRAMA: item.program,
          COMPETENCIA: item.competence,
          RESULTADO: item.outcome,
          NOTA: item.supporttext,
          OBSERVACION: item.observation,
          HORARIO: item.tstart + " - " + item.tend,
          FECHAS: dates.join(" - "),
        });
      });
      const ws1 = utils.json_to_sheet(dataExcel);

      ws1["!cols"] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 30 },
        { wch: 50 },
        { wch: 50 },
        { wch: 50 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 50 },
      ];

      utils.book_append_sheet(wb, ws1, "ACTIVIADES DE FORMACIÓN");
    }

    if (data2.length > 0) {
      let dataExcel2 = [];
      data2.forEach((item) => {
        let dates = [];
        for (const key in item.dates) {
          dates.push(
            `${item.dates[key].nameMonth}: ${item.dates[key].dates.join(
              ", "
            )} del ${item.dates[key].year}`
          );
        }

        dataExcel2.push({
          ACTIVIDAD: item.title,
          INSTRUCTOR: item.instructor,
          TIPOA_CTIVIDAD: item.typeactivity,
          ACTIVIDAD_ADICIONAL: item.additionalactivity,
          JUSTIFICACIÓN: item.justification,
          HORARIO: item.tstart + " - " + item.tend,
          FECHAS: dates.join(" - "),
        });
      });

      const ws2 = utils.json_to_sheet(dataExcel2);

      ws2["!cols"] = [
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
        { wch: 30 },
      ];

      utils.book_append_sheet(wb, ws2, "OTRAS ACTIVIDADES");
    }

    await writeFileXLSX(wb, "Reporte.xlsx");
    notifySuccessRequest("Excel generado correctamente");
  } catch (error) {
    console.log(error);
    notifyErrorRequest("Error al generar el excel");
  }
};
