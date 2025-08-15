import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import request from 'supertest';
import nock from 'nock';
import sinon from 'sinon';
import Artifact from '../../src/models/artifact.js';
import CQLLibrary from '../../src/models/cqlLibrary.js';
import { expect } from 'chai';
import { setupExpressApp } from '../utils.js';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const SimpleArtifact = JSON.parse(fs.readFileSync(path.join(dirname, './fixtures/SimpleArtifact.json'), 'utf8'));

const simpleArtifactWithDataModel = Object.assign({ dataModel: { name: 'FHIR', version: '4.0.1' } }, SimpleArtifact);

// TODO: Tests for artifacts with external CQL libraries
// TODO: More tests when CQL-to-ELM returns ELM w/ errors in annotations

const sandbox = sinon.createSandbox();

describe('Route: /authoring/api/cql/', () => {
  let app, options;

  before(async () => {
    [app, options] = setupExpressApp();
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should return a zip file with compiled ELM for authenticated users', done => {
      options.user = { uid: 'bob' };

      // Mock ONLY database calls - all CQL logic runs real
      mockDatabaseForSuccess();
      
      // Mock ONLY external HTTP services - all internal logic runs real  
      mockExternalServicesForSuccess();

      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /zip/)
        .expect(200)
        .buffer()
        .parse(binaryParser)
        .end(function (err, res) {
          if (err) return done(err);
          
          // Test the actual ZIP (not mocked)
          unzipper.Open.buffer(res.body)
            .then(directory => {
              const files = directory.files.map(f => f.path);
              expect(files).to.have.length(7);
              expect(files).to.contain('Library-SimpleArtifact.json');
              expect(files).to.contain('SimpleArtifact.cql');
              expect(files).to.contain('SimpleArtifact.json');
              expect(files).to.contain('SimpleArtifact.xml');
              expect(files).to.contain('FHIRHelpers.cql');
              expect(files).to.contain('FHIRHelpers.json');
              expect(files).to.contain('FHIRHelpers.xml');
              done();
            })
            .catch(done);
        });
    });

    it('should still return a zip file even if CQL formatting fails', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      
      // Mock formatter to fail, but translator to succeed
      mockCQLFormatterForError()
        
      mockCQLTranslatorForSuccess();

      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /zip/)
        .expect(200)
        .buffer()
        .parse(binaryParser)
        .end(function (err, res) {
          if (err) return done(err);
          unzipper.Open.buffer(res.body)
            .then(directory => {
              const files = directory.files.map(f => f.path);
              expect(files).to.have.length(7);
              expect(files).to.contain('Library-SimpleArtifact.json');
              expect(files).to.contain('SimpleArtifact.cql');
              expect(files).to.contain('SimpleArtifact.json');
              expect(files).to.contain('SimpleArtifact.xml');
              expect(files).to.contain('FHIRHelpers.cql');
              expect(files).to.contain('FHIRHelpers.json');
              expect(files).to.contain('FHIRHelpers.xml');
              done();
            })
            .catch(done);
        });
    });

    it('should return a zip without the CPG library if there is an error getting artifact details', done => {
      options.user = { uid: 'bob' };

      // Mock CQLLibrary to succeed, but Artifact to fail
      sandbox.stub(CQLLibrary, 'find').returns({
        exec: sandbox.stub().resolves([])
      });
      
      sandbox.stub(Artifact, 'findOne').returns({
        exec: sandbox.stub().rejects(new Error('Connection Error'))
      });

      mockExternalServicesForSuccess();

      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /zip/)
        .expect(200)
        .buffer()
        .parse(binaryParser)
        .end(function (err, res) {
          if (err) return done(err);
          unzipper.Open.buffer(res.body)
            .then(directory => {
              const files = directory.files.map(f => f.path);
              // Should have 6 files instead of 7 (no CPG library)
              expect(files).to.have.length(6);
              expect(files).to.contain('SimpleArtifact.cql');
              expect(files).to.contain('SimpleArtifact.json');
              expect(files).to.contain('SimpleArtifact.xml');
              expect(files).to.contain('FHIRHelpers.cql');
              expect(files).to.contain('FHIRHelpers.json');
              expect(files).to.contain('FHIRHelpers.xml');
              done();
            })
            .catch(done);
        });
    });

    it('should return HTTP 500 if there is an error finding external artifacts', done => {
      options.user = { uid: 'bob' };

      // Mock database to fail
      sandbox.stub(CQLLibrary, 'find').returns({
        exec: sandbox.stub().rejects(new Error('Connection Error'))
      });

      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    it('should return HTTP 500 if there is an error converting CQL to ELM', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      
      // Mock CQL translator to fail
      mockCQLTranslatorForError();

      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });
});

