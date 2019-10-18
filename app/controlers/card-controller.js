var HttpStatus = require('http-status-codes');
const authService = require('../services/auth');
const cardService = require('../services/payment');
const userRepository = require('../repository/user-repository');
const ValidationContract = require('../services/validator');

exports.listUserCards = async (req,res) => {
    try {

        const token_return = await authService.decodeToken(req.headers['x-access-token'])

        let user = await userRepository.getUserById(token_return.id)

        if(user){

            if(!user.address || user.address.length == 0){
                res.status(404).send({message:"User address not found"});
            }

            if(!user.stripe_id){
                res.status(404).send({message:"This user has no credit cards saved"});
                return;
            }

            let creditCardList = await cardService.getUserCardsList(user.stripe_id);

            res.status(200).send(creditCardList);

        }else{
            res.status(404).send({message:"User not found"});
        }


        return

    }catch(err){
        if(err.raw.code === "incorrect_number"){
            res.status(409).send("The credit card number is incorrect");
        }else{
            res.status(409).send(err);
        }
    }
}

exports.addNewCard = async (req,res) => {
    try {

        const token_return = await authService.decodeToken(req.headers['x-access-token'])
        let contract = new ValidationContract();

        contract.isRequired(req.body.number, 'Review Card Info');
        contract.isRequired(req.body.exp_month, 'Review Card Info');
        contract.isRequired(req.body.exp_year, 'Review Card Info');
        contract.isRequired(req.body.cvc, 'Review Card Info');

        if (!contract.isValid()) {
            res.status(HttpStatus.CONFLICT).send("Review card info").end();
            return 0;
          }


        let card = {
            number:req.body.number,
            exp_month:req.body.exp_month,
            exp_year:req.body.exp_year,
            cvc:req.body.cvc
        }

        let user = await userRepository.getUserById(token_return.id)

        if(user){

            if(!user.address || user.address.length == 0){
                res.status(404).send({message:"User address not found"});
            }

            if(!user.stripe_id){
                let stripeNewUser = await cardService.createUser(user,user.address[0]);
                user = await userRepository.saveStripeinfo(user.id,stripeNewUser);
            }

            let stripeNewCard = await cardService.createCard(user,user.address[0],card)
            let attachedCard = await cardService.attachUser(stripeNewCard.id,user.stripe_id);

            res.status(201).send(attachedCard);

        }else{
            res.status(404).send({message:"User not found"});
        }


        return

    }catch(err){
        if(err.raw.code === "incorrect_number"){
            res.status(409).send("The credit card number is incorrect");
        }else{
            res.status(409).send(err);
        }
    }
}
