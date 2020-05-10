'use strict';
const path = require('path');
const {
	OrderFrequency,
	Basket,
	BasketItem,
	Plates,
	CustomPlate,
	CustomPlateOrder,
	User,
	ShippingAddress,
	PlateImage,
} = require('../models/index');
const userConstants = require(path.resolve('app/constants/users'));
const Sequelize = require('sequelize');
const repositoryShip = require(path.resolve(
	'app/repository/shipping-repository'
));
const Op = Sequelize.Op;
const _ = require('underscore');

exports.getOrCreateUserBasket = async (userId) => {
	const basket = await Basket.findOrCreate({
		defaults: {
			userId: userId,
		},
		where: { userId: userId },
	});
	return basket;
};

exports.getOneUserBasket = async (userId) => {
	const basket = await Basket.findOne({ where: { userId: userId } });
	return basket;
};

/**
 * get plate from baske-item
 * there will be only one unique plate in the basket
 */
exports.getBasketItemsPlate = async (basketId, plateId) => {
	const basket = await BasketItem.findOne({
		where: { basketId: basketId, plateId: plateId },
	});
	return basket;
};

exports.getBasketItemsCustom = async (data, id) => {
	const basket = await BasketItem.findAll({
		where: { basketId: data, customPlateId: id },
	});
	return basket;
};

exports.getBasketItems = async (basketId) => {
	const basketItems = await BasketItem.findAll({
		where: { basketId: basketId },
	});
	return basketItems;
};

/**
 * Get basketItem by id
 */
exports.getSingleBasketItem = async (basketItemId) => {
	const basketItem = await BasketItem.findByPk(basketItemId);
	return basketItem;
};

/**
 * Destory BasketItem
 * basketItem -> instance
 */
exports.deleteBasketItem = async (basketItem) => {
	return await basketItem.destroy();
};

/**
 * Remove basket items related to basketId
 */
exports.removeBasketItems = async (basketId) => {
	return await BasketItem.destroy({ where: { basketId: basketId } });
};

/**
 * subtract 1 quantity from basketItem
 * basketItem -> instance
 */
exports.subtractBasketItem = async (basketItem) => {
	const item = await basketItem.decrement('quantity', { by: 1 });
	if (item.quantity > 0) {
		return item;
	}

	await item.destroy();

	return {
		message: 'Item removed from cart!',
		error: false,
	};
};

/**
 * add 1 quantity to basketItem
 * basketItem -> instance
 */
exports.addBasketItem = async (basketItem) => {
	return await basketItem.increment('quantity', { by: 1 });
};
/*
duplicate definition
exports.getBasketItems = async (data, quant) => {
  let basket = await BasketItem.findByPk(data);
  let ammount = quant || 1;
  basket.quantity = parseInt(basket.quantity + ammount)
  await basket.save();
  return basket;
}
*/
exports.createBasketItem = async (data) => {
	try {
		const basket = await BasketItem.create({ ...data });
		return basket;
	} catch (e) {
		console.log(e);
	}
};

exports.delBasketItem = async (data) => {
	try {
		const basket = await BasketItem.destroy({
			where: { id: data },
		});
		return basket;
	} catch (e) {
		console.log(e);
	}
};

//deprecated
//use getBasketItemsDetail
exports.listBasket = async (data) => {
	let existBasket = await Basket.findByPk(data, {
		attributes: [],
		include: [
			{
				model: BasketItem,
				attributes: [
					'id',
					'quantity',
					'plateId',
					'customPlateId',
					'basket_type',
					'note',
				],
				include: [
					{
						model: Plates,
						as: 'plate',
						attributes: [
							'id',
							'name',
							'description',
							'price',
							'delivery_time',
							'userId',
						],
					},
					//added custom plate in listBasket as well
					{
						model: CustomPlateOrder,
						as: 'custom_plate',
						attributes: [
							'id',
							'name',
							'description',
							'userId',
							'price',
						],
					},
				],
			},
		],
	});
};

exports.listBasketCustom = async (data) => {
	try {
		let existBasket = await Basket.findByPk(data, {
			attributes: [],
			include: [
				{
					model: BasketItem,
					attributes: ['id', 'quantity'],
					include: [
						{
							model: CustomPlateOrder,
							as: 'custom_plate',
							attributes: [
								'id',
								'name',
								'description',
								'userId',
								'price',
							],
						},
					],
				},
			],
		});
		return existBasket;
	} catch (e) {
		console.log('Error: ', e);
		return { message: 'Fail to get your Basket!', error: e };
	}
};

