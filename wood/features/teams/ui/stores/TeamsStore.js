const { request } = require('#ui/lib/xhr');
const { delayMin } = require('#lib/Time');

module.exports = {
  namespaced: true,

  actions: {
    /**
     * Update a team with new information.
     *
     * @param {Object} context - Unused.
     * @param {String} name - The name of the team to update.
     */
    async updateTeam(context, { name } = {}) {
      await delayMin(500, request.put('/api/team').send({ name }));
    },
  },
};
