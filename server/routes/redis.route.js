module.exports = (db) => {
  const router   = require('express').Router();

  //test db connection persists
  db.get('foo', (err, res) => {
    console.log(res);
  });

  //test server class routing config
  router.get('/', (req,res)=>{res.send('Hello World!')});

  return router;
}