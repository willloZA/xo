/* 
* @author Lloyd Williams
* Noughts and Crosses with multiplayer support using Angularjs and Nodejs
*/
'use strict';

class redisDB {
  constructor() {
    this.redis = require('redis');
  }

  connect() {
    const client = this.redis.createClient({
      host: '127.0.0.1',
      post: 6379
    });

    client.on('error', (err) => {
      console.log(`Error: ${err}`);
    });

    client.on('ready', (err) => {
      console.log('Redis Client Ready');
    });

    return client;
  }
}

module.exports = new redisDB();