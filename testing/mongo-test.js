async function obtenerSolicitudMock() {

    return {
        ficha: '2999999',
        ambiente: 'LAB 3',
        fechaInicio: '2026-06-25',
        fechaFin: '2026-06-25',
        horaInicio: '18:00',
        horaFin: '22:00'
    };
}

async function main() {

    console.log(
        '\n🍃 Simulando datos MongoDB...\n'
    );

    const solicitud =
        await obtenerSolicitudMock();

    console.log(
        '📦 Datos obtenidos:\n'
    );

    console.log(solicitud);

    console.log(
        '\n✅ Datos listos para SOFIA\n'
    );
}

main();