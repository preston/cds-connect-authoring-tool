import express from 'express';
import modifiers from '../handlers/modifiersHandler.js';
const ModifiersRouter = express.Router();

// Routes for /authoring/api/modifiers
ModifiersRouter.route('/:artifact').get(modifiers.allGet);

export default ModifiersRouter;
