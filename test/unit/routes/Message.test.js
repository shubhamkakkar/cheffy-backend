// const chai = require('chai')
// const sinonChai = require('sinon-chai');
// const expect = chai.expect;
//
// chai.use(sinonChai);
//
// const {
//     sequelize,
//     dataTypes,
//     checkModelName,
//     checkUniqueIndex,
//     checkPropertyExists
// } = require('sequelize-test-helpers')
//
// const UserModel = require('../../../app/models/user');
// const MessageModel = require('../../../app/models/message');
//
// describe('Create user then get all messages from it', () => {
//     const userModel = UserModel(sequelize, dataTypes);
//     const userInstance = new userModel();
//     console.log(userInstance);
//     // const Model = MessageModel(sequelize, dataTypes);
//     // const instance = new Model();
//     //
//     // checkModelName(Model)('Message')
//     //
//     // context('properties', () => {
//     //     ;['from_userid', 'to_userid', 'message', 'userId'].forEach(checkPropertyExists(instance))
//     // })
//     //
//     // context('associations', async () => {
//     //     const User = 'User';
//     //
//     //     before(() => {
//     //         Model.associate({ User })
//     //     })
//     //
//     //     it('defined a belongsTo association with User', () => {
//     //         expect(Model.belongsTo).to.have.been.calledWith(User)
//     //     })
//     // })
// })