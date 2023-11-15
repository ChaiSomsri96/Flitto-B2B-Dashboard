import { UsersWorkingLanguage } from './../entity/users-working-language';
import { isArray, isEmpty, isNotEmpty, isDefined } from 'class-validator';
import { Request, Response } from "express";
import { WorkingLanguage } from './../entity/working-language';
import { User } from './../entity/user';
import { UserTableProperty } from './../entity/user-table-property'
import { getRepository, Brackets, getConnection } from "typeorm";
import fs from "fs";
import path from "path";
import global from "../config/global";
import config from "../config/config";

import { google } from 'googleapis';
import { Trigger } from './../entity/entity-enum';
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(config.CLIENT_ID, config.SECRET, 'https://b2b.ku-min.com/profile');


class BasicController {
    static getTableInfo = async (req: Request, res: Response) => {
        try {
            const { list_type } = req.body;
            if (isEmpty(list_type)) {
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });   
            }
            let query = getRepository(UserTableProperty)
                .createQueryBuilder("user_table_property")
                .where('"user_table_property"."userId" = :user_id', { user_id: req.decodedUser.id });
            let _user_table_property = await query.getOne();
            if (_user_table_property == undefined) 
                return res.json({ errorCode: 15, errorMsg: 'Invalid user table property id.' });                   
            
            let _obj = null

            if(list_type == 'caption_list')
                _obj = JSON.parse(_user_table_property.caption_list)
            else if (list_type == 'admin_list')
                _obj = JSON.parse(_user_table_property.admin_list)
            else if (list_type == 'company_list')
                _obj = JSON.parse(_user_table_property.company_list)
            else if (list_type == 'manager_list')
                _obj = JSON.parse(_user_table_property.manager_list)
            else if (list_type == 'requester_list')
                _obj = JSON.parse(_user_table_property.requester_list)
            else if (list_type == 'worker_list')
                _obj = JSON.parse(_user_table_property.worker_list)
            else if (list_type == 'billing_list')
                _obj = JSON.parse(_user_table_property.billing_list)
            else if (list_type == 'billing_list1')
                _obj = JSON.parse(_user_table_property.billing_list1)
            else if (list_type == 'billing_list2')
                _obj = JSON.parse(_user_table_property.billing_list2)
            else if (list_type == 'billing_list3')
                _obj = JSON.parse(_user_table_property.billing_list3)
            else if (list_type == 'billing_list4')
                _obj = JSON.parse(_user_table_property.billing_list4)
            else if (list_type == 'billing_list5')
                _obj = JSON.parse(_user_table_property.billing_list5)
            

