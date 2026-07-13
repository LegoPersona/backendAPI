import app from './app';
import { connectDB } from './config/db';
import dotenv from "dotenv";
import https from 'https';
import fs from 'fs';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/etc/ssl/cs/CSB.crt';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/etc/ssl/cs/myserver.key';

const loadSslCredentials = (): { key: Buffer; cert: Buffer } => {
    try {
        return {
            key: fs.readFileSync(SSL_KEY_PATH),
            cert: fs.readFileSync(SSL_CERT_PATH),
        };
    } catch (error) {
        console.error(`HTTPS_ENABLED is true but the SSL files could not be read (cert: ${SSL_CERT_PATH}, key: ${SSL_KEY_PATH}).`, error);
        process.exit(1);
    }
};

const startServer = async (): Promise<void> => {
    try {
        const credentials = HTTPS_ENABLED ? loadSslCredentials() : null;

        await connectDB();

        if (credentials) {
            https.createServer(credentials, app).listen(PORT, () => {
                console.log(`Server is running on https://localhost:${PORT}`);
            });
        } else {
            app.listen(PORT, () => {
                console.log(`Server is running on http://localhost:${PORT}`);
            });
        }
    } catch (error) {
        console.error('Server startup aborted due to MongoDB connection error.', error);
        process.exit(1);
    }
};

void startServer();
