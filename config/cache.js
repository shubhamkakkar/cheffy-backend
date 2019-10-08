require("dotenv").config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});

module.exports = {
    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
}