import express, { Request, Response } from 'express';

const app = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.get('/healthcheck', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});