            if (_obj == null)
                return res.json({ errorCode: 16, errorMsg: 'There is no info' });
            else
                return res.json({ errorCode: 0, errorMsg: '', data: _obj });
        }    
        catch (error) {
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });       
        }
    }

    static setTableProperty = async (req: Request, res: Response) => {
        try {
            const { columns, list_type } = req.body;
            if (isEmpty(list_type)) {
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });   
            }
            let query = getRepository(UserTableProperty)
                .createQueryBuilder("user_table_property")
                .where('"user_table_property"."userId" = :user_id', { user_id: req.decodedUser.id });
            let _user_table_property = await query.getOne();

            const userRepository = getRepository(User);
            let _user = await userRepository.findOneOrFail(req.decodedUser.id)
            
            if (_user == undefined)
                return res.json({ errorCode: 15, errorMsg: 'Invalid worker id.' });
            
            if (_user_table_property == undefined) {
                let obj = {}
                for (let i = 0; i < columns.length; i ++) {
                    obj = {
                        ...obj,
                        [columns[i]]: 0
                    }
                }
                _user_table_property = new UserTableProperty();
                _user_table_property.create_date = Math.floor(Date.now() / 1000);
                _user_table_property.update_date = Math.floor(Date.now() / 1000);
                _user_table_property.user = _user;
                
                if (list_type == 'caption_list')
                    _user_table_property.caption_list = JSON.stringify(obj)
                else if (list_type == 'admin_list')
                    _user_table_property.admin_list = JSON.stringify(obj)
                else if (list_type == 'company_list')
                    _user_table_property.company_list = JSON.stringify(obj)
                else if (list_type == 'manager_list')
                    _user_table_property.manager_list = JSON.stringify(obj)
                else if (list_type == 'requester_list')
                    _user_table_property.requester_list = JSON.stringify(obj)
                else if (list_type == 'worker_list')
                    _user_table_property.worker_list = JSON.stringify(obj)
                else if (list_type == 'billing_list')
                    _user_table_property.billing_list = JSON.stringify(obj)
                else if (list_type == 'billing_list1')
                    _user_table_property.billing_list1 = JSON.stringify(obj)
                else if (list_type == 'billing_list2')
                    _user_table_property.billing_list2 = JSON.stringify(obj)
                else if (list_type == 'billing_list3')
                    _user_table_property.billing_list3 = JSON.stringify(obj)
                else if (list_type == 'billing_list4')
                    _user_table_property.billing_list4 = JSON.stringify(obj)
                else if (list_type == 'billing_list5')
                    _user_table_property.billing_list5 = JSON.stringify(obj)

                await getConnection().manager.save(_user_table_property);   
            }
            else {
                let obj
                // obj = JSON.parse(_user_table_property.caption_list);
                if (list_type == 'caption_list')
                    obj = JSON.parse(_user_table_property.caption_list)
                else if (list_type == 'admin_list')
                    obj = JSON.parse(_user_table_property.admin_list)
                else if (list_type == 'company_list')
                    obj = JSON.parse(_user_table_property.company_list)
                else if (list_type == 'manager_list')
                    obj = JSON.parse(_user_table_property.manager_list)
                else if (list_type == 'requester_list')
                    obj = JSON.parse(_user_table_property.requester_list)
                else if (list_type == 'worker_list')
                    obj = JSON.parse(_user_table_property.worker_list)
                else if (list_type == 'billing_list')
                    obj = JSON.parse(_user_table_property.billing_list)
                else if (list_type == 'billing_list1')
                    obj = JSON.parse(_user_table_property.billing_list1)
                else if (list_type == 'billing_list2')
                    obj = JSON.parse(_user_table_property.billing_list2)
                else if (list_type == 'billing_list3')
                    obj = JSON.parse(_user_table_property.billing_list3)
                else if (list_type == 'billing_list4')
                    obj = JSON.parse(_user_table_property.billing_list4)
                else if (list_type == 'billing_list5')
                    obj = JSON.parse(_user_table_property.billing_list5)
                
                if (obj == null)
                    obj = {}
                
                for (let i = 0; i < columns.length; i++) {
                    if (obj[columns[i]] == undefined) {
                        obj = {
                            ...obj,
                            [columns[i]]: 0    
                        }
                    }
                }

                for (let key in obj) {
                    if (columns.indexOf(key) < 0) 
                    {
                        delete obj[key]
                    }
                }

                if (list_type == 'caption_list')
                    _user_table_property.caption_list = JSON.stringify(obj)
                else if (list_type == 'admin_list')
                    _user_table_property.admin_list = JSON.stringify(obj)
                else if (list_type == 'company_list')
                    _user_table_property.company_list = JSON.stringify(obj)
                else if (list_type == 'manager_list')
                    _user_table_property.manager_list = JSON.stringify(obj)
                else if (list_type == 'requester_list')
                    _user_table_property.requester_list = JSON.stringify(obj)
                else if (list_type == 'worker_list')
                    _user_table_property.worker_list = JSON.stringify(obj)
                else if (list_type == 'billing_list')
                    _user_table_property.billing_list = JSON.stringify(obj)
                else if (list_type == 'billing_list1')
                    _user_table_property.billing_list1 = JSON.stringify(obj)
                else if (list_type == 'billing_list2')
                    _user_table_property.billing_list2 = JSON.stringify(obj)
                else if (list_type == 'billing_list3')
                    _user_table_property.billing_list3 = JSON.stringify(obj)
                else if (list_type == 'billing_list4')
                    _user_table_property.billing_list4 = JSON.stringify(obj)
                else if (list_type == 'billing_list5')
                    _user_table_property.billing_list5 = JSON.stringify(obj)
                
                await getConnection().manager.save(_user_table_property);   
            }

            return res.json({ errorCode: 0, errorMsg: '' });
        }
        catch (error) {
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });       
        }
    }
    
    static setTableWidth = async (req: Request, res: Response) => {
        const { column, width, list_type } = req.body;        

        if (isEmpty(list_type)) {
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });   
        }

        let query = getRepository(UserTableProperty)
                .createQueryBuilder("user_table_property")
                .where('"user_table_property"."userId" = :user_id', { user_id: req.decodedUser.id });
        let _user_table_property = await query.getOne();

        if (_user_table_property == undefined) 
            return res.json({ errorCode: 15, errorMsg: 'Invalid user table property id.' });                
        
        let obj

        if (list_type == 'caption_list')
            obj = JSON.parse(_user_table_property.caption_list)
        else if (list_type == 'admin_list')
            obj = JSON.parse(_user_table_property.admin_list)
        else if (list_type == 'company_list')
            obj = JSON.parse(_user_table_property.company_list)
        else if (list_type == 'manager_list')
            obj = JSON.parse(_user_table_property.manager_list)
        else if (list_type == 'requester_list')
            obj = JSON.parse(_user_table_property.requester_list)
        else if (list_type == 'worker_list')
            obj = JSON.parse(_user_table_property.worker_list)
        else if (list_type == 'billing_list')
            obj = JSON.parse(_user_table_property.billing_list)
        else if (list_type == 'billing_list1')
            obj = JSON.parse(_user_table_property.billing_list1)
        else if (list_type == 'billing_list2')
            obj = JSON.parse(_user_table_property.billing_list2)
        else if (list_type == 'billing_list3')
            obj = JSON.parse(_user_table_property.billing_list3)
        else if (list_type == 'billing_list4')
            obj = JSON.parse(_user_table_property.billing_list4)
        else if (list_type == 'billing_list5')
            obj = JSON.parse(_user_table_property.billing_list5)
        
        if (!(obj[column] == undefined))
            obj[column] = width
        
        //_user_table_property.caption_list = JSON.stringify(obj)
        if (list_type == 'caption_list')
            _user_table_property.caption_list = JSON.stringify(obj)
        else if (list_type == 'admin_list')
            _user_table_property.admin_list = JSON.stringify(obj)
        else if (list_type == 'company_list')
            _user_table_property.company_list = JSON.stringify(obj)
        else if (list_type == 'manager_list')
            _user_table_property.manager_list = JSON.stringify(obj)
        else if (list_type == 'requester_list')
            _user_table_property.requester_list = JSON.stringify(obj)
        else if (list_type == 'worker_list')
            _user_table_property.worker_list = JSON.stringify(obj)
        else if (list_type == 'billing_list')
            _user_table_property.billing_list = JSON.stringify(obj)
        else if (list_type == 'billing_list1')
            _user_table_property.billing_list1 = JSON.stringify(obj)
        else if (list_type == 'billing_list2')
            _user_table_property.billing_list2 = JSON.stringify(obj)
        else if (list_type == 'billing_list3')
            _user_table_property.billing_list3 = JSON.stringify(obj)
        else if (list_type == 'billing_list4')
            _user_table_property.billing_list4 = JSON.stringify(obj)
        else if (list_type == 'billing_list5')
            _user_table_property.billing_list5 = JSON.stringify(obj)

        await getConnection().manager.save(_user_table_property);   

        return res.json({ errorCode: 0, errorMsg: '' });
    }
    
    static getWorkingLanguages = async (_req: Request, res: Response) => {
        const workingLanguageRepository = getRepository(WorkingLanguage);
        const workingLanguageList = await workingLanguageRepository.find({select: ["id", "name"], order: { order: "ASC"}});
        return res.json({
            "errorCode": 0,
            "errorMsg": "",
            "data": workingLanguageList
        });
    }

    static changePassword = async (req: Request, res: Response) => {
        let resp = {
            errorCode: 0, errorMsg: ''
        }
        const { old_password, new_password } = req.body;
        if(!( old_password && new_password )) {
            resp.errorCode = 400; resp.errorMsg = 'Invalid Parameter';
            return res.json(resp);
        }
        const userRepository = getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail(req.decodedUser.id)
            if( !user.checkIfUnencryptedPasswordIsValid(old_password) ) {
                resp.errorCode = 1;
                resp.errorMsg = 'Old password is incorrect.';
                return res.json(resp);
            }
            user.password = new_password
            user.hashPassword()
            userRepository.save(user);
            return res.json(resp);
        }
        catch(error) {
            resp.errorCode = 500; resp.errorMsg = "Internal Server Error";
            res.json(resp);
            return;
        }
    }

    static duplicateIdCheck = async (req: Request, res: Response) => {
        let resp = {
            errorCode: 0, errorMsg: ''
        }
        const { user_type, user_id } = req.body;
        if(!( user_type && user_id )) {
            resp.errorCode = 400; resp.errorMsg = 'Invalid Parameter';
            return res.json(resp);
        }
        if( global.ROLE[req.decodedUser.user_type-1] == 'admin' && (user_type == 'requester' || user_type == 'manager')  && isEmpty(req.body.company_id)) {
            resp.errorCode = 400; resp.errorMsg = 'Invalid Parameter';
            return res.json(resp);
        }
        const userType = global.ROLE.indexOf(user_type) + 1;
        const userRepository = getRepository(User);
        try {
            let users;
            if (user_type != 'requester' && user_type != 'manager') {
                users = await userRepository.find({
                    where: {
                        user_type: userType,
                        login_id: user_id
                    }
                });   
                if(users.length > 0) {
                    resp.errorCode = 1; resp.errorMsg = "duplicate Id Error";
                }
            }
            else {
                users = await userRepository.find({
                    where: {
                        login_id: user_id,
                        parent_id: (global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'manager') ? req.body.company_id : req.decodedUser.id
                    }
                });
                if(users.length > 0) {
                    resp.errorCode = 1; resp.errorMsg = "duplicate Id Error";
                }
                let _company = await userRepository.findOne(((global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'manager') ? req.body.company_id : req.decodedUser.id))
                if (_company != undefined && _company.login_id == user_id) {
                    resp.errorCode = 1; resp.errorMsg = "duplicate Id Error";
                }
            }
            return res.json(resp);
        }
        catch(error) {
            resp.errorCode = 500; resp.errorMsg = "Internal Server Error";
            res.json(resp);
            return;
        }
    }

    static getMyInfo = async (req: Request, res: Response) => {
        const userRepository = getRepository(User);
        try {
            const user = await userRepository.findOne(req.decodedUser.id)
            if(user === undefined) {
                res.json({ errorCode: 15, errorMsg: "invalid your id." });
                return;
            }
            if (user.is_delete === Trigger.ON) {
                res.json({ errorCode: 15, errorMsg: "invalid your id." });
                return;
            }
            let data: {[k: string]: any} = {};
            data = {
                user_type: global.ROLE[user.user_type - 1],
                user_id: user.login_id,
                user_name: user.user_name,
                country_code: user.country_code,
                phone: user.phone_number,
                email: user.user_email,
                system_language: user.system_lang,
                is_sms: user.is_sms_notice_on,
                is_email:  user.is_email_notice_on,
                avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar)
            };
            if(global.ROLE[user.user_type - 1] == 'company') {
                data.logo = (user.company_logo === null || user.company_logo === '') ? '' : (config.IMAGE_PREFIX_URL + user.company_logo);
                data.company_name = user.company_name;
                //고객사 서비스
                data.services = [];
                for(let i = 0; i < user.services.length; i ++)
                    data.services.push(user.services[i].detail_service_type)
            }
            if(global.ROLE[user.user_type - 1] == 'translator' || global.ROLE[user.user_type - 1] == 'company') {
                if( isArray(user.language_pairs) && user.language_pairs.length > 0) {
                    data.translate_pairs = [];
                    user.language_pairs.forEach(function(item) {
                        data.translate_pairs.push({
                            original: item.original.name,
                            translate: item.translate.name
                        })
                    })
                }
            }
            else if (global.ROLE[user.user_type - 1] == 'manager') {
                const _company = await userRepository.findOne(user.parent_id)
                if(_company === undefined) {
                    res.json({ errorCode: 15, errorMsg: "invalid your id." });
                    return;
                }
                data.company_name = _company.company_name;
                data.services = [];
                for(let i = 0; i < _company.services.length; i ++)
                    data.services.push(_company.services[i].detail_service_type)
                
                if (isArray(_company.language_pairs) && _company.language_pairs.length > 0) {
                    data.translate_pairs = [];
                    _company.language_pairs.forEach(function (item) {
                        data.translate_pairs.push({
                            original: item.original.name,
                            translate: item.translate.name
                        })
                    })
                }
            }
            else if(global.ROLE[user.user_type - 1] == 'requester') {
                if(user.requester_working_language != null && user.requester_working_language != undefined)
                    data.original_language = {
                        id: user.requester_working_language.id,
                        name: user.requester_working_language.name
                    };
                if(isArray(user.working_languages) && user.working_languages.length > 0){
                    data.working_languages = [];
                    for(let i = 0; i < user.working_languages.length; i ++)
                        data.working_languages.push({
                            id: user.working_languages[i].workingLanguage.id,
                            name: user.working_languages[i].workingLanguage.name
                        });
                }
                data.youtube_connected_check = user.is_youtube_connected;
                if(user.is_youtube_connected == 'Y') {
                    data.google_name = user.youtube_name
                    data.google_email = user.youtube_email
                }
                data.extra = isEmpty(user.extra)?'':user.extra
            }
            else if(global.ROLE[user.user_type - 1] == 'tc' || global.ROLE[user.user_type - 1] == 'reviewer') {
                if( isArray(user.working_languages) && user.working_languages.length > 0) {
                    data.working_languages = [];
                    user.working_languages.forEach(function(item) {
                        data.working_languages.push(item.workingLanguage.name)
                    })
                }
            }
            return res.json({
                errorCode: 0, errorMsg: "",
                data: data
            })
        }
        catch (error) {
            res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
            return;
        }
    };

    static updateMyInfo = async (req: Request, res: Response) => {
        let resp = {
            errorCode: 0, errorMsg: ''
        }
        const {
            user_name, //
            country_code,  //코드
            phone_number,
            email,  //이메일
            system_lang,  //시스템 언어
            sms_notice_check, // 알림톡 / SMS 알림  (Y 또는 N값으로 요청)
            email_notice_check,  // 이메일 알림 (Y 또는 N값으로 요청)
            extra
        } = req.body;

        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.decodedUser.id);
            if(user === undefined) {
                resp.errorCode = 15; resp.errorMsg = "invalid your id";
                return res.json(resp);
            }
            user.update_date = Math.floor(Date.now() / 1000);
            user.user_name = user_name;
            user.country_code = country_code;
            user.phone_number = phone_number;
            user.user_email = email;
            user.system_lang = system_lang;
            user.is_sms_notice_on = sms_notice_check;
            user.is_email_notice_on = email_notice_check;

            if( req.files ) {
                if(Object.create(req.files)['file']) {
                    if(!(user.avatar === null || user.avatar === ''))
                        fs.unlinkSync(config.LOCATION_PATH + '/'  + user.avatar)
                    user.avatar = Object.create(req.files)['file'][0]['filename'];
                }
                if(Object.create(req.files)['logo']) {
                    if(!(user.company_logo === null || user.company_logo === ''))
                        fs.unlinkSync(config.LOCATION_PATH + '/'  + user.company_logo)
                    user.company_logo = Object.create(req.files)['logo'][0]['filename'];
                }
            }
            //correcting
            if (global.ROLE[req.decodedUser.user_type - 1] == 'requester') {
                if(isDefined(extra))
                    user.extra = extra;
                if(isEmpty(user.working_languages))
                    user.working_languages = []
                let workingLanguageRepository = getRepository(WorkingLanguage);
                if(isNotEmpty(req.body.original_language)) {
                    let original_lang_obj = await workingLanguageRepository.findOne(req.body.original_language)
                    if( original_lang_obj != undefined)
                        user.requester_working_language = original_lang_obj;
                    else
                        user.requester_working_language = null
                }
                else
                    user.requester_working_language = null

                if(isEmpty(req.body.translate_languages))
                    req.body.translate_languages = []
                if(req.body.translate_languages !=  undefined && isArray(req.body.translate_languages)) {
                    let user_translate_language_ids = [], add_user_translate_language_ids = []
                    for(let i = 0; i < user.working_languages.length; i ++) {
                        user_translate_language_ids.push(user.working_languages[i].workingLanguage.id)
                        if(req.body.translate_languages.indexOf(user.working_languages[i].workingLanguage.id) < 0) {
                            await getConnection()
                            .createQueryBuilder()
                            .delete()
                            .from(UsersWorkingLanguage)
                            .where('"users_working_language"."userId" = :id and "users_working_language"."workingLanguageId" = :working_language_id',
                                    {id: req.decodedUser.id, working_language_id: user.working_languages[i].workingLanguage.id})
                            .execute();
                        }
                    }
                    for(let i = 0; i < req.body.translate_languages.length; i ++) {
                        if(user_translate_language_ids.indexOf(req.body.translate_languages[i]) < 0)
                            add_user_translate_language_ids.push(req.body.translate_languages[i]);
                    }

                    for(let i = 0; i < add_user_translate_language_ids.length; i ++) {
                        const _userWorkingLanguage = new UsersWorkingLanguage();
                        let _workingLanguage = await workingLanguageRepository.findOneOrFail(add_user_translate_language_ids[i])
                        _userWorkingLanguage.workingLanguage = _workingLanguage
                        _userWorkingLanguage.create_date = Math.floor(Date.now() / 1000);
                        _userWorkingLanguage.update_date = Math.floor(Date.now() / 1000);
                        await getConnection().manager.save(_userWorkingLanguage);
                        user.working_languages.push(_userWorkingLanguage)
                    }
                }
            }
            //correcting
            let _user = await userRepository.save(user);
            if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                return res.json({
                    errorCode: 0, errorMsg: '',
                    data: {
                        avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar),
                        company_logo: ( isEmpty(_user.company_logo) ? '' : (config.IMAGE_PREFIX_URL + _user.company_logo) ),
                        user_name: _user.company_name
                    }
                });
            }
            else {
                return res.json({
                    errorCode: 0, errorMsg: '',
                    data: {
                        avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar),
                        user_name: user_name
                    }
                });
            }
        }
        catch (error) {
            console.log(error)
            resp.errorCode = 500; resp.errorMsg = "Internal Server Error";
            res.json(resp);
            return;
        }
    }
    // tags => -1 인 경우 전체
    static getWorkerCountByTags = async (req: Request, res: Response) => {
        const { worker_type , tags } = req.body

        if( isEmpty(worker_type) )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });

        try {
            let query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoinAndSelect("user.tags", "user_tag")
                    .leftJoinAndSelect("user_tag.tag", "tag");
            query = query.where('"user"."user_type" = :user_type', {user_type: (global.ROLE.indexOf(worker_type) + 1)})
            if(isEmpty(tags) || (tags !== '-1' && tags !== -1 && !isArray(tags)) ) {
                // query = query.andWhere('"user_tag"."id" = :column' , {column: null});
            }
            else if(isArray(tags)) {
                if (tags.length < 1) {
                    // query = query.andWhere('"user_tag"."id" = :column' , {column: null});   
                }
                else {
                    let tag_query = '"user_tag"."tagId" = :tag1', filter = {};
                    filter = {
                        ...filter,
                        'tag1': tags[0]
                    }
                    for( let i = 1; i < tags.length; i ++) {
                        tag_query += ' or "user_tag"."tagId" = :tag' + (i  + 1);
                        let key = `tag${i+1}`
                            filter = {
                                ...filter,
                                [key] : tags[i]
                            }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(tag_query, filter)
                    }));
                }
            }
            let totals = await query.getCount();
            return res.json({errorCode: 0, errorMsg: '', data: totals});
        }
        catch (error) {
            console.log(error)
            res.json({errorCode: 500, errorMsg: "Internal Server Error"});
            return;
        }
    }
    //type = translate , inquiry
    static fileDownload = async (req: Request, res: Response) => {
        // console.log(req.query , req.params)
        let file_name = req.query.file_name;
        if(file_name == undefined) {
            res.json({errorCode: 400, errorMsg: 'Invalid Paramter'});
        }
        else {
            let fileLocation = '';
           // console.log(file_name)
            if(req.query.type == 'translate')
                fileLocation = config.LOCATION_TRANSLATE_PATH;
            else if(req.params.type == 'inquiry')
                fileLocation = config.LOCATION_INQUIRY_PATH;
             //   console.log(fileLocation)
        //res.json({errCode: 0});
            fileLocation = path.join(fileLocation, file_name.toString());
            console.log(fileLocation)
            res.download(fileLocation , file_name.toString());
        }
    }
    static youtubeApply = async (_req: Request, res: Response) => {
        // oauth2Client.credentials = 'ya29.a0AfH6SMCP-oXe23f--zAJ2aSbUF0iOa6fDyAz6JQ9lITQbqBu0Ugj_BVAodkifgnjpInNzF9Ii6KKJDL3Snk8TALZvhI5DO4ynWDeiaa1n_a7ZKx6HkQ9eXayehYOypigYN_W7u5nu3XuGpf0VZ8-3jyt12pqRsX_W2g'        
        // oauth2Client.credentials = ''
        oauth2Client.setCredentials({
            access_token: 'ya29.a0AfH6SMAWydpaNlcqRWn7zNK0JjzYphAdn2UwRT5i9JUjvRx23lQMIZqrww8Qud5UVfONJofTiXuwMQbSCIQkJjZuy2zA3LlUrkehTzVeyNPV3Er0NAmv2YFC1n_iYGvJjC_Txp51izprsu2yNPFb0i0mzauw7iQVCfiQ'
        })
        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
        });
        youtube.videos.insert(
        {
            autoLevels: true,
            part: ['id', 'snippet', 'status'],
            requestBody: {
                    snippet: {
                      title: '유튜브 API를 사용한 동영상 업로드 네번째네요..ㅠㅠㅠ',
                      description: '유튜브의 Videos API를 사용하여 mp4 동영상을 업로드합니다. 잘 올라가겠죠?! 그래야 할텐데요 =.= 이번에는 퍼블리싱 되었으면 좋겠네요.',
                      tags: ['유튜브API', '동영상업로드', 'videos.insert']
                    },
                    status: {
                        publicStatsViewable: true,
                        privacyStatus: 'public'
                    },
            },
            media: {
                body: fs.createReadStream('F:\\autobet_capture.mp4')    
            }
        },
        (err: any, data: any) => {
            if (err) {
                console.log(err)
                return res.json({errorCode: 500, errorMsg: 'failed'});
            }
            console.log("uploading video done")
            console.log('https://www.youtube.com/watch?v=' + data.data.id);
            return res.json({errorCode: 0, errorMsg: ''});
        })  
    }
}
export default BasicController;
