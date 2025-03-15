import { MongoClient } from 'mongodb';
export { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export class MongoDBService {
    private client: MongoClient;
    private connectionString: string;

    constructor() {
        const username = process.env.MONGO_USERNAME;
        const password = process.env.MONGO_PASSWORD;
        const host = process.env.MONGO_HOST;
        const options = process.env.MONGO_OPTIONS;
        const authSource = process.env.MONGO_AUTH_SOURCE;
        const authMechanism = process.env.MONGO_AUTH_MECHANISM;

        if (!username || !password || !host || !options || !authSource || !authMechanism) {
            throw new Error("MongoDB connection environment variables are not properly set");
        }

        const encodedUsername = encodeURIComponent(username);
        const encodedPassword = encodeURIComponent(password);

        this.connectionString = `mongodb+srv://${encodedUsername}:${encodedPassword}@${host}/${options}&authSource=${authSource}&authMechanism=${authMechanism}`;
        this.client = new MongoClient(this.connectionString);
    }

    public async connect(): Promise<boolean> {
        try {
            console.log("Connecting to MongoDB");
            await this.client.connect();
            return true;
        } catch (err) {
            console.error("Error connecting to MongoDB:", err);
            return false;
        }
    }

    public async insertOne(database: string, collection: string, document: any): Promise<any> {
        try {
            const result = await this.client.db(database).collection(collection).insertOne(document);
            return { _id: result.insertedId };
        } catch (err) {
            console.error("Error inserting document into " + collection + ":", err);
            return false;
        }
    }

    public async findOne<T>(database: string, collection: string, query: any): Promise<T | null> {
        try {
            const result = await this.client.db(database).collection(collection).findOne(query);
            return result as T;
        } catch (err) {
            console.error("Error finding document in " + collection + ":", err);
            return null;
        }
    }

    public async find<T>(database: string, collection: string, query: any, start: number = 0, end: number = 0): Promise<T[]> {
        try {
            let result = [];
            if (start >= 0 && end > start) {
                result = await this.client.db(database).collection(collection).find(query).skip(start).limit(end - start + 1).toArray();
            } else {
                result = await this.client.db(database).collection(collection).find(query).toArray();
            }
            return result as T[];
        } catch (err) {
            console.error("Error finding documents in " + collection + ":", err)
            return [];
        }
    }

    public async updateOne(database: string, collection: string, query: any, update: any): Promise<boolean> {
        try {
            await this.client.db(database).collection(collection).updateOne(query, update);
            return true;
        } catch (err) {
            console.error("Error updating document in " + collection + ":", err);
            return false;
        }
    }

    public async deleteOne(database: string, collection: string, query: any): Promise<boolean> {
        try {
            await this.client.db(database).collection(collection).deleteOne(query);
            return true;
        } catch (err) {
            console.error("Error deleting document in " + collection + ":", err);
            return false;
        }
    }

    public async close(): Promise<void> {
        await this.client.close();
        console.log("Closed connection to MongoDB");
    }

    public async findOneAndUpdate<T>(database: string, collection: string, query: any, update: any): Promise<T | null> {
        try {
            const result = await this.client.db(database).collection(collection).findOneAndUpdate(query, update, {});
            if (!result) {
                console.error("Error finding and updating document in " + collection + ": document not found");
                return null;
            }
            return result.value as T;
        } catch (err) {
            console.error("Error finding and updating document in " + collection + ":", err);
            return null;
        }
    }

    public async updateMany(database: string, collection: string, query: any, update: any): Promise<{ matchedCount: number, modifiedCount: number }> {
        try {
            const result = await this.client.db(database).collection(collection).updateMany(query, update);
            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (err) {
            console.error("Error updating multiple documents in " + collection + ":", err);
            return {
                matchedCount: 0,
                modifiedCount: 0
            };
        }
    }

    public async count(database: string, collection: string, query: any): Promise<number> {
        try {
            const result = await this.client.db(database).collection(collection).countDocuments(query);
            return result;
        } catch (err) {
            console.error("Error counting documents in " + collection + ":", err)
            return 0;
        }
    }

    public async search<T>(database: string, collection: string, query: any, start: number = 0, end: number = 0): Promise<T[]> {
        try {
            let result = [];
            if (start >= 0 && end > start) {
                result = await this.client.db(database).collection(collection).find(query).skip(start).limit(end - start + 1).sort({ _updated: -1 }).toArray();
            } else {
                result = await this.client.db(database).collection(collection).find(query).toArray();
            }
            return result as T[];
        } catch (err) {
            console.error("Error searching documents in " + collection + ":", err)
            return [];
        }
    }
}