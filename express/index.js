const http = require('http');

const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const { NotFoundError } = require('./lib/errors');

(async () => {
    const host = process.env.APP_HOST || config.server.host;
    const port = process.env.APP_PORT || config.server.port;

    const app = express();

    app.use(bodyParser.json());

    app.use(
        methodOverride('_method'),
        methodOverride('X-HTTP-Method'),
        methodOverride('X-HTTP-Method-Override'),
        methodOverride('X-Method-Override'),
    );

    app.use(require('./routes'));

    app.use(
        (req, res, next) => next(new NotFoundError('route not found')),
        (err, req, res, next) => {
            console.log(err);
            res.status(err.status || 502);
            res.send(err);
        }
    );

    const server = http.createServer(app)
        .listen(
            port,
            host,
            () => console.log(`Worker ${process.pid} started ${host}:${port}`)
        );

    server.on('connection', socket => socket.setNoDelay());
})()
    .catch((e) => {
        console.log(e);
        process.exit(1);
    });
