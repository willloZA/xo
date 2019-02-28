const router   = require('express').Router();

//test server class routing config
router.get('/', (req,res)=>{res.send('Hello World!')});

module.exports = router;