describe('Route: /authoring/api/cql/validate', () => {
  let app, options;

  before(async () => {    
    [app, options] = setupExpressApp();
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should validate ELM that has no errors for authenticated users', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      mockCQLTranslatorForValidation(false); // JSON only, no XML

      request(app)
        .post('/authoring/api/cql/validate')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.have.keys('elmErrors', 'elmFiles');
          expect(res.body.elmErrors).to.have.length(0);
          expect(res.body.elmFiles).to.have.length(2);
        })
        .end(done);
    });

    it('should validate ELM and include CQL when requested for authenticated users', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      mockCQLTranslatorForValidation(false);

      request(app)
        .post('/authoring/api/cql/validate?includeCQL=true')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.have.keys('elmErrors', 'elmFiles', 'cqlFiles');
          expect(res.body.elmErrors).to.have.length(0);
          expect(res.body.elmFiles).to.have.length(2);
          expect(res.body.cqlFiles).to.have.length(1);
        })
        .end(done);
    });

    it('should still validate ELM even if CQL formatting fails', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      
      // Mock formatter to fail
      mockCQLFormatterForError()
        
      mockCQLTranslatorForValidation(false);

      request(app)
        .post('/authoring/api/cql/validate')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.have.keys('elmErrors', 'elmFiles');
          expect(res.body.elmErrors).to.have.length(0);
          expect(res.body.elmFiles).to.have.length(2);
        })
        .end(done);
    });

    it('should return HTTP 500 if there is an error finding external artifacts', done => {
      options.user = { uid: 'bob' };

      // Mock database to fail
      sandbox.stub(CQLLibrary, 'find').returns({
        exec: sandbox.stub().rejects(new Error('Connection Error'))
      });

      request(app)
        .post('/authoring/api/cql/validate')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    it('should return HTTP 500 if there is an error converting CQL to ELM', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      
      // Mock CQL translator to fail
      mockCQLTranslatorForError();

      request(app)
        .post('/authoring/api/cql/validate')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .post('/authoring/api/cql/validate')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });
});

describe('Route: /authoring/api/cql/viewCql', () => {
  let app, options;

  before(async () => {    
    [app, options] = setupExpressApp();
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should return CQL files for authenticated users', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      mockCQLFormatterForSuccess();

      request(app)
        .post('/authoring/api/cql/viewCql')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.have.keys('cqlFiles');
          expect(res.body.cqlFiles).to.have.length(1);
          expect(res.body.cqlFiles[0].name).to.equal('SimpleArtifact');
          expect(res.body.cqlFiles[0].text).to.match(/library "SimpleArtifact"/);
        })
        .end(done);
    });

    it('should still return CQL files even if CQL formatting fails', done => {
      options.user = { uid: 'bob' };

      mockDatabaseForSuccess();
      
      // Mock formatter to fail
      mockCQLFormatterForError();

      request(app)
        .post('/authoring/api/cql/viewCql')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(res => {
          expect(res.body).to.have.keys('cqlFiles');
          expect(res.body.cqlFiles).to.have.length(1);
          expect(res.body.cqlFiles[0].name).to.equal('SimpleArtifact');
          expect(res.body.cqlFiles[0].text).to.match(/library "SimpleArtifact"/);
        })
        .end(done);
    });

    it('should return HTTP 500 if there is an error finding external artifacts', done => {
      options.user = { uid: 'bob' };

      // Mock database to fail
      sandbox.stub(CQLLibrary, 'find').returns({
        exec: sandbox.stub().rejects(new Error('Connection Error'))
      });

      request(app)
        .post('/authoring/api/cql/viewCql')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    it('should return HTTP 401 for unauthenticated users', done => {
      options.user = null;
      request(app)
        .post('/authoring/api/cql/viewCql')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect('WWW-Authenticate', 'FormBased')
        .expect(401, done);
    });
  });
});

function mockCQLTranslatorForError() {
 nock('http://localhost:8080')
   .post('/cql/translator')
   .query(true)
   .reply(500, 'Connection Error');
}

function mockCQLFormatterForError() {
  nock('http://localhost:8080')
    .post('/cql/formatter')
    .reply(500, 'ConnectionError');
  }

// New helper function for validation tests
function mockCQLTranslatorForValidation(includeXML = false) {
  nock('http://localhost:8080')
    .post('/cql/translator')
    .query(true)
    .reply(200, function(uri, requestBody) {
      return createMockELMValidationResponse(includeXML);
    }, {
      'Content-Type': 'multipart/form-data; boundary=mock-boundary'
    });
}

