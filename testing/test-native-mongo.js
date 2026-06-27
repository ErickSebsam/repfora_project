import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function main() {

    const client =
        new MongoClient(
            process.env.MONGO_URL
        );

    try {

        await client.connect();

        console.log(
            '\n✅ CONECTADO\n'
        );

        const db =
            client.db();

        const collections =
            await db
                .listCollections()
                .toArray();

        console.log(collections);

    } catch (error) {

        console.error(error);

    } finally {

        await client.close();
    }
}

main();