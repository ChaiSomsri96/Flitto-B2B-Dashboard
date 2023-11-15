import { isEmpty } from 'class-validator';
import { User } from './../entity/user';
import { getRepository } from 'typeorm';
import { Request, Response, NextFunction } from 'express';
import global from "../config/global";
export const checkDuplicateId = (user_type: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        if(isEmpty(req.body.id)) {
            const userRepository = getRepository(User);
            try {
                if(isEmpty(req.body.user_id))
                    return res.json({errorCode: 400, errorMsg: "Invalid Parameter"});
                if(user_type == 'worker' && isEmpty(req.body.user_type))
                    return res.json({errorCode: 400, errorMsg: "Invalid Parameter"});
                if(user_type == 'requester' && global.ROLE[req.decodedUser.user_type - 1] == 'admin' && isEmpty(req.body.company_id))
                    return res.json({ errorCode: 400, errorMsg: "Invalid Parameter" });
                if (user_type == 'manager' && global.ROLE[req.decodedUser.user_type - 1] == 'admin' && isEmpty(req.body.company_id))
                    return res.json({ errorCode: 400, errorMsg: "Invalid Parameter" });
                let user;
                if (user_type != 'requester' && user_type != 'manager') {
                    user = await userRepository.findOne({ where: { login_id: req.body.user_id, user_type: ( user_type == 'worker' ? (global.ROLE.indexOf(req.body.user_type) + 1) : (global.ROLE.indexOf(user_type) + 1) ) } });   
                }
                else {
                    if (global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                        let company_id = (global.ROLE[req.decodedUser.user_type - 1] == 'admin') ? req.body.company_id : req.decodedUser.id
                        user = await userRepository.findOne({ where: { login_id: req.body.user_id, parent_id: company_id } });
                        if(user != undefined) {
                            return res.json({errorCode: 11, errorMsg: "Failed to register. duplicate User Id error."});
                        }
                        let _company = await userRepository.findOne(company_id);
                        if (_company != undefined && _company.login_id == req.body.user_id) {
                            return res.json({errorCode: 11, errorMsg: "Failed to register. duplicate User Id error."});
                        }   
                    }
                    else {
                        let query = getRepository(User)
                            .createQueryBuilder("user")
                            .leftJoinAndSelect("user.parent", "parent")
                            .where('"user"."id" = :id', {id: req.decodedUser.id});
                        let __user = await query.getOne();
                        if (__user != undefined && __user.parent.login_id == req.body.user_id) {
                            return res.json({errorCode: 11, errorMsg: "Failed to register. duplicate User Id error."});
                        }
                    }
                }
                next();
                return;
            }
            catch (error) {
                console.log(error);
                return res.json({errorCode: 500, errorMsg: "Internal Server Error"});
            }
        }
        else {
            next();
            return;
        }
    };
}