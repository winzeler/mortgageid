const express = require('express');
const bodyParser = require('body-parser');
const { join } = require('path');
const cookieParser = require('cookie-parser');
const { isEmpty } = require('lodash');
const pino = require('express-pino-logger');
const history = require('connect-history-api-fallback');
const nodemailer = require('nodemailer');
const { getDb } = require('#api/Db');
const { configurePassport } = require('#api/Passport');
const { allFeatures, isFeatureEnabled } = require('#lib/Config');
const { SubscriptionsService } = require('#features/subscriptions/api/services/SubscriptionsService');
const { TeamsService } = require('#features/teams/api/services/TeamsService');
const { TeamMembersService } = require('#features/teams/api/services/TeamMembersService');
const { RoleModel } = require('#features/teams/lib/models/RoleModel');
const { getConfig, getConfigApi } = require('#lib/Config');
const {
  Standard4xxErrors,
  Standard401Error,
  ERROR_NOT_AUTHORIZED,
  ERROR_PAYLOAD_TOO_LARGE,
  ERROR_COULD_NOT_PARSE_JSON,
  ERROR_NOT_ON_TEAM,
} = require('#lib/Errors');

require('express-async-errors');

const APP_DIR = '../../app';
const WEB_DIR = '../../www/dist';

// If we should log the body, add a serializer for it
const serializers = getConfig('security', 'shouldLogBody')
  ? {
    req(req) {
      req.body = req.raw.body;
      return req;
    },
  }
  : {};

const logIgnoreRegExp = new RegExp(`\\.(${getConfig('app', 'logIgnoreExtensions').join('|')})$`);

// Ensure user has set up their email configuration.
if (isEmpty(getConfigApi('email', 'transportConfig'))) {
  throw new Error('Email is not configured, see docs: https://nodewood.com/docs/api/#email-js');
}

class AppBuilder {
  /**
   * Constructor.
   *
   * @param {MockNodeMailer} mailer - Optional Nodemailer mock, used for testing.
   */
  constructor({ mailer = null } = {}) {
    this.mailer = mailer;
  }

  /**
   * Get the app for the server.
   *
   * @return {Express}
   */
  async getApp() {
    let app = express();

    app = await this.beforeMiddlewareAdded(app);

    app = this.configureExpress(app);

    // Configure DB
    const db = await getDb();
    app.set('db', db);

    // Configure mailer
    app.set('mailer', this.mailer || nodemailer.createTransport(getConfigApi('email', 'transportConfig')));

    // Configure passport
    app = await configurePassport(app);

    // Add team & role to request
    const teamsService = new TeamsService({ db });
    const teamMembersService = new TeamMembersService({ db });
    app = await this.addTeamInfo(app, teamsService, teamMembersService);

    // Add subscription to request
    const subscriptionsService = new SubscriptionsService({ db });
    app = await this.addSubscription(app, subscriptionsService);

    // Ensure user has confirmed their email address
    app = await this.ensureConfirmedEmail(app);

    // Configure routing
    app = await this.addApiRouting(app);
    app = await this.addApi404(app);
    app = await this.addStaticRouting(app);
    app = await this.addErrorHandler(app);

    if (process.env.NODE_ENV === 'development' && process.env.LOG_ROUTES === 'log') {
      this.logRoutes(app);
    }

    app = await this.afterMiddlewareAdded(app);

    return app;
  }

  /**
   * Called before any other middleware is added, to allow for error handling middleware to be
   * initialized.
   *
   * @param {Express} app - The express app to add to.
   *
   * @return {Express}
   */
  async beforeMiddlewareAdded(app) {
    return app;
  }

  /**
   * Called after any other middleware is added, to allow for error handling middleware to be
   * finalized.
   *
   * @param {Express} app - The express app to add to.
   *
   * @return {Express}
   */
  async afterMiddlewareAdded(app) {
    return app;
  }

  /**
   * Set up basic express configuration.
   *
   * @param {Express} app - The express app to add to.
   *
   * @return {Express}
   */
  configureExpress(app) {
    app.use(pino({
      level: process.env.LOG_LEVEL || 'info',
      serializers,
      redact: getConfig('security', 'redactedLoggingPaths'),
      autoLogging: { ignorePaths: [logIgnoreRegExp] },
    }));

    app.use(bodyParser.json({
      limit: getConfig('app', 'bodyLimit'),
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      },
    }));
    app.use(bodyParser.urlencoded({
      limit: getConfig('app', 'bodyLimit'),
      extended: true,
      parameterLimit: getConfig('app', 'urlParameterLimit'),
    }));
    app.use(cookieParser());

