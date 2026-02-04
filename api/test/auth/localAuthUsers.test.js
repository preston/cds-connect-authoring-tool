import { expect } from 'chai';
import { findByUsername } from '../../src/auth/localAuthUsers.js';

describe('localAuthUsers', () => {
  const users = { bob: 'p@$$w0rd!', sue: '1l0v3h0r$3$!' };

  describe('#findByUsername', () => {
    it('should callback with a user object when a user is found', done => {
      findByUsername(
        'bob',
        (err, user) => {
          expect(err).to.be.null;
          expect(user).to.eql({ uid: 'bob', password: 'p@$$w0rd!' });
          done();
        },
        users
      );
    });

    it('should callback with nulls when a user is not found', done => {
      findByUsername(
        'gerald',
        (err, user) => {
          expect(err).to.be.null;
          expect(user).to.be.null;
          done();
        },
        users
      );
    });
  });
});
