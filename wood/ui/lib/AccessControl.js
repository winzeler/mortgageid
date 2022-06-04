function hasCapabilities(subscription, capabilities) {
  return subscription
    // If user has a subscription, test its capabilities
    ? subscription.hasCapabilities(capabilities)
    // If user has no subscription, test fails if there are any required capabilities
    : capabilities.length === 0;
}

function hasPermissions(role, permissions) {
  return role.hasPermissions(permissions);
}

function canAccessResource(subscription, capabilities, role, permissions) {
  return hasCapabilities(subscription, capabilities)
    && hasPermissions(role, permissions);
}

module.exports = {
  hasCapabilities,
  hasPermissions,
  canAccessResource,
};
