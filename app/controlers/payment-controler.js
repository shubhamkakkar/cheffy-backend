"use strict";
var HttpStatus = require('http-status-codes');
const authService = require("../services/auth");
const repositoryOrder = require("../repository/order-repository");
const paymentService = require('../services/payment');
const { OrderItem, User } = require('../models/index');
const paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox',
  'client_id': 'AX0rIM3otenMBgA2oLXLs0OmV1WsJxNTYOjXoML5J1yv-qe_g6Bj_9pPhQ-dW6PQ5EShQSadLF-UxRNj',
  'client_secret': 'ELJGz7y4lKWoRVPdrnxfqUt0NOvFucR9w6_6iGkNVFn7HyBL0QCSYDqwRLrBCPIoOnlHzfSAoAD8EN9f'
});
// claudinho1963@hotmail.com
// @Jcsneaa69cpxy2
let payment_object = {
  "intent": "sale",
  "payer": {
      "payment_method": "paypal"
  },
  "redirect_urls": {
      "return_url": "http://localhost:9000/payment/paypal/callback",
      "cancel_url": "http://localhost:9000/payment/paypal/cancel"
  },
  "transactions": []
};

const generateObjectPayment = async (order, orderItens) => {
  payment_object.transactions.push(
    {
      "item_list": {
          "items": []
      },
      "amount": {
          "currency": "BRL",
          "total": order.order_total.toString()
      },
      "description": order.id
    }
  );
  orderItens.map(item =>{
    payment_object.transactions[0].item_list.items.push({
      "name": item.name,
      "sku": item.id,
      "price": item.amount.toString(),
      "currency": "BRL",
      "quantity": item.quantity.toString()
    });
  });

  return payment_object;
};

exports.startPaymentPaypal = async (req, res, next) => {
  const { orderId } = req.params;

  const token_return = await authService.decodeToken(req.headers['x-access-token']);
  const user_data = await repositoryOrder.user(token_return.id);

  if (!user_data) {
    res.status(HttpStatus.CONFLICT).send({ message: "Fail to get user data!", error: true });
    return 0;
  }

  const order = await repositoryOrder.getById(orderId);
  const orderItens = await OrderItem.findAll({ where: { orderId } });

  const payment_obj = await generateObjectPayment(order, orderItens);

  await paypal.payment.create(payment_obj, (error, payment) => {
    if (error) {
      console.log(error)
      res.status(HttpStatus.CONFLICT).send({ message: 'Tudo errado!', status: HttpStatus.CONFLICT});
      return 0;
    } else {
      const approvalUrl = payment.links.find(link => link.rel === 'approval_url').href;
      res.redirect(approvalUrl); 
      return 0;
    }
  });
}

exports.callback = async (req, res, next) => {
  res.render('confirmScreen.html', { ...req.query })
}

exports.cancel = async (req, res, next) => {
  console.log(req.query)
  console.log(req.body)
}

exports.confirm = async (req, res, next) => {
  const { paymentId, PayerID } = req.body;
  await paypal.payment.execute(
    paymentId,
    { payer_id: PayerID },
    async (error, payment) => {
      if (error) {
        res.status(HttpStatus.CONFLICT).send({ message: 'Tudo errado!', status: HttpStatus.CONFLICT});
      } else {
        const current = await repositoryOrder.getById(payment.transactions[0].description);
        current.state_type = 5;
        await current.save();
        res.status(HttpStatus.ACCEPTED).send({ message: { current, payment }, status: HttpStatus.CONFLICT});
      }
    }
  )
}
