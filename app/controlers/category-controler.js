"use strict";
const path = require("path");
const HttpStatus = require("http-status-codes");
const ValidationContract = require("../services/validator");
const repository = require("../repository/category-repository");
const repositoryPlate = require("../repository/plate-repository");
const md5 = require("md5");
const authService = require("../services/auth");
const asyncHandler = require("express-async-handler");
const categoryPlateInputFilter = require(path.resolve(
	"app/inputfilters/category"
));
const {
	User, Plate
} = require('../models/index')
const paginator = require(path.resolve("app/services/paginator"));

exports.categoryByIdMiddleware = asyncHandler(
	async (req, res, next, categoryId) => {
		const category = await repository.findById(categoryId);
		if (!category)
			return res
				.status(HttpStatus.NOT_FOUND)
				.send({ message: `Category Not Found by id ${categoryId}` });
		req.category = category;
		next();
	}
);

exports.create = asyncHandler(async (req, res, next) => {
	let contract = new ValidationContract();
	contract.isRequired(req.body.name, "The name is required!");
	//contract.isRequired(req.body.url, 'Image URL is required!');
	if (!contract.isValid()) {
		res.status(HttpStatus.CONFLICT)
			.send(contract.errors())
			.end();
		return 0;
	}

	const existCategory = await repository.findExist(req.body.name);
	if (existCategory) {
		payload.status = HttpStatus.CONFLICT;
		res.status(payload.status).send({
			message: `Category already exists with name: ${req.body.name}`,
			status: HttpStatus.CONFLICT
		});
		return 0;
	}
	const createPayload = categoryPlateInputFilter.filter(
		req.body,
		"form-data"
	);
	createPayload.userId = req.userId;

	if (req.files && req.files["category_image"]) {
		createPayload.url = req.files["category_image"][0].key;
	} else {
		createPayload.url = '';
	}

	const category = await repository.createCategory(createPayload);

	res.status(HttpStatus.OK).send({
		message: "Successfully created category!",
		data: category
	});
});

exports.getCategory = asyncHandler(async (req, res, next) => {
	const category = req.category;
	res.status(HttpStatus.OK).send({ category: category });
});

exports.list = asyncHandler(async (req, res, next) => {
	// const pagination = paginator.paginateQuery(req);
	// const query = { pagination };

	const categories = await repository.listCategories();

	res.status(HttpStatus.OK).send({
		message: "Categories!",
		data: categories,
		// ...paginator.paginateInfo(pagination)
	});
});

exports.listPlates = async (req, res, next) => {
	const categories = await repository.categoriesListPlates(
		req.params.categoryId
	);
	res.status(HttpStatus.OK).send(categories);
};

exports.edit = asyncHandler(async (req, res, next) => {
	let contract = new ValidationContract();
	contract.isRequired(req.body.name, "The name is required!");
	//contract.isRequired(req.body.url, 'Image URL is required!');
	if (!contract.isValid()) {
		res.status(HttpStatus.CONFLICT)
			.send(contract.errors())
			.end();
		return 0;
	}

	const updatedPayload = categoryPlateInputFilter.filter(
		req.body,
		"form-data"
	);

	if (req.files && req.files["category_image"]) {
		updatedPayload.url = req.files["category_image"][0].key;
	}

	const category = await repository.editCategory(
		req.params.categoryId,
		updatedPayload
	);
	res.status(HttpStatus.OK).send(category);
});


exports.delete = asyncHandler(async (req, res, next) => {
	const categoryId = req.params.id;
	const token_return = await authService.decodeToken(
		req.headers["x-access-token"]
	);
	const existUser = await User.findOne({ where: { id: token_return.id } });

	if (existUser.user_type !== "chef") {
		res
			.status(HttpStatus.CONFLICT)
			.send({ message: "Only chefs can delete category", error: true })
			.end();
		return 0;
	}

	const categoryWithPlate = await repositoryPlate.countPlateByCategoryId(categoryId)
	if (categoryWithPlate) {
		res
			.status(HttpStatus.CONFLICT)
			.send({
				message:
					"This category is referenced in an Plate and therefore cannot be deleted",
				error: true,
			})
			.end();
		return 0;
	}
	await repository.deleteCategory(categoryId);
	return res.status(200).send({ message: "category successfully deleted!" });
});
