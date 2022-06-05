const { fromPairs, get, trim } = require('lodash');
const superagent = require('superagent-use')(require('superagent'));

const request = superagent.agent();

/**
 * Updates the CSRF token that gets sent with every request.
 */
function updateCsrfToken() {
  const cookies = fromPairs(
    document.cookie.split(';').map((cookie) => cookie.split('=').map(trim)),
  );
  request.updateCsrf(get(cookies, 'csrf', ''));
}

/**
 * Update CSRF token to use in all requests.
 *
 * @param {String} csrf - The CSRF token to update with.
 */
request.updateCsrf = (csrf) => {
  request.use((req) => {
    req.set('X-CSRF-TOKEN', csrf);

    return req;
  });
};

// If not authorized, redirect to login or provided redirect
request.on('response', (res) => {
  if (res.statusCode === 401) {
    const { router } = require('#ui/router'); // eslint-disable-line global-require
    const currentPath = router.currentRoute.fullPath;
    const redirectPath = get(res.body, 'redirect_to', '/login');

    if (currentPath !== redirectPath) {
      router.push(redirectPath);
    }
  }
});

updateCsrfToken();

module.exports = { request, updateCsrfToken };
