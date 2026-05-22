import { Router } from 'express';
import { postChat } from '../controllers/agent.controller.js';

export const agentRouter = Router();

agentRouter.post('/chat', postChat);
