const { PrivateController } = require('#api/Controllers/PrivateController');
const { VconnectsService } = require('#features/vconnect/api/services/VconnectsService');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const {
  VconnectValidator,
  VCONNECT_FORM_FIELDS,
} = require('#features/vconnect/lib/validators/VconnectValidator');

// Must be strings to pass validation
const DEFAULT_PAGE = '1';
const DEFAULT_PER = '20';

module.exports = class VconnectsController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.vconnectsService = new VconnectsService({ db, mailer });

    this.router.get('/vconnects', this.list.bind(this));
    this.router.post('/vconnects', this.create.bind(this));
    this.router.put('/vconnects/:id(\\d+)', this.update.bind(this));
    this.router.delete('/vconnects/:id(\\d+)', this.delete.bind(this));
  }

  /**
   * @api {get} /vconnects Get a list of all vconnects
   * @apiGroup Vconnect
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

      const count = await this.vconnectsService.count(tx, {});
      const pages = Math.max(1, Math.ceil(count / per));
      const vconnects = await this.vconnectsService.getSearchPage(
        tx,
        {
          search,
          page: Math.min(page, pages),
          per,
        },
      );

      res.json({
        data: { vconnects },
        meta: { pages },
      });
    });
  }

  /**
   * @api {post} /vconnects Create a new vconnect
   * @apiGroup Vconnect
   * @apiName Create
   */
  async create(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new VconnectValidator(VCONNECT_FORM_FIELDS));

      const vconnect = await this.vconnectsService.insert(
        tx,
        { name: req.body.name },
        VCONNECT_FORM_FIELDS,
      );

      res.json({ data: { vconnect } });
    });
  }

  /**
   * @api {get} /vconnects Update a vconnect
   * @apiGroup Vconnect
   * @apiName Update
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new VconnectValidator(VCONNECT_FORM_FIELDS));

      await this.vconnectsService.update(tx, req.params.id, req.body, VCONNECT_FORM_FIELDS);

      res.sendStatus(204);
    });
  }

  /**
   * @api {delete} /vconnects Delete a vconnect
   * @apiGroup Vconnect
   * @apiName Delete
   */
  async delete(req, res) {
    await this.withTransaction(async (tx) => {
      await this.vconnectsService.delete(tx, req.params.id);

      res.sendStatus(204);
    });
  }
};
