import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import githubRoutes from './routes/githubRoutes.js';

// Configure environment variables
dotenv.config();

// Ensure required environment variables are present
if (!process.env.MONGO_URI) {
    console.error('Error: MONGO_URI is not defined in the environment variables.');
    process.exit(1);
}

// Express app setup
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Determine __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Frontend
app.use('/', express.static(path.join(__dirname, 'frontend')));

// API Routes
app.use('/api/v1/github', githubRoutes);

// Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await mongoose.connection.close();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});