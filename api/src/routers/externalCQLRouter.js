import express from 'express';
import externalCQL from '../handlers/externalCQLHandler.js';

const ExternalCQLRouter = express.Router();

// Routes for /authoring/api/externalCQL
ExternalCQLRouter.route('/').post(externalCQL.singlePost);

// Routes for /authoring/api/externalCQL/:artifactId
ExternalCQLRouter.route('/:artifactId').get(externalCQL.allGet); // Get all external CQL libraries for a given artifact

ExternalCQLRouter.route('/details/:id').get(externalCQL.singleGet);

// Routes for /authoring/api/externalCQL/:externalCQL
ExternalCQLRouter.route('/:id').delete(externalCQL.singleDelete);

export default ExternalCQLRouter;
