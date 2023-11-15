import { isEmpty, isNotEmpty, isArray, isDefined } from 'class-validator';
import { User } from './../entity/user';
import { Request, Response } from 'express';
import { getRepository, getConnection } from "typeorm";
import { generateRandomString } from './../helpers/utils';
import { sendEmail } from './../helpers/notice-method';
import fs from "fs";
import config from './../config/config';
import global from './../config/global';
import lang from "../lang/index";
import { Trigger } from './../entity/entity-enum';
class AdminController {
    static registerAdmin = async(req: Request, res: Response) => {
        const {
            user_id,
            user_pwd,
            user_name,
            country_code,
            phone_number,
            email,
            system_lang,
            email_notice_check,
            sms_notice_check,
            memo,
            id,
            password_gen   
        } = req.body;
        if (isEmpty(id)) {
            if((isEmpty(password_gen) || password_gen == 'N') && isEmpty(user_pwd))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        }
        try {
            const userRepository = getRepository(User);
            let user;
            if(isEmpty(id))
                user = new User();
            else {
                user = await userRepository.findOneOrFail(id);
            }
            if ( req.file ) {
                if(!isEmpty(user.avatar))
                    fs.unlinkSync(config.LOCATION_PATH + '/'  + user.avatar)
                user.avatar = req.file.filename
            }
            if(isEmpty(id)) {
                user.create_date = Math.floor(Date.now() / 1000);
                user.user_type = global.ROLE.indexOf('admin') + 1;
                user.player_id = generateRandomString(24);
            }
            user.update_date = Math.floor(Date.now() / 1000);
            user.login_id = user_id;
            
            let gen_pwd = '';
            if (isEmpty(id)) {
                if (isEmpty(password_gen) || password_gen == 'N')
                {
                    user.password = user_pwd;
                    user.hashPassword();
                }
                else {
                    gen_pwd = generateRandomString(12);
                    user.password = gen_pwd;
                    user.hashPassword();
                }
            }
            else {
                if(!isEmpty(user_pwd)) {
                    user.password = user_pwd;
                    user.hashPassword();
                }   
            }
            user.user_name = user_name;
            user.user_email = email;
            user.country_code = country_code;
            user.phone_number = phone_number;
            user.system_lang = system_lang;
            user.is_sms_notice_on = sms_notice_check;
            user.is_email_notice_on = email_notice_check;
            if(isDefined(memo))
                user.admin_memo = memo;
            await userRepository.save(user);

            if (isEmpty(id) && !isEmpty(password_gen) && password_gen == 'Y' && !isEmpty(email)) {
                let template_obj: { [k: string]: any } = {};
                template_obj.site_url = config.SITE_URL;
                template_obj.domain = global.ROLE[0];
                template_obj.userid = user_id;
                template_obj.password = gen_pwd;   
                sendEmail(email, system_lang, lang[user.system_lang]['email']['admin_a14'], 'admin_a14', template_obj);
            }
            return res.json({ errorCode: 0, errorMsg: '' });
        }
        catch(error) {
            console.log(error)
            res.json({ errorCode: 500, errorMsg: 'Internal Server Error'});
            return;
        }
    };
    static detail = async(req: Request, res: Response) => {
        const {
            id
        } = req.body;
        if(isEmpty(id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        let userRepository = getRepository(User);
        try {
            let user = await userRepository.findOne(id);
            if(user === undefined || user.is_delete === Trigger.ON)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if(global.ROLE[user.user_type - 1] != 'admin')
                return res.json({ errorCode: 1, errorMsg: 'Invalid Id, This is not admin id.' });
            if(user.login_id == config.ADMIN_USER_ID)
                return res.json({ errorCode: 2, errorMsg: 'sorry, you can\'t get this admin information.' });

            let data: {[k: string]: any} = {};
            data = {
                id: id,
                user_id: user.login_id,
                user_name: user.user_name,
                country_code: (isEmpty(user.country_code)?'':user.country_code),
                phone_number: (isEmpty(user.phone_number)?'':user.phone_number),
                email: (isEmpty(user.user_email)?'':user.user_email),
                system_lang: user.system_lang,
                sms_notice_check:  user.is_sms_notice_on,
                email_notice_check: user.is_email_notice_on,
                memo: isEmpty(user.admin_memo) ? '' : user.admin_memo,
                avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar)
            }
            return res.json({ errorCode: 0, errorMsg: "", data: data });
        }
        catch(error) {
            console.log(error);
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
    static deleteAdmin = async(req: Request, res: Response) => {
        const { ids } = req.body;
        if( !( isArray(ids) && ids.length > 0 ) )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            for(let i = 0; i < ids.length; i ++) {
                //remove from User
                if(ids[i] == config.ADMIN_ID)
                    continue;
                /*
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(User)
                .where("id = :id", { id: ids[i] })
                .execute(); */
                await getConnection()
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        is_delete: Trigger.ON 
                    })
                    .where("id = :id", { id: ids[i] })
                    .execute();
            }
            return res.json({ errorCode: 0, errorMsg: "" });
        }
        catch( error ) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
    static getAdminList = async(req: Request, res: Response) => {
        const {
            table,
            search
        } = req.body;
        let query =  getRepository(User)
                    .createQueryBuilder("user");
        {
            query = query.where('"user"."user_type" = :user_type', {user_type: ( global.ROLE.indexOf('admin') + 1 )});
            query = query.andWhere('"user"."login_id" != :login_id', {login_id: config.ADMIN_USER_ID});
        }
        //검색어
        if(isNotEmpty(search)) {
            if( isNotEmpty(search.search_keyword) ) {
                let field_name = '';
                switch(search.keyword_type) {
                    case 1:
                        field_name = 'user.user_name'
                        break;
                    case 2:
                        field_name = 'user.login_id'
                        break;
                    case 3:
                        field_name = 'user.phone_number'
                        break;
                    case 4:
                        field_name = 'user.user_email'
                        break;
                }

                if(search.search_type == 1)
                    query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                else
                    query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
            }
        }
        query = query.andWhere('"user"."is_delete" = \'N\'')
        query = query.orderBy('"user"."create_date"', "DESC");
        let totals = await query.getCount()

        if(isNotEmpty(table)) {
            query.skip((table.page - 1) * table.page_length)
            .take(table.page_length);
        }

        let result = await query.getMany();
        let table_data: Array<any>;
        table_data = [];
        result.forEach(function(item) {
            let table_item: {[k: string]: any} = {};
            table_item = {
                id: item.id,
                user_id: item.login_id,
                user_name: item.user_name,
                phone_number: (isEmpty(item.phone_number) ? '' : (item.country_code + ' ' + item.phone_number)),
                email: (isEmpty(item.user_email)?'':item.user_email),
                reg_date: item.create_date
            }
            table_data.push(table_item);
        });
        return res.json({ errorCode: 0, errorMsg: '', data: {list: table_data, totalCount: totals}})
    }
};
export default AdminController;