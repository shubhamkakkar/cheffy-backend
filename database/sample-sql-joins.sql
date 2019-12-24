/*Select orderitem deliveries*/
select o.id, o.name, o.plate_id, o.customPlateId, u.email as user, ud.email as driver  from orderitems as o inner join orderdeliveries as d on o.id=d.orderItemId inner join users as u on o.user_id=u.id inner join users as ud on d.driverId=ud.id;

/*Select user orderitem with delivery details if available*/
select o.id, o.name, o.plate_id, o.customPlateId, o.state_type as order_state, d.id as delivery_id, d.state_type as delivery_state, u.email as user, ud.email as driver
from orderitems as o left join orderdeliveries as d on o.id=d.orderItemId
left join users as u on o.user_id=u.id
left join users as ud on d.driverId=ud.id;




SELECT `Plates`.`id`, `Plates`.`name`, `Plates`.`price`, `chef`.`id` AS `chef.id`,
`chef`.`name` AS `chef.name`,
(SELECT (((acos(sin((62.3245*pi()/180))*sin(("location_lat"*pi()/180))+cos((62.3245*pi()/180))*cos(("location_lon"*pi()/180)) * cos(((-29.9273-"location_lon")*pi()/180))))*180/pi())*60*1.1515) as `chef.distance` from Users)
FROM `Plates` AS `Plates`
INNER JOIN `Users` AS `chef` ON `Plates`.`userId` = `chef`.`id` AND `chef.distance` <= 10;


SELECT `Plates`.`id`, `Plates`.`name`, `Plates`.`price`, `chef`.`id` AS `chef.id`,
`chef`.`name` AS `chef.name`, `chef`.`email` AS `chef.email`, `chef`.`imagePath` AS `chef.imagePath`,
(SELECT (((acos(sin((31.2615*pi()/180))*sin(("location_lat"*pi()/180))+cos((31.2615*pi()/180))*cos(("location_lon"*pi()/180)) * cos(((-139.8072-"location_lon")*pi()/180))))*180/pi())*60*1.1515) from Users)
AS `chef.distance`
FROM `Plates`
AS `Plates` INNER JOIN `Users` AS `chef` ON `Plates`.`userId` = `chef`.`id` AND `chef`.`distance` <= 10;



SELECT ( 3959 * acos( cos( radians(27.67891200) ) * cos( radians( location_lat ) )
      * cos( radians( location_lon ) - radians(85.34952600) ) + sin( radians(27.67891200) ) * sin(radians(location_lat)) ) )
      FROM Users;



SELECT `CustomPlate`.*, `user`.`id` AS `user.id`, `user`.`name` AS `user.name`, `user`.`imagePath` AS `user.imagePath`, `user`.`email` AS `user.email`, `user`.`country_code` AS `user.country_code`, `user`.`phone_no` AS `user.phone_no`, `user`.`location_lat` AS `user.location_lat`, `user`.`location_lon` AS `user.location_lon`, `CustomPlateAuction->CustomPlateAuctionBids`.`id` AS `CustomPlateAuction.CustomPlateAuctionBids.id`, `CustomPlateAuction->CustomPlateAuctionBids`.`chefID` AS `CustomPlateAuction.CustomPlateAuctionBids.chefID`, `CustomPlateAuction->CustomPlateAuctionBids`.`price` AS `CustomPlateAuction.CustomPlateAuctionBids.price`, `CustomPlateAuction->CustomPlateAuctionBids`.`preparation_time` AS `CustomPlateAuction.CustomPlateAuctionBids.preparation_time`, `CustomPlateAuction->CustomPlateAuctionBids`.`delivery_time` AS `CustomPlateAuction.CustomPlateAuctionBids.delivery_time`, `CustomPlateAuction->CustomPlateAuctionBids`.`chefDeliveryAvailable` AS `CustomPlateAuction.CustomPlateAuctionBids.chefDeliveryAvailable`, `CustomPlateAuction->CustomPlateAuctionBids`.`winner` AS `CustomPlateAuction.CustomPlateAuctionBids.winner`, `CustomPlateAuction->CustomPlateAuctionBids`.`createdAt` AS `CustomPlateAuction.CustomPlateAuctionBids.createdAt`, `CustomPlateImages`.`id` AS `CustomPlateImages.id`, `CustomPlateImages`.`name` AS `CustomPlateImages.name`, `CustomPlateImages`.`url` AS `CustomPlateImages.url`, `CustomPlateImages`.`createdAt` AS `CustomPlateImages.createdAt` FROM (SELECT `CustomPlate`.`id`, `CustomPlate`.`name`, `CustomPlate`.`description`, `CustomPlate`.`quantity`, `CustomPlate`.`userId`, `CustomPlate`.`price_min`, `CustomPlate`.`price_max`, `CustomPlate`.`close_date`, `CustomPlate`.`chef_location_radius`, \n      (SELECT ( 6371 * acos( cos( radians(27.67891200) ) * cos( radians( location_lat ) )\n      * cos( radians( location_lon ) - radians(85.34952600) ) + sin( radians(27.67891200) ) * sin(radians(location_lat)) ) )\n      FROM Users where Users.id = CustomPlate.userId) AS `distance`, \n      (SELECT ( 3959 * acos( cos( radians(27.67891200) ) * cos( radians( location_lat ) )\n      * cos( radians( location_lon ) - radians(85.34952600) ) + sin( radians(27.67891200) ) * sin(radians(location_lat)) ) )\n      FROM Users where Users.id = CustomPlate.userId) AS `distance`, `CustomPlateAuction`.`id` AS `CustomPlateAuction.id`, `CustomPlateAuction`.`state_type` AS `CustomPlateAuction.state_type`, `CustomPlateAuction`.`winner` AS `CustomPlateAuction.winner`, `CustomPlateAuction`.`createdAt` AS `CustomPlateAuction.createdAt` FROM `CustomPlates` AS `CustomPlate` INNER JOIN `CustomPlateAuctions` AS `CustomPlateAuction` ON `CustomPlate`.`id` = `CustomPlateAuction`.`CustomPlateId` HAVING `distance` <= \'5\' ORDER BY `distance` ASC LIMIT 0, 10) AS `CustomPlate` LEFT OUTER JOIN `Users` AS `user` ON `CustomPlate`.`userId` = `user`.`id` LEFT OUTER JOIN `CustomPlateAuctionBids` AS `CustomPlateAuction->CustomPlateAuctionBids` ON `CustomPlateAuction.id` = `CustomPlateAuction->CustomPlateAuctionBids`.`CustomPlateAuctionId` LEFT OUTER JOIN `CustomPlateImages` AS `CustomPlateImages` ON `CustomPlate`.`id` = `CustomPlateImages`.`CustomPlateId` ORDER BY `distance` ASC;
