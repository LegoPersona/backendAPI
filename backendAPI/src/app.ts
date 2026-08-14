import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { PUBLIC_DIR } from './utils';
import { swaggerSpec } from './swagger/swagger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static assets from the public folder (generated persona images live under public/personas,
// and the built frontend is present here only in the fullstack container image).
app.use(express.static(PUBLIC_DIR));

// SPA fallback: only serve index.html for non-API routes when a built frontend is actually present.
// Keyed off index.html (not the folder) so that creating public/personas alone doesn't enable this.
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