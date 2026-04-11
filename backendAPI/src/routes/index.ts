import { Application, Router } from 'express';

const router = Router();

// Define your routes here
// Example: router.get('/example', exampleController);

export default (app: Application): void => {
    app.use('/api', router);
};