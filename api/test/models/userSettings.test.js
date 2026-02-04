import UserSettings from '../../src/models/userSettings.js';
import { importChaiExpect } from '../utils.js';

describe('UserSettings', () => {
  let expect;
  before(async () => {
    expect = await importChaiExpect();
  });

  describe('#validate', () => {
    // There isn't much to test, so just check it validates without errors
    it('should validate without errors', async () => {
      const settings = new UserSettings({ user: 'Bob' });
      expect(settings.user).to.equal('Bob');
      return settings.validate();
    });
  });
});
