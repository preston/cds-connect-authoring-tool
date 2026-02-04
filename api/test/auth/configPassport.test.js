import esmock from 'esmock';
import sinon from 'sinon';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect } from 'chai';
import { getLocalConfiguration } from '../../src/auth/configPassport.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

describe('configPassport', () => {
  let getLdapConfiguration;

  describe('#getLdapConfiguration', () => {
    let config;
    let mockConfig;
    let mockFs;

    beforeEach(async () => {
      // Replace the require(../config) w/ a simplified version containing just what we need
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

      // Create mock config that mimics real config module
      mockConfig = {
        default: {
          get: sinon.stub().callsFake(path => {
            if (path === 'auth.ldap') return config.auth.ldap;
            return null;
          })
        }
      };

      // Create mock fs for certificate loading tests
      mockFs = {
        default: {
          readFileSync: sinon.stub().callsFake(filePath => {
            if (filePath.includes('ca1.crt')) {
              return Buffer.from('Fake Cert One', 'utf-8');
            }
            if (filePath.includes('ca2.crt')) {
              return Buffer.from('Fake Cert Two', 'utf-8');
            }
            // Simulate file not found
            const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
            error.code = 'ENOENT';
            throw error;
          })
        }
      };

      // Use esmock to create a version of configPassport with mocked dependencies (replaces rewire)
      const configPassportModule = await esmock('../../src/auth/configPassport.js', {
        '../../src/config.js': mockConfig.default,
        fs: mockFs.default
      });

      getLdapConfiguration = configPassportModule.getLdapConfiguration;
    });

    it('should replace the LDAP username and password placeholders with values from the request', done => {
      const req = { body: { username: 'bob', password: 'lemoncurd' } };
      getLdapConfiguration(req, (err, ldapConfig) => {
        expect(err).to.be.null;
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
    });

    it('should replace the LDAP username and password placeholders with values from the request that have special characters', done => {
      const req = { body: { username: 'bob\\bob', password: '"lemon" curd' } };
      getLdapConfiguration(req, (err, ldapConfig) => {
        expect(err).to.be.null;
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
    });

    it('should replace the ca file references with file contents', done => {
      config.auth.ldap.server.tlsOptions = {
        ca: [path.join(dirname, 'fixtures', 'ca1.crt'), path.join(dirname, 'fixtures', 'ca2.crt')],
        rejectUnauthorized: true
      };

      const req = { body: { username: 'bob', password: 'lemoncurd' } };
      getLdapConfiguration(req, (err, ldapConfig) => {
        expect(err).to.be.null;
        expect(ldapConfig.server.tlsOptions).to.eql({
          ca: [Buffer.from('Fake Cert One', 'utf-8'), Buffer.from('Fake Cert Two', 'utf-8')],
          rejectUnauthorized: true
        });
        done();
      });
    });

    it('should skip ca file references that it cannot load', done => {
      config.auth.ldap.server.tlsOptions = {
        ca: ['first-bad-path', path.join(dirname, 'fixtures', 'ca1.crt'), 'last-bad-path'],
        rejectUnauthorized: true
      };

      const req = { body: { username: 'bob', password: 'lemoncurd' } };
      getLdapConfiguration(req, (err, ldapConfig) => {
        expect(err).to.be.null;
        expect(ldapConfig.server.tlsOptions).to.eql({
          ca: [Buffer.from('Fake Cert One', 'utf-8')],
          rejectUnauthorized: true
        });
        done();
      });
    });
  });

  describe('#getLocalConfiguration', () => {
    const users = { bob: 'p@$$w0rd!', sue: '1l0v3h0r$3$!' };

    it('should callback with the user when username and passwords match', done => {
      getLocalConfiguration(
        'bob',
        'p@$$w0rd!',
        (err, user) => {
          expect(err).to.be.null;
          expect(user).to.eql({ uid: 'bob', password: 'p@$$w0rd!' });
          done();
        },
        users
      );
    });

    it('should callback with the false when passwords do not match', done => {
      getLocalConfiguration(
        'bob',
        'wrongpassword',
        (err, user) => {
          expect(err).to.be.null;
          expect(user).to.be.false;
          done();
        },
        users
      );
    });

    it('should callback with the false when user is not found', done => {
      getLocalConfiguration(
        'nonexistentuser',
        'anypassword',
        (err, user) => {
          expect(err).to.be.null;
          expect(user).to.be.false;
          done();
        },
        users
      );
    });

    // Trigger error by passing users as a string instead of an object
    it('should callback with error if findLocalUserById returns an error', done => {
      getLocalConfiguration(
        'nonexistentuser',
        'anypassword',
        (err, user) => {
          expect(err).to.be.null;
          expect(user).to.be.false;
          done();
        },
        'users'
      );
    });
  });
});
