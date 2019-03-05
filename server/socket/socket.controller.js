/* 
* @author Lloyd Williams
* Noughts and Crosses with multiplayer support using Angularjs and Nodejs
*/
'use strict';

module.exports = (_io, db) => {

  const io      = _io,
        redisDB = db;
  
  const winCombination = [
    [1,2,3], [4,5,6], [7,8,9],
    [1,4,7], [2,5,8], [3,6,9],
    [1,5,9], [3,5,7]
  ];

  /* Binary winning state examples
    111 000 000
    000 111 000
    000 000 111
    
    100 010 001
    100 010 001
    100 010 001
    
    100 001
    010 010
    001 100*/

  let resetGames = () => {
    redisDB.set('totalPlayers',0);
    redisDB.set('totalRooms',1);
    redisDB.set('allRooms', JSON.stringify({
      emptyRooms: [1],
      fullRooms : []
    }));
  }

  let allRooms      = null,
      totalPlayers  = null;

  resetGames();

  let room = 'testRoom';

  io.on('connection', (socket) => {
    console.log(socket.id + ' connected!');
    
  });

  return io;

}