/**
 * Get Basket Items in detail
 * both plates and custom plate orders
 */
exports.getBasketItemsDetail = async (basketId) => {
	
	let existBasket = await BasketItem.findAll({
		where: { basketId: basketId },
		attributes: [
			'id',
			'quantity',
			'plateId',
			'customPlateId',
			'basket_type',
			'note',
		],
		include: [
			{
				model: Plates,
				as: 'plate',
				attributes: [
					'id',
					'name',
					'description',
					'price',
					'delivery_time',
					'chefDeliveryAvailable',
					'userId',
				],
				include: [
					{
						model: PlateImage,
					},
					{
						model: User,
						as: 'chef',
						attributes: userConstants.userSelectFields,
						required: true,
						include: [
							{
								model: ShippingAddress,
								as: 'address',
								required: true
							},
						],
					},
				],
			},
			//added custom plate in listBasket as well
			//TODO may be we should name as custom_plate_order. it would be confused with the actual custom_plate table
			{
				model: CustomPlateOrder,
				as: 'custom_plate',
				attributes: [
					'id',
					'name',
					'description',
					'price',
					'userId',
					'chefID',
					'chefDeliveryAvailable',
				],
				include: [
					{
						model: User,
						as: 'chef',
						attributes: userConstants.userSelectFields,
						required: true,
						include: [
							{
								model: ShippingAddress,
								as: 'address',
								required: true
							},
						],
					},
				],
			},
		],
	});

	//need atleast 1 in backetItem

	return existBasket.filter(item => item.plate || item.custom_plate);
};

exports.peopleAlsoAddedList = async (plateId) => {
	let list = OrderFrequency.findAll({
		where: {
			[Op.or]: [{ plate1: plateId }, { plate2: plateId }],
		},
		attributes: [],
		include: [
			{
				model: Plates,
				as: 'plate_1',
				attributes: [
					'id',
					'name',
					'description',
					'price',
					'delivery_time',
					'chefDeliveryAvailable',
					'userId',
				],
			},
			{
				model: Plates,
				as: 'plate_2',
				attributes: [
					'id',
					'name',
					'description',
					'price',
					'delivery_time',
					'chefDeliveryAvailable',
					'userId',
				],
			},
		],

		limit: 3,
		order: [['frequency', 'DESC']],
	});

	return list;
};

exports.getShippingAddressOfUser = async (userId) => {
	let shippingAddress = await repositoryShip.getUserDefaultAddress(userId);
	if (!shippingAddress) {
		shippingAddress = await repositoryShip.getUserAddress(userId);
	}
	return shippingAddress;
};

exports.checkAllPlatesBelongsToASingleChef = async (data) => {
	let j = JSON.stringify(data);
	let k = JSON.parse(j);
	let p = [];
	for (var key in k) {
		p.push(k[key].plateId);
	}

	const distinctChefCount = await Plates.count({
		distinct: true,
		col: 'Plates.userId',
		where: {
			id: {
				[Op.in]: p,
			},
		},
		//,logging: console.log
	});
	if (distinctChefCount > 1) {
		return false;
	} else {
		return true;
	}
};

exports.checkPlateChefSameAsBasketItemChef = async (basketId, plates) => {
	let j = JSON.stringify(plates);
	let k = JSON.parse(j);
	//Get the first plateId and then the chef's Id of that plate as all the plates in basket will have same chef
	let plateId = k[0].plateId;

	//ordered plate's chef id 

	const plateChefId = await Plates.findOne({
		attributes: ['userId'],
		where: {
			id: plateId,
		},
		//    ,logging: console.log
	});

	if(!plateChefId) {
		return false;
	}
 
	//Need to validate against one basket item's chef as all basket items of a basket will have same chef
	
	let basketItems = await this.getBasketItemsDetail(basketId);
	 
	if (!_.isEmpty(basketItems)) {

		const plate = await Plates.findOne({
			attributes: ['userId'],
			where: {
				id: basketItems[0].plateId,
			},
		});

		//basket item's chefId should match to requested plate's chefId 
 
		if (plate && plate.userId !== plateChefId.userId) {
			return false;
		}
	}
	return true;
};
