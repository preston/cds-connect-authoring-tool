import express from 'express';
import testing from '../handlers/testingHandler.js';

const TestingRouter = express.Router();

// Routes for /authoring/api/testing
TestingRouter.route('/').get(testing.allGet).post(testing.singlePost);

// Routes for /authoring/api/testing/:patient
TestingRouter.route('/:patient').get(testing.singleGet).delete(testing.singleDelete);

export default TestingRouter;
