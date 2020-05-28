users
1. james
2. adam
3. chris
4. newton

chefs:
4. gordon
5. almazan
6. sanjeev

driver:
6. nicky
7. cook

plates (chefId)
1. french fries, (4) - $1.5, chefDeliveryAvailable: false
2. burger(4), (3.5$) chefDeliveryAvailable:true
3. chicken wings(5) - $2.5, chefDeliveryAvailable: false
4. ramen noodles(5) - 6$, chefDeliveryAvailable: true

James want to eat fresh fries(1) and chicken wings(3).

adam wants to eat french fries(1) and  burger (2)

chris wants to eat ramen noodles(4)


record is added in table basketItems
basketitems
—————
1. userId: 1, plateId: 1, basket_type: plate
2. userId: 1, plate: 3, basket_type: plate
3. userId: 2, plateId: 1, basket_type: plate
4. userId: 2, plateId: 2, basket_type: plate
5. userId: 3, plateId: 4, basket_type: plate

Items in the cart belong to multiple chef for some user basket

Now user orders the basket by checking out, paying from card

record is added in order table and orderitems table. basketitems would be removed.

order
———
1. userId: 1, shippingId: 1, state_type: pending, total_items: 2, shipping_fee: 0, order_total:4$
2. userId: 2, shippingId: 2, state_type:pending, total_items: 2, shipping_fee: 0, order_total: 5$
3. userId: 3, shippingId: 3, state_type: pending, total_items: 1, shipping_fee:0, order_total: 6$

orderitems
———
1. userId: 1,  chef_id: 4, orderId: 1, plateId: 1, item_type: plate, price: 1.5$, quantity: 1
2. userId: 1, chef_id: 5,  orderId: 1, plateId: 3, item_type: plate, price: 2.5$, quantity: 1
3. userId:2, chef_id: 4, orderId: 2, plateId: 1, item_type: plate, price: 1.5$, quantity: 1
4. userId: 2, chef_id: 4,  orderId: 2, plateId: 2, item_type: plate, price: 3.5$, quantity: 1
5. userId: 3, chef_id: 5, orderId: 3, plateId: 4, item_type: plate, price: 6$, quantity: 1



Case Chef Delivery:
Order deliveries is created for plates that have chefDeliveryAvailable set to true. In this case only burger and ramen noodles are available for delivery by chef
So two order deliveries are created. orderitems 1,2,3 are left for drivers to create delivery or user pickup if no option is found


orderdelivery
—————
1. orderItemId: 4, driverId: 4, delivery_type: order_item, state_type: pending
2. orderItemId: 5, driverId: 5, delivery_type: order_item, state_type: pending


They both accept the orderdelivery
1. orderItemId: 4, driverId: 4, delivery_type: order_item, state_type: picked_up
2. orderItemId: 5, driverId: 5, delivery_type: order_item, state_type: picked_up


They reach James one by one
1. orderItemId: 4, driverId: 4, delivery_type: order_item, state_type: delivered
2. orderItemId: 5, driverId: 5, delivery_type: order_item, state_type: delivered




Case Driver Delivery:
order #1(with two orderitems 1,2), and orderitem 3 of order #2 are still left to pick


orderdelivery is created
orderdelivery
————
1. orderId: 1, driverId: 6, state_type: pending, order_delivery_type: order,
2. orderItemId: 3, driverId: 7, state_type: pending, order_delivery_type: orderitem


Nicky accepts his orderdelivery, cook accepts orderitem delivery
orderdelivery
——
1. orderId: 1, driverId: 6, state_type: approved, order_delivery_type: order
2. orderItemId: 3, driverId: 7, state_type: approved, order_delivery_type: orderitem

Nicky picks up both orderitems(1,2) from 2 chefs and updates the status to picked_up
So does cook. He picks up one orderitem(3) from one chef and updates the status to picked_up
orderdelivery
——
1. orderId: 1, driverId: 6, state_type: picked_up, order_delivery_type: order
2. orderItemId: 3, driverId: 7, state_type: picked_up, order_delivery_type: orderitem

Finally Nicky reaches the hungry user James.
Cook reaches user chris
orderdelivery
——
1. orderId: 1, driverId: 6, state_type: delivered, order_delivery_type: order
2. orderItemId: 3, driverId: 7, state_type: delivered, order_delivery_type: orderitem