    return app;
  }

  /**
   * Ensure user has confirmed their email before they can access the app.
   *
   * If a user is loaded, it is not a public URL, so we can then check and confirm their
   * email address confirmation.  However, the one URL we don't want to check is the one that
   * allows users to resend their confirmation email.
   *
   * @param {Express} app - The express app to add to.
   *
   * @return {Express}
   */
  ensureConfirmedEmail(app) {
    app.use((req, res, next) => {
      if (req.user && ! req.user.emailConfirmed && req.url !== '/api/users/resend-confirmation') {
        next(new Standard401Error([{
          code: ERROR_NOT_AUTHORIZED,
          title: 'You have not yet confirmed your email address.',
        }], { redirectTo: '/onboarding-email-confirm' }));
      }
      else {
        next();
      }
    });

    return app;
  }

  /**
   * Add the user's team to the request.
   *
   * ALWAYS do this, even if teams aren't "enabled", since subscription and other data is associated
   * to the team account, not the user account.  This makes it orders of magnitude easier to add
   * teams capabilities to your app later.
   *
   * @param {Express} app - The express app to add to.
   * @param {TeamsService} teamsService - The Teams service to use.
   * @param {TeamMembersService} teamMembersService - The TeamMembers service to use.
   *
   * @return {Express}
   */
  async addTeamInfo(app, teamsService, teamMembersService) {
    app.use(async (req, res, next) => {
      if (req.user) {
        // No team info in JWT means it's an old or malformed JWT and user must log in again
        if (! req.authInfo.team) {
          next(new Standard401Error([{
            code: ERROR_NOT_AUTHORIZED,
            title: 'Invalid user information, please log in again.',
          }]));
          return;
        }

        // Confirm user has not been removed from team
        await teamMembersService.valdiateTeam(
          null,
          req.authInfo.team,
          req.user.id,
          new Standard401Error([{
            code: ERROR_NOT_ON_TEAM,
            title: 'You have been removed from your team.',
          }]),
        );

        req.team = await teamsService.find(null, req.authInfo.team);
        req.role = new RoleModel({ id: req.authInfo.role });
      }

      next();
    });

    return app;
  }

  /**
   * If subscriptions are enabled, add active user's subscription details to req.
   *
   * @param {Express} app - The express app to add to.
   * @param {SubscriptionsService} service - The subscriptions service to use.
   *
   * @return {Express}
   */
  async addSubscription(app, service) {
    if (isFeatureEnabled('subscriptions')) {
      app.use(async (req, res, next) => {
        if (req.team) {
          req.subscription = await service.findUpdated(null, req.team);
        }

        next();
      });
    }

    return app;
  }

  /**
   * Adds routing for API routes defined in wood & app features.
   *
   * @param {Express} app - The express app to add routes to.
   *
   * @return {Express}
   */
  async addApiRouting(app) {
    const controllers = {};

    await Promise.all(allFeatures().map(async (name) => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const Init = require(`#features/${name}/api/init`);
      const instance = new Init();
      const featureControllers = await instance.getControllers(app);

      featureControllers.forEach((controller) => {
        controllers[controller.constructor.name] = controller;
      });
    }));

    Object.values(controllers).map((controller) => app.use(controller.prefix, controller.router));

    return app;
  }

  /**
   * Logs out the routes registered for this application.
   *
   * @param {Express} app - The express app to log routes from.
   */
  logRoutes(app) {
    const routes = this.getRoutes(app._router.stack); // eslint-disable-line no-underscore-dangle

    console.log(routes); // eslint-disable-line no-console
  }

  /**
   * Get all the routes for the app.
   *
   * @param {Array<Layer>} stack - A stack of route layers.
   *
   * @return {Array<{method: String, path: String}>}
   */
  getRoutes(stack) {
    let routes = [];

    stack.forEach((layer) => {
      if (layer.name === 'router') {
        routes = routes.concat(this.getRoutes(layer.handle.stack));
      }
      else if (layer.route) {
        Object.keys(layer.route.methods).forEach((routeMethod) => {
          routes.push({ method: routeMethod.toUpperCase(), path: layer.route.path });
        });
      }
    });

    return routes;
  }

  /**
   * Adds 404 handler for API routes. Routes not in API that aren't found are handled by static
   * routing.
   *
   * @param {Express} app - The express app to add 404 handling to.
   *
   * @return {Express}
   */
  async addApi404(app) {
    // API 404 not found
    app.use((req, res, next) => {
      if (req.url.substr(0, 4) === '/api') {
        res.status(404).json({ errors: [{ title: '404 - Not found.' }] });
      }
      else {
        next();
      }
    });

    return app;
  }

  /**
   * Adds routing for static assets and history mode (i.e. loading on anything outside of / root).
   *
   * @param {Express} app - The express app to add static asset routing to.
   *
   * @return {Express}
   */
  async addStaticRouting(app) {
    // Route to marketing site
    app.use(express.static(join(__dirname, WEB_DIR)));

    // Route to app
    const appStaticMiddleware = express.static(join(__dirname, `${APP_DIR}/ui/dist`));
    app.use('/app', appStaticMiddleware);
    app.use(history({ disableDotRule: true, verbose: true }));
    app.use(appStaticMiddleware);

    return app;
  }

  /**
   * Adds error handling to app.
   *
   * @param {Express} app - The app to add error handling to.
   *
   * @return {Express}
   */
  async addErrorHandler(app) {
    // Error handler
    app.use((err, req, res, next) => {
      // Validation errors are a known format
      if (Standard4xxErrors.includes(err.constructor.name)) {
        res.status(err.httpCode).json(err.toJSON());
        return;
      }

      if (err.constructor.name === 'PayloadTooLargeError') {
        res.status(413).json({
          errors: [{
            code: ERROR_PAYLOAD_TOO_LARGE,
            title: `Payload too large (max ${err.limit}, actual: ${err.length}.`,
          }],
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('Consider changing `bodyLimit` in `config/app.js` to accommodate larger file sizes.'); // eslint-disable-line max-len, no-console
        }

        return;
      }

      if (err.constructor.name === 'SyntaxError' && err.message.startsWith('Unexpected token')) {
        req.log.error(`Could not parse body JSON: '${req.rawBody}'.`);
        res.status(400).json({
          errors: [{
            code: ERROR_COULD_NOT_PARSE_JSON,
            title: 'Could not parse JSON in request body.',
          }],
        });

        return;
      }

      // In test mode, or if logger hasn't been added to request
      if (process.env.NODE_ENV === 'test' || ! req.log) {
        console.error(err); // eslint-disable-line no-console
      }
      else {
        req.log.error(err);
      }

      // Set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // Render the error page
      res.status(err.status || 500);
      res.send(`Error ${err.status || 500}`);

      next(err);
    });

    return app;
  }
}

module.exports = { AppBuilder };
