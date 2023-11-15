import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import {isEmpty, isNotEmpty, validate} from "class-validator";
import { User } from "../entity/user";
import config from "../config/config";
import global from "../config/global";
import { Trigger } from "./../entity/entity-enum";

class AuthController {
  static login = async (req: Request, res: Response) => {
    //Check if domain, userid and password are set
    const { domain, userid, password } = req.body;

    let resp = {
      errorCode: 0, errorMsg: '', data: '', system_lang: ''
    }
    const userRepository = getRepository(User);
    let user;
    try {
      if(global.DOMAIN_TYPE.indexOf(domain) >= 0) {
        //admin , tc , translate , reviewer
        user = await userRepository.findOneOrFail({ where: { login_id: userid, user_type: global.USER_TYPE[global.DOMAIN_TYPE.indexOf(domain)] } });
      }
      else {
        if(domain == userid)
          //company
          user = await userRepository.findOneOrFail({ where: { login_id: userid, user_type: 2 } });
        else {
          let parent: User;
          //get parentid
          parent = await userRepository.findOneOrFail({ where: { login_id: domain, user_type: 2 } });
          //requester
          user = await userRepository.findOne({ where: { login_id: userid, user_type: 3, parent_id: parent.id } });
          if (user == undefined) {
            user = await userRepository.findOne({ where: { login_id: userid, user_type: 7, parent_id: parent.id } });
            if (user == undefined) {
              resp.errorMsg = "Your userid or domain is incorrect."
              resp.errorCode = 2
              return res.json(resp);
            }
          }
        }
      }

      if (user.is_delete == Trigger.ON) {
        resp.errorMsg = "Your userid or domain is incorrect."
        resp.errorCode = 2
        return res.json(resp);
      }

      if (!user.checkIfUnencryptedPasswordIsValid(password)) {
        resp.errorCode = 1
        resp.errorMsg = 'Your password is incorrect.'
        return res.json(resp);
      }

      const token = jwt.sign({ id: user.id,
                                userid: user.login_id,
                                role: global.ROLE[user.user_type - 1],
                                user_type: user.user_type,
                                system_lang: user.system_lang,
                                user_name: user.user_name,
                                parent_id: user.parent_id,
                                player_id: user.player_id,
                                avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar)
                              }, config.jwtSecret,{ expiresIn: "6h" });
      resp.data = token;
      resp.system_lang = user.system_lang;
      return res.json(resp)

    }
    catch (error) {
      console.log(error)
      resp.errorMsg = "Your userid or domain is incorrect."
      resp.errorCode = 2
      return res.json(resp);
    }
  };

  static me = async (req: Request, res: Response) => {
    let resp = {
      errorCode: 0, errorMsg: '', data: Object
    }
    if( !req.headers.authorization ) {
      resp.errorCode = 1
      resp.errorMsg = 'Token not provided'
      res.json(resp);
      return;
    }
    if( req.headers.authorization.toLowerCase().indexOf("bearer ") === -1 ) {
      resp.errorCode = 2
      resp.errorMsg = 'Invalid token'
      res.json(resp);
      return;
    }
    let token = req.headers.authorization.split(' ')[1];
    try {
      let decoded = <any>jwt.verify(token, config.jwtSecret)
      let userRepository = getRepository(User);
      let user = await userRepository.findOneOrFail(decoded.id)
      decoded.avatar = (user.avatar === '' || user.avatar === null) ? '' : config.IMAGE_PREFIX_URL + user.avatar;
      decoded.system_lang = user.system_lang;
      decoded.user_name = user.user_name;
      decoded.active = 'Y';
      if(user.user_type == (global.ROLE.indexOf("company") + 1)) {
          decoded.country_code = user.country_code;
          decoded.currency_type = user.currency_type;
          decoded.company_logo = (user.company_logo === '' || user.company_logo === null) ? '' : config.IMAGE_PREFIX_URL + user.company_logo;
          decoded.user_name = user.company_name;
      }
      else if (user.user_type == (global.ROLE.indexOf("manager") + 1)) {
        decoded.company_id = user.parent_id;
        let _company = await userRepository.findOneOrFail(user.parent_id);
        decoded.currency_type = _company.currency_type;
        decoded.company_country_code = _company.country_code
        decoded.domain = _company.login_id
        decoded.company_logo = (_company.company_logo === '' || _company.company_logo === null) ? '' : config.IMAGE_PREFIX_URL + _company.company_logo;
      }
      else if(user.user_type == (global.ROLE.indexOf("requester") + 1)) {
          decoded.company_id = user.parent_id;
          let _company = await userRepository.findOneOrFail(user.parent_id);
          decoded.email = user.user_email;
          decoded.payment = _company.is_card_payment;
          decoded.company_logo = (_company.company_logo === '' || _company.company_logo === null) ? '' : config.IMAGE_PREFIX_URL + _company.company_logo;
          decoded.currency_type = _company.currency_type;
          decoded.domain = _company.login_id
          decoded.use_terms = _company.use_terms
          decoded.agreed = user.agreed
        if (_company.use_terms == 'Y' && user.agreed == 'N') {
          decoded.active = 'N';
        }
      }
      res.json({
        errorCode: 0, errorMsg: '',
        data: decoded
      })
    }
    catch (error) {
      resp.errorCode = 500; resp.errorMsg="Internal Server Error";
      res.json(resp);
      return;
    }
  };
  static logout = (req: Request, res: Response) => {
    let resp = { errorCode: 0, errorMsg: '' }
    if( !req.headers.authorization ) {
      resp.errorCode = 1
      resp.errorMsg = 'Token not provided'
      res.json(resp);
      return;
    }
    if( req.headers.authorization.toLowerCase().indexOf("bearer ") === -1 ) {
      resp.errorCode = 2
      resp.errorMsg = 'Invalid token'
      res.json(resp);
      return;
    }
    res.json(resp);
    return;
  }
  static changePassword = async (req: Request, res: Response) => {
    //Get ID from JWT
    const id = res.locals.jwtPayload.id;

    //Get parameters from the body
    const { oldPassword, newPassword } = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(400).send();
    }

    //Get user from the database
    const userRepository = getRepository(User);
    let user: User;
    try {
        user = await userRepository.findOneOrFail(id);
        //Check if old password matchs
        if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) {
            res.status(401).send();
            return;
        }

        //Validate de model (password lenght)
        user.password = newPassword;
        const errors = await validate(user);
        if (errors.length > 0) {
        res.status(400).send(errors);
        return;
        }
        //Hash the new password and save
        user.hashPassword();
        userRepository.save(user);

        res.status(204).send();
    } catch (id) {
        res.status(401).send();
    }
  };
  static updatePlayerid = async(req: Request, res: Response) => {
      try {
          let {player_id} = req.body;
          if (isEmpty(player_id))
              return res.json({errorCode: 400, errorMsg: 'Invalid Parameter'});
          const userRepository = getRepository(User);
          let _user_info = await userRepository.findOne(req.decodedUser.id);
          if (_user_info == undefined)
              return res.json({errorCode: 15, errorMsg: 'invalid user id.'})
          if(isNotEmpty(player_id))
            _user_info.player_id = player_id
          await userRepository.save(_user_info)
          return res.json({ errorCode: 0, errorMsg: "" });
      }
      catch(error) {
          console.log(error)
          return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
      }
  }
}
export default AuthController;
