const Guid = require('guid');
const Request  = require('request');
const Querystring  = require('querystring');

var csrf_guid = Guid.raw();
const api_version = "v1.0";
const app_id = 780902649008769;
const app_secret = '971c273df2b672b14661eb6f6f5ac8ae';
const me_endpoint_base_url = `https://graph.accountkit.com/${api_version}/me`;
const token_exchange_base_url = `https://graph.accountkit.com/${api_version}/access_token`; 



exports.sendFacebookAuthCode = async (request, response) => {

    let email, name, user_type;
    email = request.email;
    name = request.name;
    user_type = request.user_type;

    // CSRF check
    //if (request.body.csrf_nonce === csrf_guid) {
        var app_access_token = ['AA', app_id, app_secret].join('|');
        var params = {
        grant_type: 'authorization_code',
        code: request.body.code,
        access_token: app_access_token
        //appsecret_proof: app_secret
        };
    
        // exchange tokens
        var token_exchange_url = token_exchange_base_url + '?' + Querystring.stringify(params);
        Request.get({url: token_exchange_url, json: true}, function(err, resp, respBody) {
            console.log(respBody);
            var view = {
                user_access_token: respBody.access_token,
                expires_at: respBody.expires_at,
                user_id: respBody.id,	
            };
            // get account details at /me endpoint
            var me_endpoint_url = me_endpoint_base_url + '?access_token=' + respBody.access_token;
            Request.get({url: me_endpoint_url, json:true }, function(err, resp, respBody) {
                // send login_success.html
                console.log(respBody);
                if (respBody.phone) {
                view.method = "SMS"
                view.identity = respBody.phone.number;
                } else if (respBody.email) {
                view.method = "Email"
                view.identity = respBody.email.address;
                }
                
                response.statis(200).send({message:"Verified by facebook"});


            });
        });
    // } 
    // else {
    //     // login failed
    //     response.writeHead(200, {'Content-Type': 'text/html'});
    //     response.end("Something went wrong. :( ");
    // }
}

exports.auth = async (req,res) =>{
    try {
        let customer
        var reg = new RegExp(/^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/);
        if (reg.test(req.body.login)) {
          customer = await User.findOne({ where: { email: req.body.login, password: md5(req.body.password + global.SALT_KEY) } });
        } else {
          const num_list = req.body.login.split(" ");
          customer = await User.findOne({ where: { country_code: num_list[0], phone_no: num_list[1], password: md5(req.body.password + global.SALT_KEY) } });
        }
    
        if (!customer) {
          res.status(HttpStatus.FORBIDDEN).send({
            message: 'User or password is invalid!'
          });
          return 0;
        }
    
        const token = await authService.generateToken({
          id: customer.id,
          email: customer.email,
          name: customer.name
        });
        res.status(200).send({
          token: token,
          data: customer
        });
      } catch (e) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
          message: 'Request fail',
          error: e
        });
      }
}