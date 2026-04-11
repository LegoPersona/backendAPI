import app from './app';
import { connectDB } from './config/db';
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Server startup aborted due to MongoDB connection error.', error);
        process.exit(1);
    }
};

void startServer();