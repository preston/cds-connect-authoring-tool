import express from 'express';
import settings from '../handlers/userSettingsHandler.js';

const UserSettingsRouter = express.Router();

// Routes for /authoring/api/settings
UserSettingsRouter.route('/').get(settings.get).put(settings.put);

export default UserSettingsRouter;
