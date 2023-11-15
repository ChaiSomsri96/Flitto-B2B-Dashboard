import { isArray, isNotEmpty, isNumber, isNumberString, isEmpty, isDefined } from 'class-validator';
import { User } from './../entity/user';
import { Request, Response } from 'express';
import { getRepository, getConnection, Brackets } from "typeorm";
import { WorkingLanguage } from './../entity/working-language';
import { Manager } from './../entity/manager';
import { UsersWorkingLanguage } from './../entity/users-working-language';
import { calculate_duration, generateRandomString } from './../helpers/utils';
var axios = require('axios').default;
import {validateUrl} from 'youtube-validate'
import fs from "fs";
import qs from 'qs';
import global from './../config/global';
import config from './../config/config';
import { Trigger } from './../entity/entity-enum';
import { RequestDetail } from './../entity/request-detail';
import { Log } from './../entity/log';
import { TransRequest } from './../entity/trans-request';
import { CaptionTemp } from './../entity/caption-temp';
import { sendEmail } from './../helpers/notice-method';
import { youtube_caption_apply } from './../helpers/db-util';
import lang from "../lang/index";
import { insertNotice } from './../helpers/db-util';


class RequesterController {
    /*
    {
        "requster_list": [
            {
                "email": "aaa@bbb.com",
                "name": "김도진",
                "youtube_channel_url": "http://www.youtube.com/",
                "password": "asdf"
            }
        ]
    }
    */
    static createRequester = async (req: Request, res: Response) => {
        console.log(req.body);
        res.json({
            errorCode: 0,
            errorMsg: ''
        })
    }

