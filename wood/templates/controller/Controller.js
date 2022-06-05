const { PrivateController } = require('#api/Controllers/PrivateController');
const { ###_PASCAL_PLURAL_NAME_###Service } = require('#features/###_FEATURE_NAME_###/api/services/###_PASCAL_PLURAL_NAME_###Service');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const {
  ###_PASCAL_NAME_###Validator,
  ###_UPPER_SNAKE_NAME_###_FORM_FIELDS,
} = require('#features/###_FEATURE_NAME_###/lib/validators/###_PASCAL_NAME_###Validator');

// Must be strings to pass validation
const DEFAULT_PAGE = '1';
const DEFAULT_PER = '20';

module.exports = class ###_PASCAL_PLURAL_NAME_###Controller extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.###_CAMEL_PLURAL_NAME_###Service = new ###_PASCAL_PLURAL_NAME_###Service({ db, mailer });

    this.router.get('/###_KEBAB_PLURAL_NAME_###', this.list.bind(this));
    this.router.post('/###_KEBAB_PLURAL_NAME_###', this.create.bind(this));
    this.router.put('/###_KEBAB_PLURAL_NAME_###/:id(\\d+)', this.update.bind(this));
    this.router.delete('/###_KEBAB_PLURAL_NAME_###/:id(\\d+)', this.delete.bind(this));
  }

  /**
   * @api {get} /###_KEBAB_PLURAL_NAME_### Get a list of all ###_PLURAL_NAME_###
   * @apiGroup ###_PASCAL_NAME_###
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

      const count = await this.###_CAMEL_PLURAL_NAME_###Service.count(tx, {});
      const pages = Math.max(1, Math.ceil(count / per));
      const ###_CAMEL_PLURAL_NAME_### = await this.###_CAMEL_PLURAL_NAME_###Service.getSearchPage(
        tx,
        {
          search,
          page: Math.min(page, pages),
          per,
        },
      );

      res.json({
        data: { ###_CAMEL_PLURAL_NAME_### },
        meta: { pages },
      });
    });
  }

  /**
   * @api {post} /###_KEBAB_PLURAL_NAME_### Create a new ###_SINGULAR_NAME_###
   * @apiGroup ###_PASCAL_NAME_###
   * @apiName Create
   */
  async create(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new ###_PASCAL_NAME_###Validator(###_UPPER_SNAKE_NAME_###_FORM_FIELDS));

      const ###_CAMEL_NAME_### = await this.###_CAMEL_PLURAL_NAME_###Service.insert(
        tx,
        { name: req.body.name },
        ###_UPPER_SNAKE_NAME_###_FORM_FIELDS,
      );

      res.json({ data: { ###_CAMEL_NAME_### } });
    });
  }

  /**
   * @api {get} /###_KEBAB_PLURAL_NAME_### Update a ###_SINGULAR_NAME_###
   * @apiGroup ###_PASCAL_NAME_###
   * @apiName Update
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new ###_PASCAL_NAME_###Validator(###_UPPER_SNAKE_NAME_###_FORM_FIELDS));

      await this.###_CAMEL_PLURAL_NAME_###Service.update(tx, req.params.id, req.body, ###_UPPER_SNAKE_NAME_###_FORM_FIELDS);

      res.sendStatus(204);
    });
  }

  /**
   * @api {delete} /###_KEBAB_PLURAL_NAME_### Delete a ###_SINGULAR_NAME_###
   * @apiGroup ###_PASCAL_NAME_###
   * @apiName Delete
   */
  async delete(req, res) {
    await this.withTransaction(async (tx) => {
      await this.###_CAMEL_PLURAL_NAME_###Service.delete(tx, req.params.id);

      res.sendStatus(204);
    });
  }
};