function createMockELMValidationResponse(includeXML = false) {
  const boundary = 'mock-boundary';
  
  // Create mock ELM for validation (JSON only unless includeXML is true)
  const simpleArtifactELM = JSON.stringify({
    library: {
      identifier: { id: 'SimpleArtifact', version: '1.0.0' },
      schemaIdentifier: { id: 'urn:hl7-org:elm', version: 'r1' },
      usings: { def: [{ localIdentifier: 'System', uri: 'urn:hl7-org:elm-types:r1' }] },
      annotation: [] // No errors
    }
  });
  
  const fhirHelpersELM = JSON.stringify({
    library: {
      identifier: { id: 'FHIRHelpers', version: '4.0.1' },
      schemaIdentifier: { id: 'urn:hl7-org:elm', version: 'r1' },
      annotation: [] // No errors
    }
  });

  let response = `--${boundary}\r\n` +
         `Content-Disposition: form-data; name="SimpleArtifact"\r\n\r\n` +
         `${simpleArtifactELM}\r\n` +
         `--${boundary}\r\n` +
         `Content-Disposition: form-data; name="FHIRHelpers"\r\n\r\n` +
         `${fhirHelpersELM}\r\n`;

  if (includeXML) {
    const simpleArtifactELMXML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="urn:hl7-org:elm:r1">
  <identifier id="SimpleArtifact" version="1.0.0"/>
</library>`;
    
    const fhirHelpersELMXML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="urn:hl7-org:elm:r1">
  <identifier id="FHIRHelpers" version="4.0.1"/>
</library>`;

    response += `--${boundary}\r\n` +
               `Content-Disposition: form-data; name="SimpleArtifact"\r\n\r\n` +
               `${simpleArtifactELMXML}\r\n` +
               `--${boundary}\r\n` +
               `Content-Disposition: form-data; name="FHIRHelpers"\r\n\r\n` +
               `${fhirHelpersELMXML}\r\n`;
  }

  response += `--${boundary}--\r\n`;
  return response;
}

// Mock database responses with realistic data
function mockDatabaseForSuccess() {
  // Mock CQL Library query
  sandbox.stub(CQLLibrary, 'find').returns({
    exec: sandbox.stub().resolves([]) // No external libraries
  });

  // Mock Artifact query  
  const mockArtifact = {
    ...SimpleArtifact,
    toPublishableLibrary: () => ({
      resourceType: 'Library',
      id: 'SimpleArtifact',
      content: [{
        contentType: 'application/cql',
        data: Buffer.from('mock cql content').toString('base64')
      }]
    })
  };
  
  sandbox.stub(Artifact, 'findOne').returns({
    exec: sandbox.stub().resolves(mockArtifact)
  });
}

// Mock external HTTP services with realistic responses
function mockExternalServicesForSuccess() {
  mockCQLFormatterForSuccess();
  mockCQLTranslatorForSuccess();
}

function mockCQLFormatterForSuccess() {
  nock('http://localhost:8080')
    .post('/cql/formatter')
    .reply(200, function(uri, requestBody) {
      // Return formatted CQL (or just return input as-is)
      return requestBody;
    });
}

function mockCQLTranslatorForSuccess() {
  nock('http://localhost:8080')
    .post('/cql/translator')
    .query(true) // Accept any query parameters
    .reply(200, function(uri, requestBody) {
      // Return realistic multipart ELM response
      return createMockELMMultipartResponse();
    }, {
      'Content-Type': 'multipart/form-data; boundary=mock-boundary'
    });
}

function createMockELMMultipartResponse() {
  const boundary = 'mock-boundary';
  
  // Create mock ELM for SimpleArtifact
  const simpleArtifactELM = JSON.stringify({
    library: {
      identifier: { id: 'SimpleArtifact', version: '1.0.0' },
      schemaIdentifier: { id: 'urn:hl7-org:elm', version: 'r1' },
      usings: { def: [{ localIdentifier: 'System', uri: 'urn:hl7-org:elm-types:r1' }] }
    }
  });
  
  const simpleArtifactELMXML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="urn:hl7-org:elm:r1">
  <identifier id="SimpleArtifact" version="1.0.0"/>
</library>`;

  // Create mock ELM for FHIRHelpers  
  const fhirHelpersELM = JSON.stringify({
    library: {
      identifier: { id: 'FHIRHelpers', version: '4.0.1' },
      schemaIdentifier: { id: 'urn:hl7-org:elm', version: 'r1' }
    }
  });
  
  const fhirHelpersELMXML = `<?xml version="1.0" encoding="UTF-8"?>
<library xmlns="urn:hl7-org:elm:r1">
  <identifier id="FHIRHelpers" version="4.0.1"/>
</library>`;

  return `--${boundary}\r\n` +
         `Content-Disposition: form-data; name="SimpleArtifact"\r\n\r\n` +
         `${simpleArtifactELM}\r\n` +
         `--${boundary}\r\n` +
         `Content-Disposition: form-data; name="SimpleArtifact"\r\n\r\n` +
         `${simpleArtifactELMXML}\r\n` +
         `--${boundary}\r\n` +
         `Content-Disposition: form-data; name="FHIRHelpers"\r\n\r\n` +
         `${fhirHelpersELM}\r\n` +
         `--${boundary}\r\n` +
         `Content-Disposition: form-data; name="FHIRHelpers"\r\n\r\n` +
         `${fhirHelpersELMXML}\r\n` +
         `--${boundary}--\r\n`;
}

// Special parser to convert binary stream to a buffer
function binaryParser(res, callback) {
  res.setEncoding('binary');
  res.data = '';
  res.on('data', function (chunk) {
    res.data += chunk;
  });
  res.on('end', function () {
    callback(null, Buffer.from(res.data, 'binary'));
  });
}
