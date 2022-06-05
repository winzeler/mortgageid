const { PrivateController } = require('#api/Controllers/PrivateController');
const { VeridaConnectsService } = require('#features/verida-connect/api/services/VeridaConnectsService');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const {
  VeridaConnectValidator,
  VERIDA_CONNECT_FORM_FIELDS,
} = require('#features/verida-connect/lib/validators/VeridaConnectValidator');

// Must be strings to pass validation
const DEFAULT_PAGE = '1';
const DEFAULT_PER = '20';

module.exports = class VeridaConnectsController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.veridaConnectsService = new VeridaConnectsService({ db, mailer });

    this.router.get('/verida-connects', this.list.bind(this));
    this.router.post('/verida-connects', this.create.bind(this));
    this.router.put('/verida-connects/:id(\\d+)', this.update.bind(this));
    this.router.delete('/verida-connects/:id(\\d+)', this.delete.bind(this));
  }

  /**
   * @api {get} /verida-connects Get a list of all veridaConnects
   * @apiGroup VeridaConnect
   * @apiName List
   */
  async list(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.query, new ListRequestValidator());

      const {
        page = DEFAULT_PAGE,
        per = DEFAULT_PER,
        search = '',
      } = req.query;

      const count = await this.veridaConnectsService.count(tx, {});
      const pages = Math.max(1, Math.ceil(count / per));
      const veridaConnects = await this.veridaConnectsService.getSearchPage(
        tx,
        {
          search,
          page: Math.min(page, pages),
          per,
        },
      );

      res.json({
        data: { veridaConnects },
        meta: { pages },
      });
    });
  }

  /**
   * @api {post} /verida-connects Create a new veridaConnect
   * @apiGroup VeridaConnect
   * @apiName Create
   */
  async create(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new VeridaConnectValidator(VERIDA_CONNECT_FORM_FIELDS));

      const veridaConnect = await this.veridaConnectsService.insert(
        tx,
        { name: req.body.name },
        VERIDA_CONNECT_FORM_FIELDS,
      );

      res.json({ data: { veridaConnect } });
    });
  }

  /**
   * @api {get} /verida-connects Update a veridaConnect
   * @apiGroup VeridaConnect
   * @apiName Update
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new VeridaConnectValidator(VERIDA_CONNECT_FORM_FIELDS));

      await this.veridaConnectsService.update(tx, req.params.id, req.body, VERIDA_CONNECT_FORM_FIELDS);

      res.sendStatus(204);
    });
  }

  /**
   * @api {delete} /verida-connects Delete a veridaConnect
   * @apiGroup VeridaConnect
   * @apiName Delete
   */
  async delete(req, res) {
    await this.withTransaction(async (tx) => {
      await this.veridaConnectsService.delete(tx, req.params.id);

      res.sendStatus(204);
    });
  }
};
