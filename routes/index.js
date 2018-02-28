const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('home', {
    title: 'MeshRoomEx home'
  });
});

router.get('/:id', (req, res, next) => {
  res.render('index', {
    title: 'MeshRoomEx',
    id: req.params.id
  });
});

module.exports = router;

