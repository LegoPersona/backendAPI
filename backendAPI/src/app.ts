import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handling middleware can be added here

export default app;