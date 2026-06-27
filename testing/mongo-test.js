import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function obtenerProgramacion() {

    const db =
        mongoose.connection.db;

    // =====================================
    // INFO DB
    // =====================================

    console.log(
        '\n🗂️ DATABASE:\n'
    );

    console.log(
        db.databaseName
    );

    // =====================================
    // COLLECTIONS
    // =====================================

    const collections =
        await db
            .listCollections()
            .toArray();

    console.log(
        '\n📚 COLLECTIONS:\n'
    );

    collections.forEach(col => {
        console.log(`- ${col.name}`);
    });

    // =====================================
    // COLLECTIONS USADAS
    // =====================================

    const schedules =
        db.collection('schedules');

    const fiches =
        db.collection('fiches');

    const environments =
        db.collection('environments');

    // =====================================
    // PRIMER SCHEDULE
    // =====================================

    const schedule =
        await schedules.findOne();

    console.log(
        '\n📦 PRIMER SCHEDULE:\n'
    );

    console.log(schedule);

    if (!schedule) {

        throw new Error(
            'No se encontró programación'
        );
    }

    // =====================================
    // FICHA
    // =====================================

    const fiche =
        await fiches.findOne({
            _id: schedule.fiche
        });

    console.log(
        '\n🎓 FICHA:\n'
    );

    console.log(fiche);

    // =====================================
    // AMBIENTE
    // =====================================

    const environment =
        await environments.findOne({
            _id: schedule.environment
        });

    console.log(
        '\n🏫 AMBIENTE:\n'
    );

    console.log(environment);

    // =====================================
    // OBJETO FINAL
    // =====================================

    const datos = {

        ficha:
            fiche?.code || '',

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
            schedule.days
    };

    console.log(
        '\n🚀 DATOS FINALES:\n'
    );

    console.log(datos);

    return datos;
}

// =====================================
// INIT
// =====================================

async function main() {

    try {

        console.log(
            process.env.MONGO_URL
        );

        console.log(
            '\n🍃 Conectando Mongo...\n'
        );

        await mongoose.connect(
            process.env.MONGO_URL,
        );

        console.log(
            '✅ Mongo conectado\n'
        );
        await obtenerProgramacion();

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