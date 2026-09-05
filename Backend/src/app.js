import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import investigationRoutes from './routes/investigationRoutes.js';
import entityRoutes from './routes/entityRoutes.js';
import relationshipRoutes from './routes/relationshipRoutes.js';
import signalRoutes from './routes/signalRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import evidenceRoutes from './routes/evidenceRoutes.js';
import trendRoutes from './routes/trendRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import ingestionRoutes from './routes/ingestionRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { auditLogger } from './middleware/auditLogger.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(auditLogger);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/investigations', investigationRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/records', signalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ingestion', ingestionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

export default app;