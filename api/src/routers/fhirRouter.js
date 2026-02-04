import express from 'express';
import fhir from '../handlers/fhirHandler.js';

const FHIRRouter = express.Router();

FHIRRouter.route('/login').post(fhir.login);

FHIRRouter.route('/search').get(fhir.searchForValueSets);

FHIRRouter.route('/vs/:id').get(fhir.getValueSet);

FHIRRouter.route('/code').get(fhir.getCode);

export default FHIRRouter;
