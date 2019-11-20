const {sequelize, Transactions} = require('../models/index')
const Validator = require('../services/validator')

exports.saveTransaction = async (type, identifier, userId, orderPaymentId, orderItemId, amount) => {
    const validator = new Validator()

    validator.isRequired(type,"You must inform the type of this transaction (D)ebit or (C)redit")
    validator.isRequired(identifier,"Identifier is required")
    validator.isRequired(userId,"User id is required")

    if (!validator.isValid()) {
        let error = contract.errors()
        throw Error(`These fields are necessary for create a transaction ${error}`)
        return false;
      }
    
    let data = {
      entry_type:type,
      identifier:identifier,
      userId:userId,
      orderPaymentId:orderPaymentId,
      orderItemId:orderItemId,
      amount:amount
    }

    try {
      let createdTransaction = Transactions.create(data);  
      return createdTransaction;
    } catch (error) {
      var e = contract.errors()
      throw Error(`An error has occurred while saving a Transaction: ${e}`)
      return false;      
    }
    
    return false;

}



exports.saveCreditTransaction = async (transaction) => {
  const validator = new Validator()
  let identifier, userId, orderPaymentId, orderItemId, amount;

  identifier = transaction.identifier;
  userId = transaction.userId;
  orderId = transaction.orderId;
  orderPaymentId = transaction.orderPaymentId;
  orderItemId = transaction.orderItemId;

  validator.isRequired(identifier,"Identifier is required")
  validator.isRequired(userId,"User id is required")

  if (!validator.isValid()) {
      let error = contract.errors()
      throw Error(`These fields are necessary for create a transaction ${error}`)
      return false;
    }
  
  let data = {
    entry_type:'C',
    identifier:identifier,
    userId:userId,
    orderId:orderId,
    orderPaymentId:orderPaymentId,
    orderItemId:orderItemId,
    amount:amount
  }

  try {
    let createdTransaction = Transactions.create(data);  
    return createdTransaction;
  } catch (error) {
    var e = contract.errors()
    throw Error(`An error has occurred while saving a Transaction: ${e}`)
    return false;      
  }
  
  return false;

}

exports.saveBulkCreditTransaction = async (bulkTransactions) => {
  const validator = new Validator()

  try {
    let createdTransaction = Transactions.bulkCreate(bulkTransactions);  
    return createdTransaction;
  } catch (error) {
    let e = contract.errors()
    throw Error(`An error has occurred while saving a Transaction: ${e}`)
    return false;      
  }
  
  return false;

}

exports.saveDebitTransaction = async (transaction) => {

  const validator = new Validator()
  let identifier, userId, orderPaymentId, orderItemId, amount;

  identifier = transaction.identifier;
  userId = transaction.userId;
  orderId = transaction.orderId;
  orderPaymentId = transaction.orderPaymentId;
  orderItemId = transaction.orderItemId;

  validator.isRequired(identifier,"Identifier is required")
  validator.isRequired(identifier,"User id is required")

  if (!validator.isValid()) {
      var e = contract.errors()
      throw Error(`These fields are necessary for create a transaction ${e}`)
      return false;
    }
  
  let data = {
    entry_type:'D',
    identifier:identifier,
    userId:userId,
    orderId:orderId,
    orderPaymentId:orderPaymentId,
    orderItemId:orderItemId,
    amount:amount
  }

  try {
    let createdTransaction = Transactions.create(data);  
    return createdTransaction;
  } catch (error) {
    var e = contract.errors()
    throw Error(`An error has occurred while saving a Transaction: ${e}`)
    return false;      
  }
  
  return false;

}