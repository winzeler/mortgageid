const passport = require('passport');
const { Strategy } = require('passport-jwt');
const { UsersService } = require('#features/users/api/services/UsersService');
const { getJwtValidator } = require('#api/Jwt');

/**
 * Configure Passport authentication.
 *
 * @param {Express} app - The app using passport authentication.
 *
 * @return {Express}
 */
async function configurePassport(app) {
  const usersService = new UsersService({ db: app.get('db') });

  // Ensure all users accessing non-public API routes have valid JWTs that load valid users
  passport.use('jwt', new Strategy({
    secretOrKey: process.env.JWT_SECRET,
    jwtFromRequest: (req) => ((req && req.cookies) ? req.cookies.jwt : null),
    ignoreExpiration: true, // We validate expiration ourselves to ensure consistent error response
    passReqToCallback: true, // Pass request to callback to check CSRF header
  }, getJwtValidator(usersService)));
  app.use(passport.initialize());
  app.use(/^\/api\/(?!public).*/, passport.authenticate('jwt', { session: false }));

  return app;
}

module.exports = {
  configurePassport,
};
