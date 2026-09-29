const { Router } = require('express');
const loanController = require('../controllers/loan.controller');

const router = Router();

router
  .route('/')
  .get(loanController.list)
  .post(loanController.create);

router.patch('/:id/return', loanController.markReturned);

router
  .route('/:id')
  .get(loanController.detail)
  .put(loanController.replace)
  .patch(loanController.patch)
  .delete(loanController.destroy);

module.exports = router;
