'use strict';
const repository = require('../repository/transactions-repository');

let errors = [];

function TransactionService() {
  errors = [];
}

TransactionService.prototype.recordCreditTransaction = (transaction) => {
  return repository.saveCreditTransaction(transaction);
}

TransactionService.prototype.recordBulkCreditTransaction = (transaction) => {
  return repository.saveBulkCreditTransaction(transaction);
}

TransactionService.prototype.recordDebitTransaction = (transaction) => {
  return repository.saveDebitTransaction(transaction);
}

module.exports = TransactionService;