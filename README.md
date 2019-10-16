# Cheffy Back-End

This repository hosts the Cheffy App Api.

*Shortlink https://git.io/JeOjk*

## Table of Contents
 - [Introduction](#introduction)
 - [Requirements](#requirements)
 - [Available commands](#available-commands)
 - [Development](#development)

## Introduction

Locally Cheffy relies on a Redis instance a Mysql instance and a valid Node.js runtime, for more information for what you need to get up and running fast just scroll down for the requirements section.

### Requirements
- Node.js >= 8
- Sequelize Cli
- Redis
- MySQL
- Docker (Optional)
> Docker is optional, if you like to make no further changes in your current environment docker is a good choice for you.

### Available Commands

Run the app in production mode:

```sh
npm start
```

Run the app in development mode:

```sh
npm run dev
```

Run tests:

```sh
npm test
```

Run tests and watch for changes:

```sh
npm run watch
```

To run the project with docker compose just run the command:

```sh
docker-compose up -d
``` 

To run only redis service with docker use the command: 

```sh
docker-compose up -d redis
``` 

## Development

After satisfying all local dependencies you can start working on the project, we currently work with test driven development, if you are not familiarized with this kind of development take a look at [this link](https://hackernoon.com/introduction-to-test-driven-development-tdd-61a13bc92d92)

With that in mind you can start creating tests on the `test/` folder then use the command `npm run watch` for watch for changes on tests.

## Essential links

[Backoffice to validate and approve chefs' documents](http://backoffice.thecheffy.com)
> AcessToken: 206591b861ce530ab28355d0a0f56222
