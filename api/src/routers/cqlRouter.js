import express from 'express';
import cqlHandler from '../handlers/cqlHandler.js';

const CQLRouter = express.Router();

// Routes for /authoring/api/cql
CQLRouter.route('/').post(cqlHandler.objToZippedCql);

CQLRouter.route('/validate').post(cqlHandler.objToELM);
CQLRouter.route('/viewCql').post(cqlHandler.objToViewableCql);

export default CQLRouter;
