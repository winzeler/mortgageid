# Nodewood

### Unreleased

## Releases

### 0.20.1

- API's `startServer()` now accepts a function that can modify the server before .listen() is called.
- Moves JWT-related auth functions out of `Passport` file into their own `Jwt` file.
- Updates templates so `feature` from CLU `add` command is never pluralized.

### 0.20.0

- Removes Vue 3 compatibility mode.
- Adds `flags` to TeamModel.
- Adds `secure_flags` to UserModel and TeamModel.
- Adds `hasFlag()` to UserModel and TeamModel.
- Adds a script runner and script templates.
- Fixed an error where TeamService.count did not respect any additional options other than 'name'.
- Adds 'insertModel()' to Service.
- Add 'OutOfRangeError' to Errors.
- Uses shorter months for Recent User/Team "joined" date in admin dashboard.
- Adds a script to roll up user/team/mrr historical data.
- Updates Admin Dashboard to use rolled-up data for "Analytics" section.
- Fixes weird "blank left border" style issue on toast popups.
- Fixes warning toasts not having any style applied.
- Updates to latest version of Chart.js and vue-chart-3.
- Adds and upgrades some peer dependencies.
- Adds model name to model FIELDS definitions.
- Adds validator name to FORM_FIELDS definitions.
- Fixes bug with typing in manual state names for subscriptions.
- Fixes bug where email was not being sent to Stripe.
- Fixes bug where team name was being sent to Stripe, even with teams disabled.

### 0.19.0

- Adds responsive styles to make Nodewood mobile-friendly!
- Adds new mobile-friendly DataTable component.
- Fixes per-page number for Admin Teams not correctly interacting with search text.
- Fixes a PurgeCSS issue where classes defined in model fields were being purged unintentionally.

### 0.18.0

- Upgrades from Vue 2 to Vue 3.2 in compatibility mode.  (See Upgrade Guide.)
- Upgrades Docker base from Node 14 to Node 16.

Known issues:

- Vue 3 is running in compatibility mode.  For the most part, your Vue 2 code will run, but issue warnings where it would or could cause problems in Vue 3 standard mode.  You will want to fix or understand these warnings!  A following release of Nodewood will run Vue 3 in standard mode, so you will either need to have fixed all issues by then or manually change your app back to compatibility mode for all subsequent releases.
- There are some deprecation warnings in the console.  Most of these have been addressed, but still emit warnings for safety, and the rest will be addressed before the Vue 3 standard release.
- Many libraries have been replaced with Vue 3-compatible libraries.  (See Upgrade Guide.)

### 0.17.1

- Adds an info log at the beginning of signup. In case any steps fail and the signup is rolled back, you at least have the user's name and email address.
- Simplifies team name identification.
- Adds a simplified theming system.

### 0.17.0

- Moves logger setup earlier in application setup, so logger is available on request for earlier errors.
- Adds custom handling for JSON body parse errors.
- Adds isHtml properties for Fields, allowing them to be displayed using v-html directives.
- Adds new field: FieldEmail for email addresses.
- Changes Email field in UserModel to use a FieldEmail.
- Fixes "page" error message in ListRequestValidator.
- Adds `#lib/Config` to make it easier to load and override config settings for testing.
- Adds `isFeatureEnabled` helper function in `#lib/Config`.
- Fixes Standard401Error with incorrect signatures causing errors on failed auth.
- Adds helpful error message for `find` in Services when an Object is used (you probably want to use `findBy` in these cases).
- Fixes Service's `destroy()` not reporting the correct table when hitting an error.
- Updates `users` and `teams` sequence to start correctly when using test helpers to insert default users.
- Moves `updateCsrfToken()` to `ui/lib/xhr` so it can be used for logging in from other locations than just the ActiveUserStore.
- Adds `aliases` parameter to Validator.
- Allows you to pass an array of Validators to Controller.validate().
- Rolls back to Numbro 2.3.0 to fix currency rounding issue.
- Refactors AdminUserController's list() function to be more-easily extendable.
- Adds a "teams" attribute to UserModel.
- Populates UserModel's "teams" attribute from the AdminUsersController's list() function.
- Adds `keyValue()` function to `Model` so that the model's value for a particular key can be overridden to allow for fields that build their values from complex model attributes.
- Updates Service template and existing templates to include order parameter.
- Adds `instance` parameter to all Fields, so the instance of the model being examined is available to the fields if necessary.
- Models pass themselves to Fields as a second, `instance` parameter, to allow for late-bound calculated FieldCustoms.
- DropdownMenuItems now close their parent DropdownMenus immediately when clicked.

### 0.16.2

- Fixes warning of using 'this' in ChangeSubscriptionPage.vue template.
- Fixes regex for how to proxy requests from nginx.
- Removes extraneous variable in Store template.
- Fixes env check for logging routes.
- Fixes a bug where the wrong filename could be logged when trying to require a file that does not exist.

### 0.16.1

- Adds feature detection for form auto-submit, to not cause errors on browsers that don't support it.

### 0.16.0

