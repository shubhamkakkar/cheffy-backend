/*Select orderitem deliveries*/
select o.id, o.name, o.plate_id, o.customPlateId, u.email as user, ud.email as driver  from orderitems as o inner join orderdeliveries as d on o.id=d.orderItemId inner join users as u on o.user_id=u.id inner join users as ud on d.driverId=ud.id;

/*Select user orderitem with delivery details if available*/
select o.id, o.name, o.plate_id, o.customPlateId, o.state_type as order_state, d.id as delivery_id, d.state_type as delivery_state, u.email as user, ud.email as driver
from orderitems as o left join orderdeliveries as d on o.id=d.orderItemId
left join users as u on o.user_id=u.id
left join users as ud on d.driverId=ud.id;
