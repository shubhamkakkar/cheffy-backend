module.exports = {
	mysql: {
		username: "root",
		password: "admin",
		database: "c821iyxdz9lgx1ut",
		host: "localhost",
		dialect: "mysql",
		port: "3306",
		logging: console.log
	},
	redis: {
		password: process.env.REDIS_PASSWORD,
		host: process.env.REDIS_HOST,
		port: process.env.REDIS_PORT
	}
};
