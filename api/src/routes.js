import artifactRouter from './routers/artifactRouter.js';
import testingRouter from './routers/testingRouter.js';
import externalCQLRouter from './routers/externalCQLRouter.js';
import configRouter from './routers/configRouter.js';
import cqlRouter from './routers/cqlRouter.js';
import authRouter from './routers/authRouter.js';
import fhirRouter from './routers/fhirRouter.js';
import foreseeHandler from './handlers/foreseeHandler.js';
import modifiersRouter from './routers/modifiersRouter.js';
import queryRouter from './routers/queryRouter.js';
import userSettingsRouter from './routers/userSettingsRouter.js';

export default app => {
  // Routing for API check
  app.get('/', (req, res) => {
    res.json({ message: 'API Initialized!' });
  });

  // Routing for Artifacts
  app.use('/authoring/api/artifacts', artifactRouter);

  // Routing for Testing
  app.use('/authoring/api/testing', testingRouter);

  // // Routing for External CQL
  app.use('/authoring/api/externalCQL', externalCQLRouter);

  // Routing for Resources, ValueSets, Templates
  app.use('/authoring/api/config', configRouter);

  // Routing for cql files
  app.use('/authoring/api/cql', cqlRouter);

  // Routing for Auth
  app.use('/authoring/api/auth', authRouter);

  // Routing for FHIR VSAC endpoint
  app.use('/authoring/api/fhir', fhirRouter);

  // Handling for ForeSee script
  app.get('/authoring/api/foresee.js', foreseeHandler);

  // Routing for Modifiers
  app.use('/authoring/api/modifiers', modifiersRouter);

  // Routing for query builder endpoints
  app.use('/authoring/api/query', queryRouter);

  // Routing for user settings endpoints
  app.use('/authoring/api/settings', userSettingsRouter);

  // Catch all other Api calls
  app.get('/authoring/api/{*wildcard}', (req, res) => {
    res.sendStatus(404);
  });
};