    static payment = async (req: Request, res: Response) => {
        //console.log(req.body);

        const { param1, ref } = req.body;

        if (isEmpty(param1) || isEmpty(ref)) {
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        }

        try {
            const captionRepository = getRepository(CaptionTemp);
            let _caption = await captionRepository.findOneOrFail(param1);

            let _req_data = JSON.parse(_caption.caption_data)

            let requester_id = _req_data.requester_id, company_id = _req_data.company_id;

            const userRepository = getRepository(User);
            let company = await userRepository.findOneOrFail(company_id)
            let requester_user = await userRepository.findOneOrFail(requester_id)

            let { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos?id=' + _req_data.youtube_id + '&key=' + config.YOUTUBE_API_KEY + '&part=snippet,contentDetails,statistics,status')

            if(data.items.length < 1)
                return res.json({ errorCode: 1, errorMsg: "Invalid Url" });
            
            let duration = Math.floor(calculate_duration(data.items[0].contentDetails.duration) / 60);
            if(calculate_duration(data.items[0].contentDetails.duration) % 60 >= 30)
                duration++;
            else if (duration == 0)
                duration++;
            
            let work_price = 0, predict_time = 0, _prices = [], is_free_request = false;
            
            if( !(isNotEmpty(_req_data.free_request_check)
                    && _req_data.free_request_check == 'Y'
                    && requester_user.free_req_cnt >= _req_data.translate_languages.length
                    && company.screen_time_limit.free_screen_limit >= duration) ) {
                    // let unit_price = 0;
                    if(isArray(company.prices)) {
                        for(let i = 0; i < company.prices.length; i ++) {
                            if(company.prices[i].original.id == _req_data.original_language && (_req_data.translate_languages.indexOf(company.prices[i].translate.id) >= 0 || _req_data.translate_languages.indexOf(company.prices[i].translate.id.toString()) >= 0)) {
                                let _price_in_language = {
                                    language_id: company.prices[i].translate.id,
                                    work_price: 0
                                }
                                _price_in_language.work_price += company.prices[i].work_price;
                                if(isNotEmpty(requester_user.discount)) {
                                    _price_in_language.work_price -= requester_user.discount;
                                    _price_in_language.work_price = _price_in_language.work_price < 0 ? 0 : _price_in_language.work_price;
                                }
                                //원어민 검수
                                if(isNotEmpty(_req_data.native_review_check) && _req_data.native_review_check == 'Y')
                                    _price_in_language.work_price += company.prices[i].native_review_price
                                _prices.push(_price_in_language)
                            }
                        }
                    }
                    for(let i = 0; i < _prices.length; i ++) {
                        _prices[i].work_price = _prices[i].work_price * duration;
                        if(isNotEmpty(_req_data.title_request_check) && _req_data.title_request_check == 'Y')
                            _prices[i].work_price += company.title_cost;
                    }
                    //긴급번역인 경우 할증률
                    if(isNotEmpty(_req_data.emergency_request_check)
                        && _req_data.emergency_request_check == 'Y'
                        && company.screen_time_limit.emergency_screen_limit >= duration) {
                            for(let i = 0; i < _prices.length; i ++)
                                _prices[i].work_price = Math.floor(_prices[i].work_price * (1 + company.premium_rate / 100));
                    }
                    for(let i = 0; i < _prices.length; i ++)
                        work_price += _prices[i].work_price;
            }
            else {
                    if(isArray(company.prices)) {
                        for(let i = 0; i < company.prices.length; i ++) {
                            if(company.prices[i].original.id == _req_data.original_language && (_req_data.translate_languages.indexOf(company.prices[i].translate.id) >= 0 || _req_data.translate_languages.indexOf(company.prices[i].translate.id.toString()) >= 0)) {
                                let _price_in_language = {
                                    language_id: company.prices[i].translate.id,
                                    work_price: 0
                                }
                                _prices.push(_price_in_language)
                            }
                        }
                    }
                    is_free_request = true;
                    work_price = 0;
            }

            if(isNotEmpty(_req_data.emergency_request_check)
                && _req_data.emergency_request_check == 'Y'
                && company.screen_time_limit.emergency_screen_limit >= duration
                && !is_free_request) {
                    /* for(let i = 0; i < company.end_time_settings.length; i ++)
                        predict_time += (duration * company.end_time_settings[i].emergency_trans_time + company.end_time_settings[i].emergency_add_time); */
                predict_time = 24 * 60;
            }
            else if(company.screen_time_limit.general_screen_limit >= duration) {
                //48시간 이내 초과하지 않는 케이스
                /*
                for(let i = 0; i < company.end_time_settings.length; i ++)
                    predict_time += (duration * company.end_time_settings[i].general_trans_time + company.end_time_settings[i].general_trans_add_time);
                */
                predict_time = 48 * 60;
            }
            else {
                //48시간 초과하는 케이스
                for(let i = 0; i < company.end_time_settings.length; i ++)
                    predict_time += (duration * company.end_time_settings[i].general_excess_time + company.end_time_settings[i].general_excess_add_time);
                /*
                ------------
                */
                predict_time = predict_time + company.screen_time_limit.general_end_time;
                //추후 체크
                /* if(predict_time != req.body.predict_time) {
                    removeFile(req, 'translate')
                    return res.json({
                        errorCode: 1, errorMsg: 'predict time is wrong from frontend.'
                    })
                } */
            }

            let trans_request = new TransRequest();
            trans_request.tc_create_date = trans_request.tc_update_date = trans_request.update_date = trans_request.create_date = Math.floor(Date.now() / 1000);
            trans_request.youtube_url = _req_data.youtube_url;
            trans_request.youtube_id = _req_data.youtube_id;
            trans_request.duration = calculate_duration(data.items[0].contentDetails.duration);
            trans_request.duration_minute = duration;
            trans_request.title = data.items[0].snippet.title;
            trans_request.description = data.items[0].snippet.description;

            if (isNotEmpty(_req_data.original_video)) {
                trans_request.original_video = _req_data.original_video
                trans_request.original_video_show_name = _req_data.original_video_show_name
                trans_request.has_original_video = Trigger.ON;
            }

            
            //24시간 긴급요청
            if(isNotEmpty(_req_data.emergency_request_check)
            && _req_data.emergency_request_check == 'Y'
            && company.screen_time_limit.emergency_screen_limit >= duration)
                trans_request.is_urgent = _req_data.emergency_request_check;
            //YouTube 자동적용
            if(isNotEmpty(_req_data.youtube_apply_check) && _req_data.youtube_apply_check == 'Y')
                trans_request.is_youtube_request = _req_data.youtube_apply_check;
            //제목/설명 번역
            if(isNotEmpty(_req_data.title_request_check) && _req_data.title_request_check == 'Y')
                trans_request.is_title_desc = _req_data.title_request_check;
            //원어민 검수
            if(isNotEmpty(_req_data.native_review_check) && _req_data.native_review_check == 'Y')
                trans_request.is_native_review = _req_data.native_review_check;
            if(isDefined(_req_data.translator_memo))
                trans_request.memo = _req_data.translator_memo;
            if(isDefined(_req_data.requester_memo))
                trans_request.requester_memo = _req_data.requester_memo;
            trans_request.predict_end_date = trans_request.create_date + predict_time * 60;
            trans_request.status = global.STATUS.indexOf("preparing") + 1;
            trans_request.work_price = work_price;
            trans_request.currency_type = company.currency_type;

            trans_request.is_card_payment = Trigger.ON;

            const workingLanguageRepository = getRepository(WorkingLanguage);
            let _workingLanguage = await workingLanguageRepository.findOneOrFail(_req_data.original_language);
            trans_request.original_language = _workingLanguage;
            //request detail
            trans_request.details = [];
            for(let i = 0; i < _req_data.translate_languages.length; i ++) {
                let _request_detail = new RequestDetail();
                _request_detail.create_date = Math.floor(Date.now() / 1000);
                _request_detail.update_date = Math.floor(Date.now() / 1000);
                _request_detail.status = global.STATUS.indexOf("preparing") + 1;
                for(let j = 0; j < _prices.length; j ++)
                    if(_prices[j].language_id == _req_data.translate_languages[i]) {
                        _request_detail.work_price = _prices[j].work_price;
                        break;
                    }
                let _translateWorkingLanguage = await workingLanguageRepository.findOneOrFail(_req_data.translate_languages[i]);
                _request_detail.translate_language = _translateWorkingLanguage;
                if(trans_request.has_original_video == Trigger.ON)
                    _request_detail.translate_req_date = Math.floor(Date.now() / 1000);
                if (company.has_tc_service == Trigger.OFF)
                    _request_detail.translate_req_date = Math.floor(Date.now() / 1000);
                await getConnection().manager.save(_request_detail);
                trans_request.details.push(_request_detail);
            }
            trans_request.user = requester_user;
            let _trans_request = await getConnection().manager.save(trans_request);
            //진행기록--record(check later)
            let _log = new Log();
            _log.create_date = Math.floor(Date.now() / 1000);
            _log.update_date = Math.floor(Date.now() / 1000);
            _log.user = requester_user;
            _log.trans_request = _trans_request;
            _log.status = global.STATUS.indexOf("preparing") + 1;
            await getConnection().manager.save(_log);
            //
            if(is_free_request) {
                requester_user.free_req_cnt -= _prices.length;
                await getConnection().manager.save(requester_user);
            }
            //알림발송등록--notice-ghost
            await insertNotice(requester_user, _trans_request, null, 1, Trigger.OFF)
            return res.json({ errorCode: 0, errorMsg: ''})
        }
        catch (err) {
            console.log(err)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });      
        }
    }

    static updateRequesterAccept = async (req: Request, res: Response) => {
        try {
            let userRepository = getRepository(User);
            console.log(req.decodedUser)
            let user = await userRepository.findOne(req.decodedUser.id)
            if (user === undefined)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            user.agreed = Trigger.ON
            await getConnection().manager.save(user);
            return res.json({ errorCode: 0, errorMsg: '' });
        }    
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });   
        }
    }
    static registerRequester = async (req: Request, res: Response) => {
        const {
            user_id, // 아이디
            user_pwd, // 비번
            user_name, // 이름 입력
            country_code, // 국가코드
            phone_number, // 전화번호
            email, // 이메일
            system_lang, // 시스템 언어
            sms_notice_check, // 알림톡 / SMS 알림
            email_notice_check, // 이메일 알림
            discount,
            free_req_cnt,
            memo,
            extra,
            id,
            password_gen 
        } = req.body;
        if (isEmpty(id)) {
            if((isEmpty(password_gen) || password_gen == 'N') && isEmpty(user_pwd))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        }
        //end - validation
        try {
            const userRepository = getRepository(User);
            let user, _company;
            if(isEmpty(id))
                user = new User();
            else {
                user = await userRepository.findOneOrFail(id);
            }

            if( req.file ) {
                if(!isEmpty(user.avatar))
                    fs.unlinkSync(config.LOCATION_PATH + '/'  + user.avatar)
                user.avatar = req.file.filename;
            }
            const company_id = (global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'manager') ? req.body.company_id : req.decodedUser.id;
            _company = await userRepository.findOne(company_id)
            if(_company == undefined)
                return res.json({errorCode: 15, errorMsg: 'invalid company id.'})
            if(isEmpty(id)) {
                user.create_date = Math.floor(Date.now() / 1000);
                user.working_languages = []
                user.player_id = generateRandomString(24);
            }
            user.update_date = Math.floor(Date.now() / 1000);
            user.user_type = global.ROLE.indexOf('requester') + 1;
            user.login_id = user_id;
            /* 
            if(!isEmpty(user_pwd)) {
                user.password = user_pwd;
                user.hashPassword();
            }
            */
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
            if(isNotEmpty(country_code))
                user.country_code = country_code;
            if(isNotEmpty(phone_number))
                user.phone_number = phone_number;
            user.system_lang = system_lang;
            user.parent_id = company_id;
            user.parent = _company;
            user.is_sms_notice_on = sms_notice_check;
            user.is_email_notice_on = email_notice_check;
            if(global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
                user.discount = discount;
                user.free_req_cnt = free_req_cnt;
            }
            if (isDefined(memo)) {
                if( global.ROLE[req.decodedUser.user_type - 1] == 'admin' )
                    user.admin_memo = memo;
                else
                    user.company_memo = memo;
            }
            if (isDefined(extra)) {
                user.extra = extra;
            }
            let workingLanguageRepository = getRepository(WorkingLanguage);
            if(isNotEmpty(req.body.original_language)) {
                let original_lang_obj = await workingLanguageRepository.findOne(req.body.original_language)
                if( original_lang_obj != undefined)
                    user.requester_working_language = original_lang_obj;
                else
                    user.requester_working_language = null;
            }
            else
                user.requester_working_language = null;
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
                                {id: id, working_language_id: user.working_languages[i].workingLanguage.id})
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
            let _result_user = await getConnection().manager.save(user);

            if (global.ROLE[req.decodedUser.user_type - 1] == 'manager' && isEmpty(id)) {
                let query = getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoinAndSelect("user.managers", "manager")
                    .where('user.id = ' + req.decodedUser.id);
                let _manager = await query.getOne();
                if (_manager === undefined) {
                    return res.json({ errorCode: 15, errorMsg: 'invalid manager id.' })
                }
                if (!isArray(_manager.managers)) {
                    _manager.managers = []
                }
                let _new_manager = new Manager();
                _new_manager.create_date = Math.floor(Date.now() / 1000);
                _new_manager.update_date = Math.floor(Date.now() / 1000);
                _new_manager.requester = _result_user;
                await getConnection().manager.save(_new_manager)
                _manager.managers.push(_new_manager)
                _manager.requester_cnt = _manager.requester_cnt + 1
                await getConnection().manager.save(_manager)
            }

            if (isEmpty(id) && !isEmpty(password_gen) && password_gen == 'Y' && !isEmpty(email)) {
                let template_obj: { [k: string]: any } = {};
                template_obj.site_url = config.SITE_URL;
                template_obj.domain = _company.login_id;
                template_obj.userid = user_id;
                template_obj.password = gen_pwd;   
                sendEmail(email, system_lang, lang[user.system_lang]['email']['requestor_a04'], 'requestor_a04', template_obj);
            }            

            return res.json({ errorCode: 0, errorMsg: '' });
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        company_ids: ['1', '2', '3', '4'],
        keyword_type: 1,   // 1: 이름 , 2: 아이디 , 3: 전화번호 , 4: 이메일
        search_keyword: 'asdf',   //검색어
        search_type: 1,    // 1: 포함 , 2: 일치
        // 계정할인
        discount_currency_type: 'JPY',   //   파라메터가 request에 없거나 -1인 케이스 - 전체로 판단
        discount_start: 0,  // 계정 할인 범위
        discount_end: 0,
        total_request_numbers_start: 0, //총 요청수 범위
        total_request_numbers_end: 0,

        translate_currency_type: 'JPY', // 번역금액 currency_type
        total_translate_price_start: 0, // 총 번역금액 범위
        total_translate_price_end: 0,

        free_req_cnt_start: 0, //무료 요청 횟수
        free_req_cnt_end: 0 //무료 요청 횟수
    }
    */
    static getRequesterList = async(req: Request, res: Response) => {
        const {
            table,
            search
        } = req.body;

        let sub_query = getConnection()
            .createQueryBuilder()
            .select('"user"."id"', 'id')
            .addSelect('sum( \
                case \
                when "trans_request".currency_type = \'USD\' \
                THEN "trans_request".work_price \
                ELSE 0 \
                end)' , 'usd_work_sum')
            .addSelect('sum( \
                case  \
                when "trans_request".currency_type = \'JPY\' \
                THEN "trans_request".work_price \
                ELSE 0 \
                end)', 'jpy_work_sum')
            .addSelect('sum( \
                case  \
                when "trans_request".currency_type = \'KRW\' \
                THEN "trans_request".work_price \
                ELSE 0 \
                end)', 'krw_work_sum')
            .addSelect('count(trans_request.id)', 'request_cnt')
            .from(User, "user")
            .leftJoin('user.trans_requests', 'trans_request')
            .where('user.user_type = 3')
            .groupBy('user.id');
        
        let query =  getRepository(User)
                    .createQueryBuilder("user")
                    .select('user.id , \
                            user.login_id, \
                            user.user_name, \
                            user.country_code, \
                            user.phone_number, \
                            user.user_email, \
                            user.discount, \
                            user.free_req_cnt, \
                            user.total_request_numbers, \
                            user.total_translate_price, \
                            user.create_date \
                            ')
            .addSelect('"t_r".usd_work_sum', 'usd_work_sum')
            .addSelect('"t_r".krw_work_sum', 'krw_work_sum')
            .addSelect('"t_r".jpy_work_sum', 'jpy_work_sum')
            .addSelect('"t_r".request_cnt', 'request_cnt');
        
        

        query = query.leftJoin('(' + sub_query.getQuery() + ')', "t_r", '"user"."id" = "t_r"."id"')
        
        if(global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
            query = query.leftJoinAndSelect(User, "A", '"user"."parent_id" = "A"."id"');
        }
        else 
            query = query.leftJoinAndSelect(User, "A", '"user"."parent_id" = "A"."id"');
        
        query = query.where("1=1")

        query = query.andWhere('"user"."is_delete" = \'N\'');
        query = query.andWhere('"A"."is_delete" = \'N\'');

        if (global.ROLE[req.decodedUser.user_type - 1] == 'company') {
            query = query.andWhere("user.parent_id = :parent_id", {parent_id: req.decodedUser.id});
        }
        else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
            query = query.leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
            query = query.andWhere('"manager"."id" is not null')
        }
    
        {
            query = query.andWhere("user.user_type = :user_type", {user_type: (global.ROLE.indexOf("requester") + 1)});
        }
        if(isNotEmpty(search)) {
            //검색어
            if( isNotEmpty(search.search_keyword) ) {
                let field_name = '';
                switch(search.keyword_type) {
                    case 1:
                        field_name = "user.user_name"
                        break;
                    case 2:
                        field_name = "user.login_id"
                        break;
                    case 3:
                        field_name = "user.phone_number"
                        break;
                    case 4:
                        field_name = "user.user_email"
                        break;
                }
                if(search.search_type == 1)
                    query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                else
                    query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
            }
            //고객사 검색
            if((global.ROLE[req.decodedUser.user_type - 1] === 'admin' || global.ROLE[req.decodedUser.user_type - 1] === 'manager') && isNotEmpty(search.company_ids) && isArray(search.company_ids) && search.company_ids.length > 0) {
                let company_id_query = 'user.parent_id = :company_id1' , filter = {};
                filter = {
                    ...filter,
                    'company_id1': search.company_ids[0]
                }
                for( let i = 1; i < search.company_ids.length; i ++ ) {
                    company_id_query += ' or user.parent_id = :company_id' + (i + 1);
                    let key = `company_id${i+1}`
                    filter = {
                        ...filter,
                        [key]: search.company_ids[i]
                    }
                }
                query = query.andWhere(new Brackets(qb => {
                    qb.where(company_id_query, filter)
                }));
            }

            if( isNotEmpty(search.discount_currency_type) && search.discount_currency_type !== '-1' && search.discount_currency_type !== -1 && global.ROLE[req.decodedUser.user_type - 1] == 'admin')
            {
                query = query.andWhere('A.currency_type = :discount_currency_type', {discount_currency_type: search.discount_currency_type})
            }
            if( isNotEmpty(search.discount_start) && (isNumber(search.discount_start) || isNumberString(search.discount_start)) )
                query = query.andWhere('user.discount >= ' + search.discount_start);
            if( isNotEmpty(search.discount_end) && (isNumber(search.discount_end) || isNumberString(search.discount_end)) )
                query = query.andWhere('user.discount <= ' + search.discount_end);

            if( isNotEmpty(search.total_request_numbers_start) && (isNumber(search.total_request_numbers_start) || isNumberString(search.total_request_numbers_start)) )
                query = query.andWhere('"t_r"."request_cnt" >= ' + search.total_request_numbers_start);
            if( isNotEmpty(search.total_request_numbers_end) && (isNumber(search.total_request_numbers_end) || isNumberString(search.total_request_numbers_end)) )
                query = query.andWhere('"t_r"."request_cnt" <= ' + search.total_request_numbers_end);

            if(global.ROLE[req.decodedUser.user_type - 1] === 'admin')
            {
                if (isNotEmpty(search.translate_currency_type) && search.translate_currency_type !== '-1' && search.translate_currency_type !== -1) {
                    if (search.translate_currency_type == 'KRW') {
                        if( isNotEmpty(search.total_translate_price_start) && (isNumber(search.total_translate_price_start) || isNumberString(search.total_translate_price_start)) )
                            query = query.andWhere('"t_r"."krw_work_sum" >= ' + search.total_translate_price_start);
                        if( isNotEmpty(search.total_translate_price_end) && (isNumber(search.total_translate_price_end) || isNumberString(search.total_translate_price_end)) )
                            query = query.andWhere('"t_r"."krw_work_sum" <= ' + search.total_translate_price_end);
                    }
                    else if (search.translate_currency_type == 'USD') {
                        if( isNotEmpty(search.total_translate_price_start) && (isNumber(search.total_translate_price_start) || isNumberString(search.total_translate_price_start)) )
                            query = query.andWhere('"t_r"."usd_work_sum" >= ' + search.total_translate_price_start);
                        if( isNotEmpty(search.total_translate_price_end) && (isNumber(search.total_translate_price_end) || isNumberString(search.total_translate_price_end)) )
                            query = query.andWhere('"t_r"."usd_work_sum" <= ' + search.total_translate_price_end);    
                    }
                    else if (search.translate_currency_type == 'JPY') {
                        if( isNotEmpty(search.total_translate_price_start) && (isNumber(search.total_translate_price_start) || isNumberString(search.total_translate_price_start)) )
                            query = query.andWhere('"t_r"."jpy_work_sum" >= ' + search.total_translate_price_start);
                        if( isNotEmpty(search.total_translate_price_end) && (isNumber(search.total_translate_price_end) || isNumberString(search.total_translate_price_end)) )
                            query = query.andWhere('"t_r"."jpy_work_sum" <= ' + search.total_translate_price_end);
                    }
                }
                else {
                    if (isNotEmpty(search.total_translate_price_start) && (isNumber(search.total_translate_price_start) || isNumberString(search.total_translate_price_start)) && search.total_translate_price_start != 0)
                    {
                        let and_or_query = '"t_r"."krw_work_sum" >= ' + search.total_translate_price_start + ' or "t_r"."usd_work_sum" >= ' + search.total_translate_price_start + ' or "t_r"."jpy_work_sum" >= ' + search.total_translate_price_start
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(and_or_query);
                        }));  
                    }
                    if (isNotEmpty(search.total_translate_price_end) && (isNumber(search.total_translate_price_end) || isNumberString(search.total_translate_price_end)) && search.total_translate_price_end != 0)
                    {    
                        let and_or_query = '("t_r"."krw_work_sum" > 0 and "t_r"."krw_work_sum" <= ' + search.total_translate_price_end + ') \
                        or ("t_r"."usd_work_sum" > 0 and "t_r"."usd_work_sum" <= ' + search.total_translate_price_end + ') \
                        or ("t_r"."jpy_work_sum" > 0 and "t_r"."jpy_work_sum" <= ' + search.total_translate_price_end + ')'

                        query = query.andWhere(new Brackets(qb => {
                            qb.where(and_or_query);
                        }));  
                    }
                }
            }
            else {
                if (isNotEmpty(search.total_translate_price_start) && (isNumber(search.total_translate_price_start) || isNumberString(search.total_translate_price_start)) && search.total_translate_price_start != 0) {  
                    let and_or_query = '"t_r"."krw_work_sum" >= ' + search.total_translate_price_start + ' or "t_r"."usd_work_sum" >= ' + search.total_translate_price_start + ' or "t_r"."jpy_work_sum" >= ' + search.total_translate_price_start
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(and_or_query);
                    }));  
                }
                if (isNotEmpty(search.total_translate_price_end) && (isNumber(search.total_translate_price_end) || isNumberString(search.total_translate_price_end)) && search.total_translate_price_end != 0) {
                    let and_or_query = '("t_r"."krw_work_sum" > 0 and "t_r"."krw_work_sum" <= ' + search.total_translate_price_end + ') \
                        or ("t_r"."usd_work_sum" > 0 and "t_r"."usd_work_sum" <= ' + search.total_translate_price_end + ') \
                        or ("t_r"."jpy_work_sum" > 0 and "t_r"."jpy_work_sum" <= ' + search.total_translate_price_end + ')'

                        query = query.andWhere(new Brackets(qb => {
                            qb.where(and_or_query);
                        }));  
                }
            }
            /*
            if( isNotEmpty(search.translate_currency_type) && search.translate_currency_type !== '-1' && search.translate_currency_type !== -1 && global.ROLE[req.decodedUser.user_type - 1] == 'admin')
            {
                query = query.andWhere('A.currency_type = :translate_currency_type', {translate_currency_type: search.translate_currency_type})
            }
            if( isNotEmpty(search.total_translate_price_start) && (isNumber(search.total_translate_price_start) || isNumberString(search.total_translate_price_start)) )
                query = query.andWhere('user.total_translate_price >= ' + search.total_translate_price_start);
            if( isNotEmpty(search.total_translate_price_end) && (isNumber(search.total_translate_price_end) || isNumberString(search.total_translate_price_end)) )
                query = query.andWhere('user.total_translate_price <= ' + search.total_translate_price_end);
            */
                
            if( isNotEmpty(search.free_req_cnt_start) && (isNumber(search.free_req_cnt_start) || isNumberString(search.free_req_cnt_start)) )
                query = query.andWhere('user.free_req_cnt >= ' + search.free_req_cnt_start);
            if( isNotEmpty(search.free_req_cnt_end) && (isNumber(search.free_req_cnt_end) || isNumberString(search.free_req_cnt_end)) )
                query = query.andWhere('user.free_req_cnt <= ' + search.free_req_cnt_end);
        }

        query = query.orderBy('"user"."create_date"', "DESC");

        let totals = await query.getCount()
        if( !(table === null || table === undefined) ) {
            query.offset((table.page - 1) * table.page_length)
                .limit(table.page_length);
        }

        let result = await query.getRawMany()
        let table_data: Array<any>;
        table_data = [];
        result.forEach(function(item) {
            let table_item: {[k: string]: any} = {};
            table_item = {
                id: item.id,
                user_id: item.login_id,
                user_name: item.user_name,
                phone_number: (isEmpty(item.phone_number) ? '' : (item.country_code + ' ' + item.phone_number)),
                email: item.user_email,
                discount: item.discount,
                free_req_cnt: item.free_req_cnt,
                currency_type: item.A_currency_type,
                total_request_numbers: item.request_cnt,
                total_translate_price_JPY: (item.A_currency_type === 'JPY' ? item.jpy_work_sum : 0),
                total_translate_price_KRW: (item.A_currency_type === 'KRW' ? item.krw_work_sum : 0),
                total_translate_price_USD: (item.A_currency_type === 'USD' ? item.usd_work_sum : 0),
                reg_date: item.create_date
            }

            /*
            if (global.ROLE[req.decodedUser.user_type - 1] === 'admin') {
                table_item.usd_work_price_sum = item.usd_work_sum;
                table_item.krw_work_price_sum = item.krw_work_sum;
                table_item.jpy_work_price_sum = item.jpy_work_sum;
            }
            else {
                if (item.A_currency_type === 'JPY')
                    table_item.work_price_sum = item.jpy_work_sum;
                else if (item.A_currency_type === 'KRW')
                    table_item.work_price_sum = item.krw_work_sum;
                else if (item.A_currency_type === 'USD')
                    table_item.work_price_sum = item.usd_work_sum;
            }
            */
            
            if(global.ROLE[req.decodedUser.user_type-1] === 'admin')
                table_item.company_name = item.A_company_name;
            
            table_data.push(table_item);
        });

        return res.json({ errorCode: 0, errorMsg: '', data: {list: table_data , totalCount: totals} });
    }

    static deleteRequester = async(req: Request, res: Response) => {
        const { ids } = req.body;
        if( !( isArray(ids) && ids.length > 0 ) )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            for(let i = 0; i < ids.length; i ++) {
                let index = ids[i]
                /*
                //remove translate pair
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(UsersWorkingLanguage)
                .where('"users_working_language"."userId" = :id', { id: index })
                    .execute();
                //remove from manager
                await getConnection()
                    .createQueryBuilder()
                    .delete()
                    .from(Manager)
                    .where('"manager"."requesterId" = :id', { id: index })
                    .execute();
                //remove from User
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(User)
                .where("id = :id", { id: index })
                .execute(); */
                await getConnection()
                .createQueryBuilder()
                .update(User)
                .set({
                    is_delete: Trigger.ON 
                })
                .where("id = :id", { id: index })
                .execute();
            }
            return res.json({ errorCode: 0, errorMsg: "" });
        }
        catch( error ) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }

    static detail = async (req: Request, res: Response) => {
        const {
            id
        } = req.body;
        if(isEmpty(id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        let userRepository = getRepository(User);
        try {
            let query = getRepository(User)
                        .createQueryBuilder("user")
                        .leftJoinAndSelect("user.parent", "parent")
                        .leftJoinAndSelect("user.requester_working_language", "working_language1")
                        .leftJoinAndSelect("user.working_languages", "users_working_language")
                        .leftJoinAndSelect("users_working_language.workingLanguage", "working_language")
                        .where('user.id = ' + id);
            let user = await query.getOne();
            if(user === undefined || user.is_delete === Trigger.ON)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if(global.ROLE[user.user_type - 1] !== 'requester') {
                return res.json({ errorCode: 1, errorMsg: 'Invalid Id, This is not requester id.' });
            }
            if(global.ROLE[req.decodedUser.user_type - 1] === 'company' && user.parent_id !== req.decodedUser.id) {
                return res.json({ errorCode: 2, errorMsg: 'Invalid Id, This is not valid id for you. ' });
            }
            
            let data: {[k: string]: any} = {};
            if(global.ROLE[req.decodedUser.user_type - 1] === 'company' || global.ROLE[req.decodedUser.user_type - 1] === 'manager')
                data.memo = isEmpty(user.company_memo) ? '' : user.company_memo;
            else
                data.memo = isEmpty(user.admin_memo) ? '' : user.admin_memo;
            data = {
                id: id,
                user_id: user.login_id,
                user_name: user.user_name,
                country_code: isEmpty(user.country_code) ? '' : user.country_code,
                phone_number: isEmpty(user.phone_number) ? '' : user.phone_number,
                email: user.user_email,
                system_lang: user.system_lang,
                sms_notice_check:  user.is_sms_notice_on,
                email_notice_check: user.is_email_notice_on,
                memo: ((global.ROLE[req.decodedUser.user_type - 1] === 'company' || global.ROLE[req.decodedUser.user_type - 1] === 'manager') ? user.company_memo : user.admin_memo),
                discount: user.discount,
                free_req_cnt: user.free_req_cnt,
                avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar),
                currency_type: user.parent.currency_type
            }
            if(user.requester_working_language != null && user.requester_working_language != undefined)
                data.original_language = {
                    id: user.requester_working_language.id,
                    name: user.requester_working_language.name
                };
            if(isNotEmpty(user.working_languages)){
                data.translate_languages = [];
                for(let i = 0; i < user.working_languages.length; i ++) {
                    data.translate_languages.push({
                        id: user.working_languages[i].workingLanguage.id,
                        name: user.working_languages[i].workingLanguage.name
                    });
                }
            }
            //고객사명
            let company_data;
            if(global.ROLE[req.decodedUser.user_type - 1] === 'admin')
                company_data = await userRepository.findOne(user.parent_id)
            else
                company_data = await userRepository.findOne(req.decodedUser.id)
            if(isEmpty(company_data)) {
                data.company_data = {
                    id: 0,
                    company_name: '',
                    company_id: ''
                }
            }
            else {
                data.company_data = {
                    id: user.parent_id,
                    company_name: company_data?.company_name,
                    company_id: company_data?.login_id
                }
            }
            data.extra = isEmpty(user.extra) ? '' : user.extra;
            return res.json({ errorCode: 0, errorMsg: "", data: data });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static checkValidYoutubeUrl = async(req: Request, res: Response) => {
        let { video_url } = req.body;
        if(isEmpty(video_url))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            let result = await validateUrl(video_url);
            let { data } = await axios.get('https://www.googleapis.com/youtube/v3/videos?id=' + result + '&key=' + config.YOUTUBE_API_KEY + '&part=snippet,contentDetails,statistics,status')
            if(data.items.length < 1)
                return res.json({ errorCode: 1, errorMsg: "Invalid Url" });
            return res.json({ errorCode: 0, errorMsg: '', data: {
                'title': data.items[0].snippet.title,
                'published_at': data.items[0].snippet.publishedAt,
                'description': data.items[0].snippet.description,
                'duration': calculate_duration(data.items[0].contentDetails.duration),
                'title_length': data.items[0].snippet.title.length,
                'description_length': data.items[0].snippet.description.length,
                'youtube_id': result
            } });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 1, errorMsg: "Invalid Url" });
        }
    }
    static getRequesterInfo = async (req: Request, res: Response) => {
        let { requester_id } = req.body;
        if(global.ROLE[req.decodedUser.user_type - 1] != 'requester' && isEmpty(requester_id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        else if(global.ROLE[req.decodedUser.user_type - 1] == 'requester')
            requester_id = req.decodedUser.id;
        try {
            const userRepository = getRepository(User);
            const user = await userRepository.findOne(requester_id)
            if(user === undefined) {
                res.json({ errorCode: 15, errorMsg: "invalid requester id." });
                return;
            }
            const _company = await userRepository.findOne(user.parent_id)
            if(_company === undefined) {
                res.json({ errorCode: 15, errorMsg: "invalid company id." });
                return;
            }
            let data: {[k: string]: any} = {};
            if(user.requester_working_language != null && user.requester_working_language != undefined)
                data.original_language = {
                    'name': user.requester_working_language.name,
                    'id': user.requester_working_language.id
                };
            if(isArray(user.working_languages) && user.working_languages.length > 0){
                data.working_languages = [];
                for(let i = 0; i < user.working_languages.length; i ++)
                    data.working_languages.push({
                        'id': user.working_languages[i].workingLanguage.id,
                        'name': user.working_languages[i].workingLanguage.name
                    })
            }
            data.free_request_count = isEmpty(user.free_req_cnt) ? 0 : user.free_req_cnt;
            data.discount = isEmpty(user.discount) ? 0 : user.discount;
            data.youtube_connected = user.is_youtube_connected;
            data.email = user.user_email;
            data.payment = _company.is_card_payment;
            return res.json({ errorCode: 0, errorMsg: '', data: data })
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
    static getAuthCode = async (req: Request, res: Response) => {
        let { code } = req.body;
        if(isEmpty(code))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.decodedUser.id)
            if(user == undefined)
                return res.json({ errorCode: 15, errorMsg: 'Invalid your id' });
            const param = {
                'code': code,
                'client_id': config.CLIENT_ID,
                'client_secret': config.SECRET,
                'redirect_uri': 'postmessage',
                'grant_type': 'authorization_code'
            };
            const options = {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                data: qs.stringify(param),
                url: "https://accounts.google.com/o/oauth2/token"
            };
            let { data } = await axios(options);

            user.access_token = data.access_token;
            user.refresh_token = data.refresh_token;
            user.access_token_issued_date = Math.floor(Date.now() / 1000);
            user.is_youtube_connected = Trigger.ON;

            let _result = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo?access_token=' + data.access_token);
            user.youtube_email = _result.data.email;
            user.youtube_name = _result.data.name;
            await userRepository.save(user);
            return res.json({errorCode: 0, errorMsg: '', data: {
                youtube_email: user.youtube_email,
                youtube_name: user.youtube_name
            }})
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static revokeToken = async(req: Request, res: Response) => {
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.decodedUser.id)
            if(user == undefined)
                return res.json({ errorCode: 15, errorMsg: 'Invalid your id' });
            if (Math.floor(Date.now() / 1000) - user.access_token_issued_date >= 3500) {
                const param = {
                    'client_id': config.CLIENT_ID,
                    'client_secret': config.SECRET,
                    'refresh_token': user.refresh_token,
                    'grant_type': 'refresh_token'
                };
                const options = {
                    method: 'POST',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    data: qs.stringify(param),
                    url: "https://accounts.google.com/o/oauth2/token"
                };
                let { data } = await axios(options);
                user.access_token = data.access_token;
                user.access_token_issued_date = Math.floor(Date.now() / 1000);
            }
            await axios.get('https://accounts.google.com/o/oauth2/revoke?token=' + user.access_token);
            user.is_youtube_connected = Trigger.OFF
            user.access_token = '';
            user.refresh_token = '';
            await userRepository.save(user);
            return res.json({errorCode: 0, errorMsg: ''})
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static youtubeApply = async (req: Request, res: Response) => {
        try {
            const { work_no } = req.body;
            if (isEmpty(work_no))
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            let query = getRepository(RequestDetail)
                .createQueryBuilder("request_detail")
                .leftJoinAndSelect("request_detail.request", "trans_request")
                .leftJoinAndSelect("request_detail.translate_language", "working_language")
                .leftJoinAndSelect("trans_request.user", "user")
                .where('"request_detail"."id" = :work_no', { work_no: work_no });
            let _request_detail = await query.getOne();
            if(_request_detail == undefined)
                return res.json({ errorCode: 15, errorMsg: "Invalid work-no id." });
            
            let user = _request_detail.request.user
            if (user.is_youtube_connected == Trigger.OFF) 
                return res.json({ errorCode: 101, errorMsg: "This account is not connected to  youtube account." , complete: true});
            
            if (Math.floor(Date.now() / 1000) - user.access_token_issued_date >= 3500) {
                const param = {
                    'client_id': config.CLIENT_ID,
                    'client_secret': config.SECRET,
                    'refresh_token': user.refresh_token,
                    'grant_type': 'refresh_token'
                };
                const options = {
                    method: 'POST',
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    data: qs.stringify(param),
                    url: "https://accounts.google.com/o/oauth2/token"
                };
                let { data } = await axios(options);
                user.access_token = data.access_token;
                user.access_token_issued_date = Math.floor(Date.now() / 1000);
                await getConnection().manager.save(user);
            }
             
            
            let title = '', video_path = '';
            
            
            /*
            let language = '';
                
            if (_request_detail.translate_language.id == 1) {
                language = 'ko'
            }
            else if (_request_detail.translate_language.id == 2) {
                language = 'en'
            }
            else if (_request_detail.translate_language.id == 3) {
                language = 'ja'
            }
            else if (_request_detail.translate_language.id == 4) {
                language = 'zh-Hans'
            }
            else if (_request_detail.translate_language.id == 5) {
                language = 'zh-Hant'
            }
            else if (_request_detail.translate_language.id == 6) {
                language = 'id'
            }
            else if (_request_detail.translate_language.id == 7) {
                language = 'vi'
            }
            else if (_request_detail.translate_language.id == 8) {
                language = 'th'
            }
            else if (_request_detail.translate_language.id == 9) {
                language = 'es'
            } 
            */

            if (_request_detail.request.is_title_desc == Trigger.ON) {
                if (_request_detail.request.is_native_review == Trigger.ON) {
                    title = isEmpty(_request_detail.review_title) ? 'apply_subtitle' : _request_detail.review_title
                }
                else {
                    title = isEmpty(_request_detail.translate_title) ? 'apply_subtitle' : _request_detail.translate_title
                }
            }
            else {
                title = _request_detail.request.title
            }

            if (_request_detail.request.is_native_review == Trigger.ON) {
                video_path = config.LOCATION_TRANSLATE_PATH + _request_detail.review_video
            }
            else {
                video_path = config.LOCATION_TRANSLATE_PATH + _request_detail.translate_video
            }
            youtube_caption_apply(res, user.access_token, title, video_path, _request_detail.translate_language.id, _request_detail);
            /*
            youtube.captions.insert({
                part: ['id', 'snippet'],
                requestBody: {
                    snippet: {
                        videoId: _request_detail.request.youtube_id,
                        language: language,
                        name: title,
                        isDraft: (user.youtube_apply_type == 1 ? false : true)
                    }
                },
                media: {
                    body: fs.createReadStream(video_path)    
                },
                sync: true
            },
            (err: any, _data: any) => {
                if (_request_detail == undefined)
                {
                    console.log("undefined--", _request_detail)    
                    return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
                }    
                if (err) {
                    // console.log('data', err.response.status)
                    let _log = new Log();
                    _log.create_date = Math.floor(Date.now() / 1000);
                    _log.update_date = Math.floor(Date.now() / 1000);
                    _log.user = _request_detail.request.user;
                    _log.request = _request_detail;
                    _log.status = global.STATUS.indexOf("subtitle_apply_failed") + 1;
                    getConnection().manager.save(_log);
                    _request_detail.youtube_applying = Trigger.OFF
                    _request_detail.status = 9
                    getConnection().manager.save(_request_detail)   
                    return res.json({ errorCode: err.response.status, errorMsg: "Caption apply failed" });
                }
                console.log("applying srt file done")
                //console.log("done------", data)
                let _log = new Log();
                _log.create_date = Math.floor(Date.now() / 1000);
                _log.update_date = Math.floor(Date.now() / 1000);
                _log.user = _request_detail.request.user;
                _log.request = _request_detail;
                _log.status = global.STATUS.indexOf("subtitle_apply") + 1;
                getConnection().manager.save(_log);
                _request_detail.youtube_applying = Trigger.OFF
                _request_detail.status = 8
                getConnection().manager.save(_request_detail)   
                return res.json({errorCode: 0, errorMsg: ''});
            })  */          
            return;
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default RequesterController;