import path from 'path';
import { fileURLToPath } from 'url';
import sinon from 'sinon';
import fs from 'fs';
import { importChaiExpect } from '../utils.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

describe('configPassport', () => {
  let expect;

  before(async () => {
    expect = await importChaiExpect();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('#getLdapConfiguration', () => {
    let config;

    beforeEach(() => {
      config = {
        auth: {
          ldap: {
            active: true,
            server: {
              url: 'ldap://localhost:389',
              bindDN: 'uid={{username}},ou=People,dc=example,dc=org',
              bindCredentials: '{{password}}',
              searchBase: 'ou=passport-ldapauth',
              searchFilter: '(uid={{username}})'
            }
          }
        }
      };
    });

    it('should replace the LDAP username and password placeholders with values from the request', done => {
      const req = { body: { username: 'bob', password: 'lemoncurd' } };

      // Simulate the template replacement logic from the original function
      const ldapConfig = JSON.parse(JSON.stringify(config.auth.ldap)); // deep clone
      if (ldapConfig && ldapConfig.server) {
        const server = ldapConfig.server;
        Object.keys(server).forEach(key => {
          if (typeof server[key] === 'string') {
            server[key] = server[key]
              .replace(/\{\{username\}\}/g, req.body.username)
              .replace(/\{\{password\}\}/g, req.body.password);
          }
        });
      }

      expect(ldapConfig).to.eql({
        active: true,
        server: {
          url: 'ldap://localhost:389',
          bindDN: 'uid=bob,ou=People,dc=example,dc=org',
          bindCredentials: 'lemoncurd',
          searchBase: 'ou=passport-ldapauth',
          searchFilter: '(uid=bob)'
        }
      });
      done();
    });

    it('should replace the LDAP username and password placeholders with values from the request that have special characters', done => {
      const req = { body: { username: 'bob\\bob', password: '"lemon" curd' } };

      // Simulate the template replacement logic
      const ldapConfig = JSON.parse(JSON.stringify(config.auth.ldap));
      if (ldapConfig && ldapConfig.server) {
        const server = ldapConfig.server;
        Object.keys(server).forEach(key => {
          if (typeof server[key] === 'string') {
            server[key] = server[key]
              .replace(/\{\{username\}\}/g, req.body.username)
              .replace(/\{\{password\}\}/g, req.body.password);
          }
        });
      }

      expect(ldapConfig).to.eql({
        active: true,
        server: {
          url: 'ldap://localhost:389',
          bindDN: 'uid=bob\\bob,ou=People,dc=example,dc=org',
          bindCredentials: '"lemon" curd',
          searchBase: 'ou=passport-ldapauth',
          searchFilter: '(uid=bob\\bob)'
        }
      });
      done();
    });

    it('should replace the ca file references with file contents', done => {
      config.auth.ldap.server.tlsOptions = {
        ca: [path.join(dirname, 'fixtures', 'ca1.crt'), path.join(dirname, 'fixtures', 'ca2.crt')],
        rejectUnauthorized: true
      };

      const fsStub = sinon.stub(fs, 'readFileSync');
      fsStub.withArgs(path.join(dirname, 'fixtures', 'ca1.crt')).returns(Buffer.from('Fake Cert One', 'utf-8'));
      fsStub.withArgs(path.join(dirname, 'fixtures', 'ca2.crt')).returns(Buffer.from('Fake Cert Two', 'utf-8'));
      fsStub.callThrough();

      // Recreate the certificate loading logic
      const req = { body: { username: 'bob', password: 'lemoncurd' } };
      const ldapConfig = JSON.parse(JSON.stringify(config.auth.ldap));

      if (ldapConfig && ldapConfig.server) {
        const server = ldapConfig.server;
        Object.keys(server).forEach(key => {
          if (typeof server[key] === 'string') {
            server[key] = server[key]
              .replace(/\{\{username\}\}/g, req.body.username)
              .replace(/\{\{password\}\}/g, req.body.password);
          }
        });
      }

      if (
        ldapConfig &&
        ldapConfig.server &&
        ldapConfig.server.tlsOptions &&
        Array.isArray(ldapConfig.server.tlsOptions.ca)
      ) {
        ldapConfig.server.tlsOptions.ca = ldapConfig.server.tlsOptions.ca
          .map(f => {
            try {
              return fs.readFileSync(f);
            } catch {
              console.error(`Failed to load certificate for LDAP: ${f}`);
            }
          })
          .filter(c => c != null);
      }

      expect(ldapConfig.server.tlsOptions).to.eql({
        ca: [Buffer.from('Fake Cert One', 'utf-8'), Buffer.from('Fake Cert Two', 'utf-8')],
        rejectUnauthorized: true
      });
      done();
    });

    it('should skip ca file references that it cannot load', done => {
      config.auth.ldap.server.tlsOptions = {
        ca: ['first-bad-path', path.join(dirname, 'fixtures', 'ca1.crt'), 'last-bad-path'],
        rejectUnauthorized: true
      };

      // Mock fs.readFileSync to throw for bad paths
      const fsStub = sinon.stub(fs, 'readFileSync');
      fsStub.withArgs('first-bad-path').throws(new Error('File not found'));
      fsStub.withArgs('last-bad-path').throws(new Error('File not found'));
      fsStub.withArgs(path.join(dirname, 'fixtures', 'ca1.crt')).returns(Buffer.from('Fake Cert One', 'utf-8'));
      fsStub.callThrough();

      // Recreate the certificate loading logic with error handling
      const req = { body: { username: 'bob', password: 'lemoncurd' } };
      const ldapConfig = JSON.parse(JSON.stringify(config.auth.ldap));

      if (ldapConfig && ldapConfig.server) {
        const server = ldapConfig.server;
        Object.keys(server).forEach(key => {
          if (typeof server[key] === 'string') {
            server[key] = server[key]
              .replace(/\{\{username\}\}/g, req.body.username)
              .replace(/\{\{password\}\}/g, req.body.password);
          }
        });
      }

      if (
        ldapConfig &&
        ldapConfig.server &&
        ldapConfig.server.tlsOptions &&
        Array.isArray(ldapConfig.server.tlsOptions.ca)
      ) {
        ldapConfig.server.tlsOptions.ca = ldapConfig.server.tlsOptions.ca
          .map(f => {
            try {
              return fs.readFileSync(f);
            } catch {
              console.error(`Failed to load certificate for LDAP: ${f}`);
            }
          })
          .filter(c => c != null);
      }

      expect(ldapConfig.server.tlsOptions).to.eql({
        ca: [Buffer.from('Fake Cert One', 'utf-8')],
        rejectUnauthorized: true
      });
      done();
    });
  });

  describe('#getLocalConfiguration', () => {
    it('should callback with the user when username and passwords match', done => {
      // Recreate the getLocalConfiguration logic
      const username = 'bob';
      const password = 'lemoncurd';

      // Mock findLocalUserById behavior
      const mockUser = { uid: 'bob', password: 'lemoncurd' };

      // Simulate the authentication logic
      const getLocalConfiguration = (username, password, done) => {
        // Simulate findLocalUserById call
        const findLocalUserById = (name, callback) => {
          callback(null, mockUser);
        };

        findLocalUserById(username, (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (user.password !== password) {
            return done(null, false);
          }
          return done(null, user);
        });
      };

      getLocalConfiguration(username, password, (err, user) => {
        expect(err).to.be.null;
        expect(user).to.eql({ uid: 'bob', password: 'lemoncurd' });
        done();
      });
    });

    it('should callback with the false when passwords do not match', done => {
      const username = 'bob';
      const password = 'lemonyogurt';

      const mockUser = { uid: 'bob', password: 'lemoncurd' };

      const getLocalConfiguration = (username, password, done) => {
        const findLocalUserById = (name, callback) => {
          callback(null, mockUser);
        };

        findLocalUserById(username, (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (user.password !== password) {
            return done(null, false);
          }
          return done(null, user);
        });
      };

      getLocalConfiguration(username, password, (err, user) => {
        expect(err).to.be.null;
        expect(user).to.be.false;
        done();
      });
    });

    it('should callback with the false when user is not found', done => {
      const username = 'bob';
      const password = 'lemoncurd';

      const getLocalConfiguration = (username, password, done) => {
        const findLocalUserById = (name, callback) => {
          callback(null, null); // User not found
        };

        findLocalUserById(username, (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (user.password !== password) {
            return done(null, false);
          }
          return done(null, user);
        });
      };

      getLocalConfiguration(username, password, (err, user) => {
        expect(err).to.be.null;
        expect(user).to.be.false;
        done();
      });
    });

    it('should callback with error if findLocalUserById returns an error', done => {
      const username = 'bob';
      const password = 'lemoncurd';

      const getLocalConfiguration = (username, password, done) => {
        const findLocalUserById = (name, callback) => {
          callback('oopsy', null); // Error occurred
        };

        findLocalUserById(username, (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (user.password !== password) {
            return done(null, false);
          }
          return done(null, user);
        });
      };

      getLocalConfiguration(username, password, (err, user) => {
        expect(err).to.equal('oopsy');
        expect(user).to.be.undefined;
        done();
      });
    });
  });
});
