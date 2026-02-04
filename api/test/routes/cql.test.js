import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import request from 'supertest';
import sinon from 'sinon';
import Artifact from '../../src/models/artifact.js';
import CQLLibrary from '../../src/models/cqlLibrary.js';
import cqlHandler from '../../src/handlers/cqlHandler.js';
import { expect } from 'chai';
import { setupExpressApp } from '../utils.js';
import { fileURLToPath } from 'url';
import nock from 'nock';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const SimpleArtifact = JSON.parse(fs.readFileSync(path.join(dirname, './fixtures/SimpleArtifact.json'), 'utf8'));

const simpleArtifactWithDataModel = Object.assign({ dataModel: { name: 'FHIR', version: '4.0.1' } }, SimpleArtifact);

// TODO: Tests for artifacts with external CQL libraries
// TODO: More tests when CQL-to-ELM returns ELM w/ errors in annotations

describe('Route: /authoring/api/cql/', () => {
  let app, options, sandbox;

  before(async () => {
    [app, options] = setupExpressApp();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should return a zip file with compiled ELM for authenticated users', done => {
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox);
      mockArtifactFindOneForSimpleArtifact(sandbox);
      mockMakeCQLtoELMRequestForSimpleArtifact(sandbox);

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

    it('should still return a zip file even if CQL formatting fails', done => {
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox, new Error('ConnectionError'));
      mockArtifactFindOneForSimpleArtifact(sandbox);
      mockMakeCQLtoELMRequestForSimpleArtifact(sandbox);

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
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox);
      mockArtifactFindOneForSimpleArtifact(sandbox, new Error('Connection Error'));
      mockMakeCQLtoELMRequestForSimpleArtifact(sandbox);

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
      mockCQLLibraryFindForSimpleArtifact(sandbox, new Error('Connection Error'));

      request(app)
        .post('/authoring/api/cql/')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    // Passes only when individual test suite runs
    it.skip('should return HTTP 500 if there is an error converting CQL to ELM', done => {
      mockDatabaseForSuccess(sandbox);
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

  after(() => {
    sinon.restore();
    nock.cleanAll();
    if (nock.isActive()) {
      nock.restore();
      nock.activate();
    }
  });
});

describe('Route: /authoring/api/cql/validate', () => {
  let app, options, sandbox;

  before(async () => {
    [app, options] = setupExpressApp();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should validate ELM that has no errors for authenticated users', done => {
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox);
      mockMakeCQLtoELMRequestForSimpleArtifact(sandbox, false);

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
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox);
      mockMakeCQLtoELMRequestForSimpleArtifact(sandbox, false);

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
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox, new Error('ConnectionError'));
      mockMakeCQLtoELMRequestForSimpleArtifact(sandbox, false);

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
      mockCQLLibraryFindForSimpleArtifact(sandbox, new Error('Connection Error'));

      request(app)
        .post('/authoring/api/cql/validate')
        .send(simpleArtifactWithDataModel)
        .set('Content-Type', 'application/json')
        .expect(500, done);
    });

    // Passes only when individual test suite runs
    it.skip('should return HTTP 500 if there is an error converting CQL to ELM', done => {
      mockDatabaseForSuccess(sandbox);
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

  after(() => {
    sinon.restore();
    nock.cleanAll();
    if (nock.isActive()) {
      nock.restore();
      nock.activate();
    }
  });
});

describe('Route: /authoring/api/cql/viewCql', () => {
  let app, options, sandbox;

  before(async () => {
    [app, options] = setupExpressApp();
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (sandbox) sandbox.restore();
    options.reset();
  });

  describe('POST', () => {
    it('should return CQL files for authenticated users', done => {
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox);

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
      mockCQLLibraryFindForSimpleArtifact(sandbox);
      mockFormatCQLForSimpleArtifact(sandbox, new Error('Connection Error'));

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
      mockCQLLibraryFindForSimpleArtifact(sandbox, new Error('Connection Error'));

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

  after(() => {
    sinon.restore();
  });
});

function mockMakeCQLtoELMRequestForSimpleArtifact(sandbox, includeXML = true, err) {
  let results;
  if (!err) {
    results = [];
    const formats = includeXML ? ['json', 'xml'] : ['json'];
    ['FHIRHelpers', 'SimpleArtifact'].forEach(name => {
      formats.forEach(format => {
        results.push({
          name,
          content: fs.readFileSync(path.join(dirname, 'fixtures', `${name}.elm.${format}`), 'utf-8')
        });
      });
    });
  }

  sandbox.stub(cqlHandler, 'makeCQLtoELMRequest').callsFake((cqlFiles, libraries, includeXMLParam, callback) => {
    callback(err, results);
  });
}

function mockArtifactFindOneForSimpleArtifact(sandbox, err) {
  sandbox.stub(Artifact, 'findOne').returns({
    exec: err ? sandbox.stub().rejects(err) : sandbox.stub().resolves(new Artifact(SimpleArtifact))
  });
}

function mockFormatCQLForSimpleArtifact(sandbox, err) {
  const result = err ? undefined : fs.readFileSync(path.join(dirname, 'fixtures', 'SimpleArtifact.cql'), 'utf-8');
  sandbox.stub(cqlHandler, 'formatCQL').callsFake((cqlText, callback) => {
    callback(err, result);
  });
}

function mockCQLTranslatorForError() {
  nock('http://localhost:8080').post('/cql/translator').query(true).reply(500, 'Connection Error');
}

function mockDatabaseForSuccess(sandbox) {
  // Mock CQL Library query
  sandbox.stub(CQLLibrary, 'find').returns({
    exec: sandbox.stub().resolves([])
  });

  // Mock Artifact query
  const mockArtifact = {
    ...SimpleArtifact,
    toPublishableLibrary: () => ({
      resourceType: 'Library',
      id: 'SimpleArtifact',
      content: [
        {
          contentType: 'application/cql',
          data: Buffer.from('mock cql content').toString('base64')
        }
      ]
    })
  };

  sandbox.stub(Artifact, 'findOne').returns({
    exec: sandbox.stub().resolves(mockArtifact)
  });
}

function mockCQLLibraryFindForSimpleArtifact(sandbox, err) {
  sandbox.stub(CQLLibrary, 'find').returns({
    exec: err ? sandbox.stub().rejects(err) : sandbox.stub().resolves([])
  });
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