- Orders admin user list in order of account creation, most-recent first.
- Automatically submits forms when Enter is pressed in TextInputs.
- Moves Home, About, and Component sample pages to `samples` feature.  (See Upgrade Guide.)
- Switches from using deprecated `VueRouter.addRoutes()` to `.addRoute()`.
- Adds and enables `eslint-plugin-promise` eslint rules.  (See Upgrade Guide.)
- Changes how Webpack Dev server is configured, enabling HMR (Hot Module Reloading).  (See Upgrade Guide.)
- Moves express configuration in AppBuilder to a function for easier overriding in app-level code.
- Moves `saveLoginCookies()` to `UsersService`.
- Adds ability to log routes on startup. (Set `NODE_ENV=development` and `LOG_ROUTES=log` in `.env`)
- Adds ability to configure max body size and url parameter limit in `config/app.js`.
- Returns standard-format errors when exceeding max body size/url parameter limit.

### 0.15.0

- Uses `name` from `config/app.js` as Application Name on sidebars.
- Modifies Nginx config to omit logging for OPTIONS requests. (See Upgrade Guide.)
- Changes webpack to polling mode for more-reliable reloads of UI on change.
- Adds special warning when migrations have not yet been run.
- Better error handling when requiring cascading files.
- Upgrades TailwindCSS to v2!  (See Upgrade Guide.)
- Upgrades a variety of packages (See Upgrade Guide).
- Fixes Webpack Bundle Analyzer plugin (see /docs/ui/#analyzing-bundle-size)

### 0.14.0

- Changes Postgres Docker container to build from Postgres image, not use it directly.
- Updates templates for `nodewood add:feature` to create a more full-featured example.

### 0.13.0

- Moves admin route protection to vue-router global navigation guard.
- Adds UI subscription capability route protection in global navigation guard.
- Fixes error in subscription capability detection.
- Removes unused ApiDocs documentation folder/scripts.
- Forces Validator to display API Errors even if field value is empty.
- Add relative flow to templates so that overlay is full-screen.
- Fixes check for subscriptions with insufficient capabilities.
- Simplifies specific inclusion of files in `app` or `wood` folder.

### 0.12.1

- Updates store fragment to use plural filename.

### 0.12.0

- Fixes unconfirmed user login redirect.
- Fixes double error message toast.
- Fixes confusing error messages when unauthorized.
- Fixes bug when some require() calls would not error/close app when failing.
- Fixes password_repeat not being redacted in logs.
- Moves code from `api`, `lib`, and `ui` up out of their `src` folders to better match all other folders in the framework.

### 0.11.1

- Moves PostCSS packages from `app` to `wood`.
- Fixes PostCSS purge configuration.
- Adds Tailwind future-proofing configuration values.
- Revert to an earlier version of numbro to fix currency formatting issues.

### 0.11.0

- Changes the default application URL to `localhost`.
- Right-aligns the user dropdown.
- Changes the default sales website serving folder to `www/dist`.

### 0.10.0

- Updates `sameSite` parameter of `csrf` and `jwt` cookies to `Strict`.
- Modifies default email config to use JSON stream transport and log emails in default configuration.
- Removes API Docker container's dependency on UI container.
- Defaults subscriptions feature to being enabled.
- Fixes subscriptions tests.
- Updates testResolver to ignore disabled app features (for reliable wood testing).
- Updates testResolver to fix application tests in new Docker setup.
- Updates .gitignore to ignore OSX litter files.
- Updates docker configuration to allow for multiple databases: development and test.
- Updates docker configuration to be run from `wood/docker` directly.
- Adds LoadingSpinner component.
- Adds sample Admin Dashboard.
- Moves application startup code from app folder to here.
- Removes container names from docker-compose file to allow for dynamic names.
- Fixes Dockerfile relative location in docker-compose file.

### 0.9.0

- Fixes error parsing in XHR when an array of errors are returned.
- Fixes updated CSRF token not being set on signup.
- Removes Ansible and Vagrant references and files.
- Exposes Docker PostgreSQL container for access from host development system.
- Sources PostgreSQL connection values from .env file.

### 0.8.5

- Fixes typo in email configuration error message.
- Adds early-access Docker development setup.

### 0.8.4

- Added `FieldCustom` field that calculates the field value with a custom function.
- Cleaned up styling on admin user list.
- Fixed issue where some clicks on TextInput labels wouldn't focus the input.
- Redesigned Create Subscription page as a much cleaner 2-column design.

### 0.8.3

- Added `.js.map` to list of requests not logged in API.
- Fixed API init so that controllers are required correctly (i.e. will require their 'app' versions if present).
- Removed default AWS email configuration, added debug error message about setting up email configuration.
- Added a pre-commit hook to prevent you from making accidental commits to the wood folder.

### 0.8.2

- API defaults to not logging JS/CSS/image file requests.
- Removed default AWS email configuration, added error message when email configuration is missing.
- Adds pre-commit hook to prevent accidental commits to "wood" folder.

### 0.8.1

- Initial beta release.
