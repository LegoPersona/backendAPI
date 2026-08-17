import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerSpec } from './swagger/swagger';

/** Root public directory. Only used for the built frontend in the fullstack container image;
 *  persona/profile images now live in GCS, not here. */
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve the built frontend when present (fullstack container image only). Persona/profile
// images are no longer served from here — they live in GCS and are referenced by public URL.
app.use(express.static(PUBLIC_DIR));

// SPA fallback: only serve index.html for non-API routes when a built frontend is actually present.
const indexHtml = path.join(PUBLIC_DIR, 'index.html');
if (fs.existsSync(indexHtml)) {
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(indexHtml);
    });
}

export default app;