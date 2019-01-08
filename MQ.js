const config = require('config');
const amqp = require('amqplib/channel_api');
const logger = require('custom-logger');
class MQ {
    constructor() {
        this.connection = null;
        this.connectionResolver = null;
    }

    async connect() {
        if (this.connection && this.channel) {
            return;
        }
        return new Promise(async resolve => {
            let isNotFirst = true;
            if(!this.connectionResolver) {
                isNotFirst = false;
                this.connectionResolver = resolve;
            }
            try {
                this.connection = await amqp.connect(config.amqp.uri);
            } catch(e) {
                logger.error(e);
                setTimeout(this.connect.bind(this), config.amqp.reconnectTimeout);
                if(isNotFirst) {
                    resolve();
                }
                return;
            }
            this.channel = await this.connection.createChannel();
            this.channel.once('close', async () => { 
                this.connection = null;
                this.channel = null;
                this.connectionResolver = null;
                await this.connect();
            });
            if (typeof this.connectionResolver === 'function') {
                this.connectionResolver();
            }
            this.connectionResolver = null;
        });
    }

    async assertConnection() {
        await this.connect();
        await this.channel.assertQueue(queue, { durable: true, exclusive: false });
    }

    async publish(queue, message) {
        await this.assertConnection();
        await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    }

    async subscribe(queue, fn) {
        await this.assertConnection();
        await this.channel.consume(queue, fn);
    }
}

module.exports = new MQ();