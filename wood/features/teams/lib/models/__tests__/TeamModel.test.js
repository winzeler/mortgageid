const { TeamModel } = require('#features/teams/lib/models/TeamModel');

describe('TeamModel', () => {
  describe('hasFlag', () => {
    it('should test to see if team has flags', () => {
      const team = new TeamModel({ flags: {
        aFlag: 'somevalue',
        specificFlag: 'specific_value',
      } });

      expect(team.hasFlag('aFlag')).toBe(true);
      expect(team.hasFlag('specificFlag', 'specific_value')).toBe(true);
      expect(team.hasFlag('specificFlag', 'other_value')).toBe(false);
    });

    // ---------------------------------------------------------------------------------------------

    it('should test for a secure flags', () => {
      const team = new TeamModel({ secure_flags: {
        aFlag: 'somevalue',
        specificFlag: 'specific_value',
      } });

      expect(team.hasFlag('aFlag')).toBe(true);
      expect(team.hasFlag('specificFlag', 'specific_value')).toBe(true);
      expect(team.hasFlag('specificFlag', 'other_value')).toBe(false);
    });

    // ---------------------------------------------------------------------------------------------

    it('should not serialize secure flags', () => {
      const team = new TeamModel({
        flags: { insecureFlag: 'insecure_value' },
        secure_flags: { secureFlag: 'secure_value' },
      });

      expect(team.toJSON()).toMatchSnapshot({
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });
  });
});
