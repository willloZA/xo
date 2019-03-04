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

  let resetRooms = () => {
    redisDB.set('totalRooms',1);
    redisDB.set('allRooms', JSON.stringify({
      emptyRooms: [1],
      fullRooms : []
    }));
  }

  let allRooms    = null,
      totalRooms  = null;

  resetRooms();

  let room = 'testRoom';

  io.on('connection', (socket) => {
    console.log(socket.id + ' connected!');
    
    socket.on('room', (room) => {
      console.log(room);
      socket.join(room);
      io.in(room).emit('message', socket.id + ' joined ' + room);
    });

    socket.on('messageRoom', (message) => {
      console.log(socket.id + ' sent ' + message);
      io.in(room).emit('message', message);
    });

  });

  return io;

}