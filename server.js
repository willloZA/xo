/* 
* @author Lloyd Williams
* Noughts and Crosses with multiplayer support using Angularjs and Nodejs
*/
'use strict';

const express     = require('express'),
      http        = require('http'),
      bodyParser  = require('body-parser'),
      cors        = require('cors'),
      socketio    = require('socket.io');

// remember to install redis-server and run
const redisDB     = require('./server/db/redis.connect').connect();

// test data
// redisDB.set('foo','bar');

const redisRoute  = require('./server/routes/redis.route')(redisDB);

class Server{
  constructor() {
    this.port   = process.env.PORT || 8000;
    this.host   = 'localhost';

    this.app    = express();
    this.http   = http.Server(this.app);
    this.socket = socketio(this.http);
  }

  appConfig() {
    this.app.use(bodyParser.json());
    this.app.use(cors());
  }

  applyRoutes() {
    this.app.use(redisRoute);
  }

  appStart() {
    this.appConfig();
    this.applyRoutes();

    this.http.listen(this.port, this.host, () => {
      console.log(`Listening on http://${this.host}:${this.port}`);
    });
  }
}

const app = new Server();
app.appStart();