import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function obtenerProgramacion() {

    const db =
        mongoose.connection.db;

    // =====================================
    // DIAGNÓSTICO
    // =====================================

    console.log(
        '🗂️ Base de datos conectada:', db.databaseName
    );

    const nombresColecciones =
        (await db.listCollections().toArray()).map(c => c.name);

    console.log(
        '📚 Colecciones encontradas:', nombresColecciones
    );

    // =====================================
    // COLLECTIONS USADAS
    // =====================================

    const schedules =
        db.collection('schedules');

    const fiches =
        db.collection('fiches');

    const environments =
        db.collection('environments');

    const instructors =
        db.collection('instructors');

    console.log(
        '🔢 Documentos en schedules:', await schedules.countDocuments()
    );

    // =====================================
    // PRIMER SCHEDULE
    // =====================================
    // (luego esto se cambia por el filtro de RF06:
    // { $or: [ { estado: { $exists: false } }, { estado: false } ] })

    const schedule =
        await schedules.findOne();

    if (!schedule) {
        throw new Error(
            `No se encontró programación en la base "${db.databaseName}". ` +
            'Revisa que el MONGO_URL apunte a "Horarios_SENA" y no a "test".'
        );
    }

    // =====================================
    // FICHA
    // =====================================

    const fiche =
        await fiches.findOne({
            _id: schedule.fiche
        });

    // =====================================
    // AMBIENTE
    // =====================================

    const environment =
        await environments.findOne({
            _id: schedule.environment
        });

    // =====================================
    // INSTRUCTOR
    // =====================================

    const instructor =
        await instructors.findOne({
            _id: schedule.instructor
        });

    // =====================================
    // APRENDICES
    // =====================================
    // Pendiente: no existe colección "learners" en la base de datos
    // actual (Horarios_SENA). Los aprendices se deben obtener desde
    // Sofia Plus (búsqueda por número de ficha) o crear una colección
    // que los almacene, antes de poder completar este campo.

    // =====================================
    // OBJETO FINAL (JSON)
    // =====================================

    const datosEvento = {

        ficha:
            fiche?.number || '',

        ambiente:
            environment?.name || '',

        fechaInicio:
            schedule.fstart,

        fechaFin:
            schedule.fend,

        horaInicio:
            schedule.tstart,

        horaFin:
            schedule.tend,

        dias:
            schedule.days,

        instructor: instructor ? {
            nombre: instructor.name,
            documento: instructor.numdocument,
            email: instructor.email
        } : null,

        aprendices: [] // TODO: pendiente por definir fuente (ver nota arriba)
    };

    return datosEvento;
}

// =====================================
// INIT
// =====================================

async function main() {

    try {

        console.log(
            '\n🍃 Conectando Mongo...\n'
        );

        await mongoose.connect(
            process.env.MONGO_URL,
            { dbName: 'Horarios_SENA' }
        );

        console.log(
            '✅ Mongo conectado\n'
        );

        const datosEvento =
            await obtenerProgramacion();

        console.log(
            '\n🚀 DATOS DEL EVENTO (JSON):\n'
        );

        console.log(
            JSON.stringify(datosEvento, null, 2)
        );

    } catch (error) {

        console.log(
            '\n💀 ERROR GENERAL\n'
        );

        console.error(error);

    } finally {

        await mongoose.disconnect();

        console.log(
            '\n🔌 Mongo desconectado\n'
        );
    }
}

main();