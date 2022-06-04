/**
 * @type {Object} Permissions a role can have.
 */
const permissions = {
  manage_team: {
    name: 'Manage Team',
    description: 'Invite/manage/remove team members.',
  },
  manage_subscription: {
    name: 'Manage Subscription',
    description: 'Create/edit/cancel this team\'s subscription.',
  },
};

/**
 * @type {Object} Roles a user may be assigned.
 */
const roles = {
  owner: {
    name: 'Owner',
    description: 'Team owner, has all permissions.',
    permissions: Object.keys(permissions),
  },
  member: {
    name: 'Member',
    description: 'Standard team member.',
    permissions: [],
  },
};

module.exports = {
  roles,
  permissions,

  /**
   * @type {Boolean} If the team name on the signup form is optional.
   *
   * If so, the user's name will be used, as follows: `${name}'s Team`.
   */
  teamNameOptional: true,

  /**
   * @type {Boolean} If subscriptions will limit the count of members that can be on a team.
   */
  subscriptionMemberLimits: false,

  /**
   * @type {Array} How long a team invite is valid for.
   *
   * These values are used as paramters for Moment.js's manipulation functions:
   * https://momentjs.com/docs/#/manipulating/
   */
  inviteExpiry: [7, 'days'],

  /**
   * @type {Object} The terms used to refer to teams throughout the UI and API responses.
   */
  language: {
    /* eslint-disable no-template-curly-in-string */
    alreadyOnTeamError: 'You are already on this team.',
    subscriptionMemberLimitError: 'Your subscription only allows for ${limit} team members.',
    modifyTeamMemberError: 'Could not modify team member.',
    cannotRemoveSelfError: 'Cannot remove self from own team.',
    inviteMailSubject: '${appName}: You have been invited to join team ${teamName}',
    inviteEmailHeader: 'Join team ${teamName} on ${appName}.',
    inviteEmailBody1: 'You\'ve been invited to join team ${teamName} on ${appName}!',
    inviteEmailBody2: 'You can join this team by clicking the link below, but please be quick!  This link will expire in one day.',
    inviteEmailCTA: 'Join team ${teamName}!',
    emptyTeamNameError: 'You must enter a team name.',
    inviteDialogHeader: 'Invite Team Member',
    inviteDialogSuccess: 'Team member invited.',
    inviteDialogError: 'Could not invite team member.',
    removeDialogHeader: 'Remove Team Member',
    removeDialogBody: 'Are you sure you want to remove <strong>${memberName}</strong> from your team?',
    removeDialogAction: 'Yes, Remove Team Member',
    removeDialogSuccess: 'Team member removed.',
    removeDialogError: 'Could not remove team member.',
    renameDialogHeader: 'Rename Team',
    renameDialogAction: 'Rename Team',
    renameDialogSuccess: 'Team renamed.',
    renameDialogError: 'Could not rename team.',
    invitePageHeader: 'You\'ve been invited to join team ${teamName} on ${appName}!',
    noTeamPageHeader: 'No Team',
    noTeamPageBodyOne: 'You are not on a team at this time.',
    noTeamPageBodyTwo: 'If this is not expected, please contact your team administrator or',
    signupNoCCPageFormLabel: 'Team Name',
    teamPageHeader: 'My Team:',
    teamPageMembersHeader: 'Team Members',
    teamPageInviteAction: 'Invite Team Member',
    teamPageMembersCountLabel: 'Team Members:',
    teamPageRemoveMemberLabel: 'Remove Member',
    /* eslint-enable */
  },
};
