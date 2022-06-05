const { PrivateController } = require('#api/Controllers/PrivateController');
const { CreditsService } = require('#features/credit/api/services/CreditsService');
const { ListRequestValidator } = require('#api/ListRequestValidator');
const {
  CreditValidator,
  CREDIT_FORM_FIELDS,
} = require('#features/credit/lib/validators/CreditValidator');
const { Client, EnvironmentType } = require('@verida/client-ts');
const { AutoAccount } = require('@verida/account-node');
const ethers = require('ethers');
// const { log } = require('#cli/Log');

// import { Client, EnvironmentType } from '@verida/client-ts'
// import { AutoAccount } from '@verida/account-node'

// Must be strings to pass validation
const DEFAULT_PAGE = '1';
const DEFAULT_PER = '20';

const VERIDA_ENVIRONMENT = EnvironmentType.TESTNET
const CONTEXT_NAME = process.env.CONTEXT_NAME;
// const VERIDA_TESTNET_DEFAULT_SERVER = process.env.VERIDA_TESTNET_DEFAULT_SERVER;
const VERIDA_TESTNET_DEFAULT_SERVER = 'https://db.testnet.verida.io:5002/';

const mnemonic = process.env.MNEMONIC;

const DEFAULT_ENDPOINTS = {
  defaultDatabaseServer: {
      type: 'VeridaDatabase',
      endpointUri: 'https://db.testnet.verida.io:5002/'
  },
  defaultMessageServer: {
      type: 'VeridaMessage',
      endpointUri: 'https://db.testnet.verida.io:5002/'
  },
};

const DID_SERVER_URL =  'https://dids.testnet.verida.io:5001';

module.exports = class CreditsController extends PrivateController {
  /**
   * Constructor.
   *
   * @param {MassiveJS} db - The MassiveJS db connection.
   * @param {Mailer} mailer - The mailer.
   */
  constructor({ db, mailer } = {}) {
    super({ db, mailer });

    this.creditsService = new CreditsService({ db, mailer });

    this.router.get('/credits', this.list.bind(this));
    this.router.post('/credits', this.create.bind(this));
    this.router.put('/credits/:id(\\d+)', this.update.bind(this));
    this.router.delete('/credits/:id(\\d+)', this.delete.bind(this));
  }

  /**
   * @api {get} /credits Get a list of all credits
   * @apiGroup Credit
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

      const count = await this.creditsService.count(tx, {});
      const pages = Math.max(1, Math.ceil(count / per));
      const credits = await this.creditsService.getSearchPage(
        tx,
        {
          search,
          page: Math.min(page, pages),
          per,
        },
      );

      res.json({
        data: { credits },
        meta: { pages },
      });
    });
  }

  /**
   * @api {post} /credits Create a new credit
   * @apiGroup Credit
   * @apiName Create
   */
  async create(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new CreditValidator(CREDIT_FORM_FIELDS));

      let mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);

      // console.log('mnemonic successful ' + mnemonicWallet?.privateKey); // eslint-disable-line no-console
      console.log('VERIDA_TESTNET_DEFAULT_SERVER = ' + VERIDA_TESTNET_DEFAULT_SERVER); // eslint-disable-line no-console

      // establish a network connection
      const client = new Client({
        environment: VERIDA_ENVIRONMENT
      });

      // create a Verida account instance that wraps the authorized Verida DID server connection
      // The `AutoAccount` instance will automatically sign any consent messages
      const account = new AutoAccount({
        defaultDatabaseServer: {
            type: 'VeridaDatabase',
            endpointUri: VERIDA_TESTNET_DEFAULT_SERVER
        },
        defaultMessageServer: {
            type: 'VeridaMessage',
            endpointUri: VERIDA_TESTNET_DEFAULT_SERVER
        }
      }, {
        privateKey: mnemonicWallet?.privateKey,
        didServerUrl: DID_SERVER_URL
      });

      // Connect the Verida account to the Verida client
      await client.connect(account);

      // Open an application context (forcing creation of a new context if it doesn't already exist)
      const context = await client.openContext(CONTEXT_NAME, true);

      // Open a database
      const database = await context.openDatabase('credit_scores');

      const item = await database.save({
        score: req.body.name
      });
      console.log(item);

      if (item?.ok == true) {

        delete item.ok;
        item['score'] = req.body.name;

        let itemJson = JSON.stringify(item);
    
        // const items = await database.getMany();
        // console.log(items);
        
        const credit = await this.creditsService.insert(
          tx,
          // { name: req.body.name },
          { name: itemJson },
          CREDIT_FORM_FIELDS,
        );

        res.json({ data: { credit } });

      }
 
      // console.log(res); // eslint-disable-line no-console
    });
  }

  /**
   * @api {get} /credits Update a credit
   * @apiGroup Credit
   * @apiName Update
   */
  async update(req, res) {
    await this.withTransaction(async (tx) => {
      this.validate(req.body, new CreditValidator(CREDIT_FORM_FIELDS));

      await this.creditsService.update(tx, req.params.id, req.body, CREDIT_FORM_FIELDS);

      res.sendStatus(204);
    });
  }

  /**
   * @api {delete} /credits Delete a credit
   * @apiGroup Credit
   * @apiName Delete
   */
  async delete(req, res) {
    await this.withTransaction(async (tx) => {
      await this.creditsService.delete(tx, req.params.id);

      res.sendStatus(204);
    });
  }
};
