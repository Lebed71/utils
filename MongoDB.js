const EventEmitter = require('events');
const mongoose = require('mongoose');
const { database } = require('config');

mongoose.set('debug', process.env.MONGOOSE_DEBUG === 'true'
    ? (collection, method, query, doc, options = {}) => console.log(
        `db.${collection}.${method}(${JSON.stringify(query)}, ${JSON.stringify(doc)}, ${JSON.stringify(options)})`
    )
    : false);

let connectFn = null;

class Database extends EventEmitter {
    constructor() {
        super();

        // Create connection
        this.connect();

        // Connection instance
        this.db = mongoose.connection;

        // Callbacks
        this.db.on('error', error => console.error('connection error', error));
        this.db.on('disconnected', () => console.error('disconnected'));
        this.db.on('reconnected', () => console.warn('reconnected'));
        this.db.on('open', () => console.info('connected'));

        // Return connection instance
        return mongoose.connection;
    }

    connect() {
        connectFn(mongoose);
    }

    static setConnector(fn) {
        connectFn = fn;
    }
}

Database.setConnector(db => db.connect(database.uri, {
    promiseLibrary: Promise,
    poolSize: 10,
    ...database.options,
    useNewUrlParser: true
}));

module.exports = Database;
