import { get_id_from_pair_array, getIntVal, getDecimalFormatFloatVal, generateRandomString } from './../helpers/utils';
import { CompanyPrice } from './../entity/company-price';
import { CompanyService } from './../entity/company-service';
import { WorkingLanguage } from './../entity/working-language';
import { UsersTranslatePair } from './../entity/users-translate-pair';
import { isArray, isNotEmpty, isEmpty } from 'class-validator';
import { EndTimeSetting } from './../entity/end-time-setting';
import { Tag } from './../entity/tag';
import { WorkerAssignSettingTag } from './../entity/worker-assign-setting-tag';
import { WorkerAssignSetting } from './../entity/worker-assign-setting';
import { ScreenTimeLimit } from './../entity/screen-time-limit';
import { Request, Response } from "express";
import { User } from './../entity/user';
import { getRepository, getConnection } from "typeorm";
import global from '../config/global';
import config from '../config/config';
import fs from "fs";
import { Trigger } from './../entity/entity-enum';
import lang from "../lang/index";
import { sendEmail } from './../helpers/notice-method';
import { getWorkerCountByTags } from './../helpers/utils';

class CompanyController {
    static registerCompany = async (req: Request, res: Response) => {

        //패어별 금액 설정은 차후 진행
        const {
            user_id, //아이디
            user_pwd,
            company_name,
            user_name,
            country_code,
            phone_number,
            email,
            system_lang,
            currency_type, //결제 기준 화페
            title_cost, //제목 설명 비용
            premium_rate, //긴급번역 할증율
            is_base_price_set, //금액 일괄설정
            general_screen_limit,  //일반번역 영상길이
            general_end_time,   //초과시 요청자에게 표시되는 번역완료 예상일시는 계산되는 마감시간 총합 + 
            emergency_screen_limit, //긴급번역
            free_screen_limit, //무료요청 가능 영상길이
            //작업자 할당설정
            // assign_type -> 1: 푸시발송 , 2:  수동 할당
            tc_assign_type, tc_tags, tc_numbers,
            translator_assign_type, translator_tags, translator_numbers,
            reviewer_assign_type, reviewer_tags, reviewer_numbers, //작업자 할당설정   tags 가 -1일떄는 전체 선택
            //작업자 마감시간 설정
            general_trans_time,
            general_trans_add_time,
            general_excess_time,
            general_excess_add_time,
            emergency_trans_time,
            emergency_add_time,
            use_terms,
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
            else
                user = await userRepository.findOneOrFail(id);
            if(req.files) {
                if(Object.create(req.files)['file']) {
                    if(isNotEmpty(user.avatar))
                        fs.unlinkSync(config.LOCATION_PATH + '/'  + user.avatar)
                    user.avatar = Object.create(req.files)['file'][0]['filename'];
                }
                if(Object.create(req.files)['logo']) {
                    if(isNotEmpty(user.company_logo))
                        fs.unlinkSync(config.LOCATION_PATH + '/'  + user.company_logo)
                    user.company_logo = Object.create(req.files)['logo'][0]['filename'];
                }
            }
            if(isEmpty(id)) {
                user.create_date = Math.floor(Date.now() / 1000);
                user.services = [];
                user.end_time_settings = [];
                user.assigns = [];
                user.language_pairs = [];
                user.prices = [];
                user.player_id = generateRandomString(24);
            }
            user.update_date = Math.floor(Date.now() / 1000);
            user.user_type = global.ROLE.indexOf("company") + 1;
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

            user.company_name = company_name;
            user.user_name = user_name;
            user.user_email = email;
            user.country_code = country_code;
            user.phone_number = phone_number;
            user.system_lang = system_lang;
            user.currency_type = currency_type;
            user.title_cost = getDecimalFormatFloatVal(title_cost);
            user.premium_rate = getDecimalFormatFloatVal(premium_rate);
            user.is_base_price_set = is_base_price_set;

            //영상시간 제한 설정 (edit process)
            if(isEmpty(id)) {
                let screenTimeLimit = new ScreenTimeLimit();
                screenTimeLimit.create_date = Math.floor(Date.now() / 1000);
                screenTimeLimit.update_date = Math.floor(Date.now() / 1000);
                screenTimeLimit.general_screen_limit = getIntVal(general_screen_limit);
                screenTimeLimit.general_end_time = getIntVal(general_end_time);
                screenTimeLimit.emergency_screen_limit = getIntVal(emergency_screen_limit);
                screenTimeLimit.free_screen_limit = getIntVal(free_screen_limit);

                await getConnection().manager.save(screenTimeLimit);
                user.screen_time_limit = screenTimeLimit;
            }
            else {
                user.screen_time_limit.update_date = Math.floor(Date.now() / 1000);
                user.screen_time_limit.general_screen_limit = getIntVal(general_screen_limit);
                user.screen_time_limit.general_end_time = getIntVal(general_end_time);
                user.screen_time_limit.emergency_screen_limit = getIntVal(emergency_screen_limit);
                user.screen_time_limit.free_screen_limit = getIntVal(free_screen_limit);

                await getConnection().manager.save(user.screen_time_limit);
            }
            //작업자 할당 설정 (edit process)
            for(let item = 4; item <= 6; item ++) {
                let tcWorkerAssignSetting;
                if(isEmpty(id)) {
                    tcWorkerAssignSetting = new WorkerAssignSetting();
                    tcWorkerAssignSetting.setting_tags = []
                }
                else
                    tcWorkerAssignSetting = user.assigns[item - 4]
                let __tags = [];
                if(item == 4) {
                    tcWorkerAssignSetting.assign_type = tc_assign_type;
                    if(isEmpty(tc_numbers))
                        tcWorkerAssignSetting.numbers = 0;
                    else
                        tcWorkerAssignSetting.numbers = tc_numbers;
                    __tags = tc_tags;
                }
                else if(item == 5) {
                    tcWorkerAssignSetting.assign_type = translator_assign_type;
                    if(isEmpty(translator_numbers))
                        tcWorkerAssignSetting.numbers = 0;
                    else
                        tcWorkerAssignSetting.numbers = translator_numbers;
                    __tags = translator_tags;
                }
                else if(item == 6) {
                    tcWorkerAssignSetting.assign_type = reviewer_assign_type;
                    if(isEmpty(reviewer_numbers))
                        tcWorkerAssignSetting.numbers = 0;
                    else
                        tcWorkerAssignSetting.numbers = reviewer_numbers;
                    __tags = reviewer_tags;
                }
                tcWorkerAssignSetting.create_date = Math.floor(Date.now() / 1000);
                tcWorkerAssignSetting.update_date = Math.floor(Date.now() / 1000);
                tcWorkerAssignSetting.worker_type = item;

                if(isEmpty(__tags))
                    __tags = []
                if( !isArray(__tags) && (__tags === -1 || __tags === '-1') )
                {
                    tcWorkerAssignSetting.tag_type = 2;
                    __tags = []
                }
                else {
                    tcWorkerAssignSetting.tag_type = 1;
                }

                let setting_tags = [], add_setting_tags = []
                for(let i = 0; i < tcWorkerAssignSetting.setting_tags.length; i ++) {
                    setting_tags.push(tcWorkerAssignSetting.setting_tags[i].tag.id)
                    if(__tags.indexOf(tcWorkerAssignSetting.setting_tags[i].tag.id) < 0){
                        await getConnection()
                        .createQueryBuilder()
                        .delete()
                        .from(WorkerAssignSettingTag)
                        .where('"worker_assign_setting_tag"."tagId" = :tag_id and "worker_assign_setting_tag"."workerAssignSettingId" = :worker_assign_setting_id', {
                            tag_id: tcWorkerAssignSetting.setting_tags[i].tag.id,
                            worker_assign_setting_id: tcWorkerAssignSetting.id
                        })
                        .execute();
                    }
                }
                for(let i = 0; i < __tags.length; i ++) {
                    if(setting_tags.indexOf(__tags[i]) < 0)
                        add_setting_tags.push(__tags[i])
                }
                const tagRepository = getRepository(Tag);
                for(let i = 0; i < add_setting_tags.length; i ++) {
                    let workerAssignSettingTag = new WorkerAssignSettingTag();
                    workerAssignSettingTag.create_date = Math.floor(Date.now() / 1000);
                    workerAssignSettingTag.update_date = Math.floor(Date.now() / 1000);
                    const _tag = await tagRepository.findOneOrFail(add_setting_tags[i]);
                    workerAssignSettingTag.tag = _tag;
                    await getConnection().manager.save(workerAssignSettingTag);
                    tcWorkerAssignSetting.setting_tags.push(workerAssignSettingTag);
                }
                await getConnection().manager.save(tcWorkerAssignSetting);
                if(isEmpty(id))
                    user.assigns.push(tcWorkerAssignSetting);
            }
            //작업자 마감시간 설정 (edit process)
            if(isEmpty(id)) {
                for(let item = 4; item <= 6; item ++) {
                    let endTimeSetting = new EndTimeSetting();
                    endTimeSetting.create_date = Math.floor(Date.now() / 1000);
                    endTimeSetting.update_date = Math.floor(Date.now() / 1000);
                    endTimeSetting.work_type = item;
                    endTimeSetting.general_trans_time = getIntVal(general_trans_time[item - 4]);
                    endTimeSetting.general_trans_add_time = getIntVal(general_trans_add_time[item - 4]);
                    endTimeSetting.general_excess_time = getIntVal(general_excess_time[item - 4]);
                    endTimeSetting.general_excess_add_time = getIntVal(general_excess_add_time[item - 4]);
                    endTimeSetting.emergency_trans_time = getIntVal(emergency_trans_time[item - 4]);
                    endTimeSetting.emergency_add_time = getIntVal(emergency_add_time[item - 4]);
                    await getConnection().manager.save(endTimeSetting);
                    user.end_time_settings.push(endTimeSetting);
                }
            }
            else {
                for(let item = 4; item <= 6; item ++) {
                    user.end_time_settings[item - 4].update_date = Math.floor(Date.now() / 1000);
                    user.end_time_settings[item - 4].general_trans_time = getIntVal(general_trans_time[item - 4]);
                    user.end_time_settings[item - 4].general_trans_add_time = getIntVal(general_trans_add_time[item - 4]);
                    user.end_time_settings[item - 4].general_excess_time = getIntVal(general_excess_time[item - 4]);
                    user.end_time_settings[item - 4].general_excess_add_time = getIntVal(general_excess_add_time[item - 4]);
                    user.end_time_settings[item - 4].emergency_trans_time = getIntVal(emergency_trans_time[item - 4]);
                    user.end_time_settings[item - 4].emergency_add_time = getIntVal(emergency_add_time[item - 4]);
                    await getConnection().manager.save(user.end_time_settings[item - 4]);
                }
            }
            user.use_terms = use_terms
            //알림톡 SMS 알림
            if(req.body.sms_notice_check !== undefined)
                user.is_sms_notice_on = req.body.sms_notice_check;
            //이메일 알림
            if(req.body.email_notice_check !== undefined)
                user.is_email_notice_on = req.body.email_notice_check;
            //관리자 메모
            if(req.body.memo !== undefined)
                user.admin_memo = req.body.memo;
            //요청시, 카드결제
            if(req.body.card_payment_check !== undefined)
                user.is_card_payment = req.body.card_payment_check;
            //서비스 상세 (edit process)
            if(isEmpty(req.body.services))
                req.body.services = []
            if(req.body.services !== undefined && isArray(req.body.services)) {
                let service_ids = [], add_service_ids = []
                for(let i = 0; i < user.services.length; i ++) {
                    service_ids.push(user.services[i].detail_service_type)
                    if(req.body.services.indexOf(user.services[i].detail_service_type) < 0) {
                        await getConnection()
                        .createQueryBuilder()
                        .delete()
                        .from(CompanyService)
                        .where('"company_service"."userId" = :id and "company_service"."detail_service_type" = :detail_service_type', {
                            id: id, detail_service_type: user.services[i].detail_service_type
                        })
                        .execute();
                        if (user.services[i].detail_service_type == 1)
                            user.has_tc_service = Trigger.OFF
                    }
                }
                for (let i = 0; i < req.body.services.length; i++) {
                    if (req.body.services[i] == 1) 
                        user.has_tc_service = Trigger.ON
                    if(service_ids.indexOf(req.body.services[i]) < 0)
                        add_service_ids.push(req.body.services[i]);
                }
                for(let item = 0; item < add_service_ids.length; item ++) {
                    let companyService = new CompanyService();
                    companyService.create_date = Math.floor(Date.now() / 1000);
                    companyService.update_date = Math.floor(Date.now() / 1000);
                    companyService.detail_service_type = add_service_ids[item];
                    await getConnection().manager.save(companyService);
                    user.services.push(companyService);
                }
            }

            //작업 언어 (edit process) && 작업 가격
            if(isEmpty(req.body.original_languages))
                req.body.original_languages = []
            if(isEmpty(req.body.translate_languages))
                req.body.translate_languages = []
            if(req.body.original_languages !== undefined && isArray(req.body.original_languages)
                && req.body.translate_languages !== undefined && isArray(req.body.translate_languages)) {
                let user_original_ids = [], user_translate_ids = [];
                let add_user_original_ids = [], add_user_translate_ids = [];
                for(let i = 0; i < user.language_pairs.length; i ++) {
                    user_original_ids.push(user.language_pairs[i].original.id);
                    user_translate_ids.push(user.language_pairs[i].translate.id);
                    if(get_id_from_pair_array(user.language_pairs[i].original.id, user.language_pairs[i].translate.id, req.body.original_languages, req.body.translate_languages) < 0) {
                        await getConnection()
                        .createQueryBuilder()
                        .delete()
                        .from(UsersTranslatePair)
                        .where('"users_translate_pair"."userId" = :id and "users_translate_pair"."originalId" = :original_id and "users_translate_pair"."translateId" = :translate_id', {
                            id: id, original_id: user.language_pairs[i].original.id,translate_id: user.language_pairs[i].translate.id
                        })
                        .execute();
                    }
                }
                for(let i = 0; i < req.body.original_languages.length; i ++) {
                    if(get_id_from_pair_array(req.body.original_languages[i], req.body.translate_languages[i], user_original_ids, user_translate_ids) < 0) {
                        add_user_original_ids.push(req.body.original_languages[i]);
                        add_user_translate_ids.push(req.body.translate_languages[i]);
                    }
                }
                const wRepository = getRepository(WorkingLanguage);
                const u_t_pRepository = getRepository(UsersTranslatePair);
                for(let i = 0; i < add_user_original_ids.length; i ++) {
                    let u_t_p = new UsersTranslatePair();
                    u_t_p.create_date = Math.floor(Date.now() / 1000);
                    u_t_p.update_date = Math.floor(Date.now() / 1000);
                    let origin_w = await wRepository.findOneOrFail(add_user_original_ids[i]);
                    let translate_w = await wRepository.findOneOrFail(add_user_translate_ids[i]);
                    u_t_p.original = origin_w;
                    u_t_p.translate = translate_w;
                    await u_t_pRepository.save(u_t_p);
                    user.language_pairs.push(u_t_p);
                }
            }
            //작업 가격
            if(req.body.original_languages !== undefined && isArray(req.body.original_languages)
                && req.body.translate_languages !== undefined && isArray(req.body.translate_languages)) {
                    let user_original_ids = [], user_translate_ids = [], add_company_price_ids = [];
                    for(let i = 0; i < user.prices.length; i ++) {
                        user_original_ids.push(user.prices[i].original.id);
                        user_translate_ids.push(user.prices[i].translate.id);
                        if(get_id_from_pair_array(user.prices[i].original.id, user.prices[i].translate.id, req.body.original_languages, req.body.translate_languages) < 0) {
                            await getConnection()
                            .createQueryBuilder()
                            .delete()
                            .from(CompanyPrice)
                            .where('"company_price"."userId" = :id and "company_price"."originalId" = :original_id and "company_price"."translateId" = :translate_id', {
                                id: id, original_id: user.prices[i].original.id, translate_id: user.prices[i].translate.id
                            })
                            .execute();
                        }
                    }
                    for(let i = 0; i < req.body.original_languages.length; i ++) {
                        let find_index = get_id_from_pair_array(req.body.original_languages[i], req.body.translate_languages[i], user_original_ids, user_translate_ids)
                        if(find_index < 0) {
                            add_company_price_ids.push({
                                original_id: req.body.original_languages[i],
                                translate_id: req.body.translate_languages[i],
                                work_price: req.body.work_price[i],
                                native_review_price: req.body.native_review_price[i],
                                tc_price: req.body.tc_price[i],
                                trans_price: req.body.trans_price[i],
                                test_price: req.body.test_price[i]
                            });
                        }
                        else {
                            user.prices[find_index].update_date = Math.floor(Date.now() / 1000);
                            user.prices[find_index].work_price = getDecimalFormatFloatVal(req.body.work_price[i]);
                            user.prices[find_index].native_review_price = getDecimalFormatFloatVal(req.body.native_review_price[i]);
                            user.prices[find_index].tc_price = getDecimalFormatFloatVal(req.body.tc_price[i]);
                            user.prices[find_index].trans_price = getDecimalFormatFloatVal(req.body.trans_price[i]);
                            user.prices[find_index].test_price = getDecimalFormatFloatVal(req.body.test_price[i]);
                            await getConnection().manager.save(user.prices[find_index]);
                        }
                    }
                    const wRepository = getRepository(WorkingLanguage);
                    const companyPriceRepository = getRepository(CompanyPrice);
                    for(let i = 0; i < add_company_price_ids.length; i ++) {
                        let company_price = new CompanyPrice();
                        company_price.create_date = Math.floor(Date.now() / 1000);
                        company_price.update_date = Math.floor(Date.now() / 1000);
                        let origin_w = await wRepository.findOneOrFail(add_company_price_ids[i].original_id);
                        let translate_w = await wRepository.findOneOrFail(add_company_price_ids[i].translate_id);
                        company_price.original = origin_w;
                        company_price.translate = translate_w;
                        company_price.work_price = getDecimalFormatFloatVal(add_company_price_ids[i].work_price);
                        company_price.native_review_price = getDecimalFormatFloatVal(add_company_price_ids[i].native_review_price);
                        company_price.tc_price = getDecimalFormatFloatVal(add_company_price_ids[i].tc_price);
                        company_price.test_price = getDecimalFormatFloatVal(add_company_price_ids[i].test_price);
                        company_price.trans_price = getDecimalFormatFloatVal(add_company_price_ids[i].trans_price);
                        await companyPriceRepository.save(company_price);
                        user.prices.push(company_price)
                    }
            }
            await getConnection().manager.save(user);

            if (isEmpty(id) && !isEmpty(password_gen) && password_gen == 'Y' && !isEmpty(email)) {
                let template_obj: { [k: string]: any } = {};
                template_obj.site_url = config.SITE_URL;
                template_obj.domain = user_id;
                template_obj.userid = user_id;
                template_obj.password = gen_pwd;      
                sendEmail(email, system_lang, lang[user.system_lang]['email']['client_a05'], 'client_a05', template_obj);
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
        keyword_type: 1,   // 1: 회사명 , 2: 아이디 , 3: 담당자명 , 4: 전화번호 , 5: 이메일
        search_keyword: 'asdf',   //검색어
        search_type: 1,    // 1: 포함 , 2: 일치
        total_request_numbers_start: 0, //총 요청수 범위
        total_request_numbers_end: 0,
        currency_type: 'JPY' , 'KRW' , 'USD' , -1,
        total_translate_price_start: 0,
        total_translate_price_end: 0,
    }
    */
    static getCompanyList = async(req: Request, res: Response) => {
        const {
            table,
            search
        } = req.body;
        let query =  getRepository(User)
                    .createQueryBuilder("user");
        {
            query = query.where("user.user_type = :user_type", { user_type: 2 });
            query = query.andWhere('"user"."is_delete" = \'N\'')
        }

        if( !(search === null || search === undefined) ) {
            //검색어
            if( isNotEmpty(search.search_keyword) ) {
                let field_name = '';
                switch(search.keyword_type) {
                    case 1:
                        field_name = 'user.company_name'
                        break;
                    case 2:
                        field_name = 'user.login_id'
                        break;
                    case 3:
                        field_name = 'user.user_name'
                        break;
                    case 4:
                        field_name = 'user.phone_number'
                        break;
                    case 5:
                        field_name = 'user.user_email'
                        break;
                }
                if(search.search_type == 1)
                    query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                else
                    query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
            }

            //총 요청수
            if( !(search.total_request_numbers_start === '' || search.total_request_numbers_start === null) )
                query = query.andWhere('user.total_request_numbers >= ' + search.total_request_numbers_start);
            if( !(search.total_request_numbers_end === '' || search.total_request_numbers_end === null) )
                query = query.andWhere('user.total_request_numbers <= ' + search.total_request_numbers_end);

            if( !(search.currency_type === '' || search.currency_type === -1 || search.currency_type === null || search.currency_type === undefined) )
            {
                query = query.andWhere('user.currency_type = :field_name', {field_name: search.currency_type});
            }
            if( !(search.total_translate_price_start === '' || search.total_translate_price_start === null) )
                query = query.andWhere('user.total_translate_price >= ' + search.total_translate_price_start);
            if( !(search.total_translate_price_end === '' || search.total_translate_price_end === null) )
                query = query.andWhere('user.total_translate_price <= ' + search.total_translate_price_end);
        }
        query = query.orderBy('"user"."create_date"', "DESC");
        let totals = await query.getCount()
        if( !(table === null || table === undefined) ) {
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
                company_name: item.company_name,
                user_name: item.user_name,
                phone_number: item.country_code + ' ' + item.phone_number,
                email: item.user_email,
                // currency_type: item.currency_type,
                total_request_numbers: item.total_request_numbers,
                // total_translate_price: item.total_translate_price,
                total_translate_price_JPY: item.currency_type === 'JPY' ? item.total_translate_price : 0,
                total_translate_price_KRW: item.currency_type === 'KRW' ? item.total_translate_price : 0,
                total_translate_price_USD: item.currency_type === 'USD' ? item.total_translate_price : 0,
                reg_date: item.create_date
            }
            table_data.push(table_item);
        });
        return res.json({ errorCode: 0, errorMsg: '', data: {list: table_data , totalCount: totals} });
    };
    static getLanguagePairs = async(req: Request, res: Response) => {
        if( global.ROLE[req.decodedUser.user_type - 1] == 'admin' && !( req.body.company_id ))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        let company_id = 0;
        let userRepository = getRepository(User);
        if(global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'company')
            company_id = (global.ROLE[req.decodedUser.user_type - 1] == 'admin') ? req.body.company_id : req.decodedUser.id;
        else {
            let requester_user = await userRepository.findOne(req.decodedUser.id)
            if(requester_user == undefined)
                return res.json({errorCode: 15, errorMsg: 'Invalid company id.'})
            company_id = requester_user.parent_id
        }
        try {
            let user = await userRepository.findOneOrFail(company_id)
            let data: { original_language: { id: number; name: string; }; translate_language: { id: number; name: string; }; }[] = [];
            user.language_pairs.forEach(function(item) {
                data.push({
                    "original_language": {
                        "id": item.original.id,
                        "name": item.original.name
                    },
                    "translate_language": {
                        "id": item.translate.id,
                        "name": item.translate.name
                    }
                })
            })
            return res.json({errorCode: 0, errorMsg: '', data: data })
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static deleteCompany = async(req: Request, res: Response) => {
        const { ids } = req.body;
        if( !( isArray(ids) && ids.length > 0 ) )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            // let userRepository = getRepository(User);
            for(let i = 0; i < ids.length; i ++) {
                let index = ids[i]
                /*
                //remove translate pair
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(UsersTranslatePair)
                .where('"users_translate_pair"."userId" = :id', { id: index })
                .execute();
                //remove
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(CompanyPrice)
                .where('"company_price"."userId" = :id', { id: index })
                .execute();
                //remove end-time-setting
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(EndTimeSetting)
                .where('"end_time_setting"."userId" = :id', { id: index })
                .execute();
                //remove company service
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(CompanyService)
                .where('"company_service"."userId" = :id', { id: index })
                .execute();
                //remove company price
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(CompanyPrice)
                .where('"company_price"."userId" = :id', { id: index })
                .execute();
                //worker Assign Setting
                let assignSetting = await getRepository(WorkerAssignSetting)
                                    .createQueryBuilder("worker_assign_setting")
                                    .where('"worker_assign_setting"."userId" = :field_name', {field_name: index})
                                    .getMany()
                for(let item = 0; item < assignSetting.length; item ++) {
                    await getConnection()
                    .createQueryBuilder()
                    .delete()
                    .from(WorkerAssignSettingTag)
                    .where('"worker_assign_setting_tag"."workerAssignSettingId" = :id', { id: assignSetting[item].id })
                    .execute();
                }
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(WorkerAssignSetting)
                .where('"worker_assign_setting"."userId" = :id', { id: index })
                .execute();
                //remove screen-time-limit
                //
                let user = await userRepository.findOne(index)
                if(user == undefined)
                    continue;
                let ScreenTimeLimitId = user.screen_time_limit.id
                //remove from User
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(User)
                .where("id = :id", { id: index })
                .execute();
                //remove  screen_time_limit
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(ScreenTimeLimit)
                .where("id = :id", { id: ScreenTimeLimitId })
                .execute();
                */
               await getConnection()
               .createQueryBuilder()
               .update(User)
               .set({
                   is_delete: Trigger.ON 
               })
               .where("id = :id", { id: index })
               .execute();
            }
            return res.json({ errorCode: 0, errorMsg: ""});
        }
        catch (error) {
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
            let user = await userRepository.findOne(id);
            if(user === undefined || user.is_delete === Trigger.ON)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            if(global.ROLE[user.user_type - 1] !== 'company')
                return res.json({ errorCode: 1, errorMsg: 'Invalid Id, This is not company id.' });
            let data: {[k: string]: any} = {};
            data = {
                id: id,
                user_id: user.login_id,
                avatar: (user.avatar === null || user.avatar === '') ? '' : ( config.IMAGE_PREFIX_URL + user.avatar ),
                company_logo: (user.company_logo === null || user.company_logo === '') ? '' : (config.IMAGE_PREFIX_URL + user.company_logo),
                company_name: user.company_name,
                user_name: user.user_name,
                country_code: user.country_code,
                phone_number: user.phone_number,
                email: user.user_email,  //이메일
                system_lang: user.system_lang, //시스템 언어
                use_terms: user.use_terms,
                sms_notice_check:  user.is_sms_notice_on, //알림톡 / SMS 알림
                email_notice_check: user.is_email_notice_on, //이메일 알림
                payment_check: user.is_card_payment,  //요청시 , 카드결제 Y / N
                is_base_price_set: user.is_base_price_set, //번역 및 작업금액을 언어쌍별로 설정하시겠습니까? Y / N
                title_cost: user.title_cost, // 제목 / 설명 번역비용
                premium_rate: user.premium_rate, // 긴급번역 (24시간) 할증율
                memo: isEmpty(user.admin_memo) ? '' : user.admin_memo, // 관리자용 메모
                currency_type: user.currency_type
            }
            //서비스
            let services = [];
            for(let i = 0; i < user.services.length; i ++)
                services.push(user.services[i].detail_service_type)
            data.services = services
            //자막번역
            if(isArray(user.language_pairs)) {
                let working_languages = [];
                for(let i = 0; i < user.language_pairs.length; i ++)
                    working_languages.push({
                        original: {
                            id: user.language_pairs[i].original.id,
                            name: user.language_pairs[i].original.name
                        },
                        translate: {
                            id: user.language_pairs[i].translate.id,
                            name: user.language_pairs[i].translate.name
                        }
                    })
                data.working_languages = working_languages;
            }
            //가격
            if(isArray(user.prices) && user.prices.length > 0) {
                data.prices = [];
                for(let i = 0; i < user.prices.length; i ++) {
                    data.prices.push({
                        original: {
                            id: user.prices[i].original.id,
                            name: user.prices[i].original.name
                        },
                        translate: {
                            id: user.prices[i].translate.id,
                            name: user.prices[i].translate.name
                        },
                        work_price: user.prices[i].work_price,
                        native_review_price: user.prices[i].native_review_price,
                        tc_price: user.prices[i].tc_price,
                        trans_price: user.prices[i].trans_price,
                        test_price: user.prices[i].test_price
                    })
                }
            }
            //영상시간 제한 설정
            data.general_screen_limit = user.screen_time_limit.general_screen_limit; //48시간 번역가능 영상길이 * 분 이하
            data.general_end_time = user.screen_time_limit.general_end_time; //마감시간 총합 +*분으로 산출
            data.emergency_screen_limit = user.screen_time_limit.emergency_screen_limit; //긴급번역 24시간 영상길이 *분 이하,
            data.free_screen_limit = user.screen_time_limit.free_screen_limit; //무료 요청 가능 영상길이 * 분 이하,초과시 무료요청 불가
            //작업자 할당 설정
            let assigns: {[k: string]: any} = {};
            for(let i = 0; i < user.assigns.length; i ++) {
                let _tags: string[] = [];
                let _tag_ids: number[] = [];
                user.assigns[i].setting_tags.forEach(function (detail) {
                    _tags.push(detail.tag.name)
                    _tag_ids.push(detail.tag.id)
                })
                let tag_object_numbers = await getWorkerCountByTags(global.ROLE[user.assigns[i].worker_type - 1], _tag_ids)
                assigns = {
                    ...assigns,
                    [global.ROLE[user.assigns[i].worker_type - 1]]: {
                            assign_type: user.assigns[i].assign_type, //1: 푸시발송 , 2: 수동할당
                            tag_type: user.assigns[i].tag_type, //1: 일반 2: 태그 전체 선택한 경우
                            numbers: tag_object_numbers, //대상 수
                            tags_name: _tags, //태그 목록
                            tags_id: _tag_ids
                    }
                }
            }
            data.assigns = assigns;
            //작업자 마감설정
            let end_time_settings: {[k: string]: any} = {};
            for(let i = 0; i < user.end_time_settings.length; i ++) {
                end_time_settings = {
                    ...end_time_settings,
                    [global.ROLE[user.end_time_settings[i].work_type - 1]] : {
                        general_trans_time: user.end_time_settings[i].general_trans_time, //일반 번역 48시간 분당 번역시간
                        general_trans_add_time: user.end_time_settings[i].general_trans_add_time, //일반 번역 48시간 추가시간
                        general_excess_time: user.end_time_settings[i].general_excess_time, //초과번역 분당 번역시간
                        general_excess_add_time: user.end_time_settings[i].general_excess_add_time, // 초과번역 추가시간
                        emergency_trans_time: user.end_time_settings[i].emergency_trans_time, //긴급번역 분당 번역시간
                        emergency_add_time: user.end_time_settings[i].emergency_add_time //긴급번역 추가시간
                    }
                }
            }
            data.end_time_settings = end_time_settings;
            return res.json({ errorCode: 0, errorMsg: "", data: data });
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getCompanyInfo = async (req: Request, res: Response) => {
        let { company_id } = req.body;
        if(global.ROLE[req.decodedUser.user_type - 1] == 'admin' && isEmpty(company_id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        if(global.ROLE[req.decodedUser.user_type - 1] == 'company')
            company_id = req.decodedUser.id;
        if(global.ROLE[req.decodedUser.user_type - 1] == 'requester')
            company_id = req.decodedUser.parent_id;
        if (global.ROLE[req.decodedUser.user_type - 1] == 'manager')
            company_id = req.decodedUser.parent_id;    
        try {
            const userRepository = getRepository(User);
            const user = await userRepository.findOne(company_id);
            if(user === undefined || user.is_delete === Trigger.ON) {
                res.json({ errorCode: 15, errorMsg: "invalid company id." });
                return;
            }
            let data: {[k: string]: any} = {};
            data.prices = [];
            if(isArray(user.prices)) {
                for(let i = 0; i < user.prices.length; i ++)
                    data.prices.push({
                        original_language: {
                            id: user.prices[i].original.id,
                            name: user.prices[i].original.name
                        },
                        translate_language: {
                            id: user.prices[i].translate.id,
                            name: user.prices[i].translate.name
                        },
                        price: user.prices[i].work_price,
                        native_review_price: user.prices[i].native_review_price
                    })
            }
            data.currency_type = user.currency_type
            data.screen_time_limit = {
                enable_trans_length_for48: user.screen_time_limit.general_screen_limit, //48시간 번역가능한 영상길이
                extra_trans_time_for48: user.screen_time_limit.general_end_time, //초과시 마감시간 총합에 추가되는 금액
                urgent_trans_length_for24: user.screen_time_limit.emergency_screen_limit, //영상길이가 이것보다 > 면 긴급요청 불가능
                free_trans_length: user.screen_time_limit.free_screen_limit //영상길이가 이것보다 > 면 무료요청 불가능
            };
            data.end_time_settings = [];
            if(isArray(user.end_time_settings)) {
                for(let i = 0; i < user.end_time_settings.length; i ++)
                    data.end_time_settings.push({
                        user_type: global.ROLE[user.end_time_settings[i].work_type - 1],
                        minute_trans_time_for48: user.end_time_settings[i].general_trans_time,
                        trans_add_time_for48: user.end_time_settings[i].general_trans_add_time,
                        minute_excess_time_for48: user.end_time_settings[i].general_excess_time,
                        excess_add_time_for48: user.end_time_settings[i].general_excess_add_time,
                        minute_trans_time_for24: user.end_time_settings[i].emergency_trans_time,
                        trans_add_time_for24: user.end_time_settings[i].emergency_add_time
                    })
            }
            data.card_payment_check = user.is_card_payment;
            data.language_pairs = [];
            if(isArray(user.language_pairs)) {
                for(let i = 0; i < user.language_pairs.length; i ++)
                    data.language_pairs.push({
                        original_language: {
                            id: user.language_pairs[i].original.id,
                            name: user.language_pairs[i].original.name
                        },
                        translate_language: {
                            id: user.language_pairs[i].translate.id,
                            name: user.language_pairs[i].translate.name
                        }
                    })
            }
            data.services = [];
            if(isArray(user.services)) {
                for(let i = 0; i < user.services.length; i ++)
                    data.services.push(user.services[i].detail_service_type);
            }
            data.title_cost = isEmpty(user.title_cost)?0:user.title_cost;
            data.premium_rate = isEmpty(user.premium_rate)?0:user.premium_rate;
            return res.json({
                errorCode: 0, errorMsg: '', data: data
            })
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default CompanyController;