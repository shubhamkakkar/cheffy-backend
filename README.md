# Cheffy BackEnd-API

## public docs [Link Postman!](https://documenter.getpostman.com/view/1175570/SVYjV3Td)

### Backoffice to validate and approve chefs' documents [Link Backoffice!](http://backoffice.thecheffy.com)
### AcessToken: 206591b861ce530ab28355d0a0f56222

currently the project has 2 processes that must run in parallel, whether docker or not.


We have a file for docker compose which is: docker-compose.yml


To run the project with docker compose just run the command:

`docker-compose up -d` 

With this command the system will run the API and redis and connect both on the same network.

To run only redis service with docker use the command: 

`docker-compose up -d redis`
# fictional-octo-lamp
