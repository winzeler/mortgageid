const { UserModel } = require('#features/users/lib/models/UserModel');

describe('UserModel', () => {
  describe('hasFlag', () => {
    it('should test to see if user has flags', () => {
      const user = new UserModel({ flags: {
        aFlag: 'somevalue',
        specificFlag: 'specific_value',
      } });

      expect(user.hasFlag('aFlag')).toBe(true);
      expect(user.hasFlag('specificFlag', 'specific_value')).toBe(true);
      expect(user.hasFlag('specificFlag', 'other_value')).toBe(false);
    });

    // ---------------------------------------------------------------------------------------------

    it('should test for a secure flags', () => {
      const user = new UserModel({ secure_flags: {
        aFlag: 'somevalue',
        specificFlag: 'specific_value',
      } });

      expect(user.hasFlag('aFlag')).toBe(true);
      expect(user.hasFlag('specificFlag', 'specific_value')).toBe(true);
      expect(user.hasFlag('specificFlag', 'other_value')).toBe(false);
    });

    // ---------------------------------------------------------------------------------------------

    it('should not serialize secure flags', () => {
      const user = new UserModel({
        flags: { insecureFlag: 'insecure_value' },
        secure_flags: { secureFlag: 'secure_value' },
      });

      expect(user.toJSON()).toMatchSnapshot({
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });
  });
});
