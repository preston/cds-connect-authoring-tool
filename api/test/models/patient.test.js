import Patient from '../../src/models/patient.js';
import { importChaiExpect } from '../utils.js';

describe('Patient', () => {
  let expect;
  before(async () => {
    expect = await importChaiExpect();
  });

  describe('#validate', () => {
    // There isn't much to test, so just check it validates without errors
    it('should validate without errors', async () => {
      const patient = new Patient({ name: 'Bob' });
      expect(patient.name).to.equal('Bob');
      return patient.validate();
    });
  });
});
