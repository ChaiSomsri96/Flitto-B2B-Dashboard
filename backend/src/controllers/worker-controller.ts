import { WorkingLanguage } from './../entity/working-language';
import { UsersTranslatePair } from './../entity/users-translate-pair';
import { UsersWorkingLanguage } from './../entity/users-working-language';
import { UserTag } from './../entity/user-tag';
import { Tag } from './../entity/tag';
import { User } from './../entity/user';
import { Request, Response } from "express";
import { getRepository, getConnection, Brackets } from "typeorm";
import { get_id_from_pair_array, generateRandomString } from './../helpers/utils';
import fs from "fs";
import global from './../config/global';
import config from './../config/config';
import { isArray, isObject, isNotEmpty, isNumber, isNumberString, isEmpty } from 'class-validator';
import lang from "../lang/index";
import { sendEmail } from './../helpers/notice-method';
import { Trigger } from './../entity/entity-enum';
class WorkerController {
    static registerWorker = async (req: Request, res: Response) => {
        let resp = {
            errorCode: 0, errorMsg: ''
        }
        const {
            user_type, // 계정 유형
            user_id, // 아이디
            user_pwd, // 비번
            user_name, // 이름
            country_code, // 코드
            phone_number, // 전화번호
            email, // 이메일
            system_lang, // 시스템언어
            correction_rate, // 작업금액 보정률
            can_work, // 동시작업 가능 수량
            sms_notice_check, // 알림톡 / SMS 알림
            email_notice_check, // 이메일 알림
            memo,
            id,
            password_gen
        } = req.body;
        let { tags } = req.body;
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
                user.tags = [];
                user.working_languages = [];
                user.language_pairs = [];
                user.player_id = generateRandomString(24);
            }
            user.update_date = Math.floor(Date.now() / 1000);
            user.user_type = global.ROLE.indexOf(user_type) + 1;
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
            user.correction_rate = correction_rate;
            user.can_work = can_work;
            user.is_sms_notice_on = sms_notice_check;
            user.is_email_notice_on = email_notice_check;
            user.admin_memo = memo;
            const tagRepository = getRepository(Tag);
            //insert tag
            let user_tags = [], add_user_tags = [];
            if(isEmpty(tags))
                tags = [];
            if(!isEmpty(id)) {
                for(let i = 0; i < user.tags.length; i ++) {
                    user_tags.push(user.tags[i].tag.name);
                    if(tags.indexOf(user.tags[i].tag.name) < 0) {
                        //remvoe
                        await getConnection()
                        .createQueryBuilder()
                        .delete()
                        .from(UserTag)
                        .where('"user_tag"."userId" = :id and "user_tag"."tagId" = :tag_id', {id: id, tag_id: user.tags[i].tag.id})
                        .execute();
                    }
                }
                for(let i = 0; i < tags.length; i ++) {
                    if(user_tags.indexOf(tags[i]) < 0)
                        add_user_tags.push(tags[i]);
                }
            }
            else
                add_user_tags = tags
            for(let i = 0; i < add_user_tags.length; i ++) {
                const tag = await tagRepository.findOne({
                    where: {
                        name: add_user_tags[i]
                    }
                })
                if(tag === undefined) {
                    const _tag = new Tag();
                    _tag.create_date = Math.floor(Date.now() / 1000);
                    _tag.update_date = Math.floor(Date.now() / 1000);
                    _tag.name = add_user_tags[i];
                    await tagRepository.save(_tag);
                    const _userTag = new UserTag();
                    _userTag.tag = _tag;
                    await getConnection().manager.save(_userTag);
                    user.tags.push(_userTag);
                }
                else {
                    const _userTag = new UserTag();
                    _userTag.tag = tag;
                    await getConnection().manager.save(_userTag);
                    user.tags.push(_userTag);
                }
            }
            //insert language according to user type
            if(user_type == 'tc' || user_type == 'reviewer') {
                if(isEmpty(req.body.working_languages))
                    req.body.working_languages = []
                if(req.body.working_languages !== undefined && isArray(req.body.working_languages)) {
                    let user_working_language_ids = [], add_user_working_language_ids = []
                    // 작업언어 케이스
                    for(let i = 0; i < user.working_languages.length; i ++) {
                        user_working_language_ids.push(user.working_languages[i].workingLanguage.id)
                        if(req.body.working_languages.indexOf(user.working_languages[i].workingLanguage.id) < 0) {
                            await getConnection()
                            .createQueryBuilder()
                            .delete()
                            .from(UsersWorkingLanguage)
                            .where('"users_working_language"."userId" = :id and "users_working_language"."workingLanguageId" = :working_language_id', {id: id, working_language_id: user.working_languages[i].workingLanguage.id})
                            .execute();
                        }
                    }

                    for(let i = 0; i < req.body.working_languages.length; i ++) {
                        if(user_working_language_ids.indexOf(req.body.working_languages[i]) < 0)
                            add_user_working_language_ids.push(req.body.working_languages[i]);
                    }

                    const workingLanguageRepository = getRepository(WorkingLanguage);
                    for(let i = 0; i < add_user_working_language_ids.length; i ++) {
                        const _userWorkingLanguage = new UsersWorkingLanguage();
                        let _workingLanguage = await workingLanguageRepository.findOneOrFail(add_user_working_language_ids[i])
                        _userWorkingLanguage.workingLanguage = _workingLanguage
                        _userWorkingLanguage.create_date = Math.floor(Date.now() / 1000);
                        _userWorkingLanguage.update_date = Math.floor(Date.now() / 1000);
                        await getConnection().manager.save(_userWorkingLanguage);
                        user.working_languages.push(_userWorkingLanguage)
                    }
                }
            }
            else if(user_type == 'translator') {

                if(isEmpty(req.body.original_languages))
                    req.body.original_languages = []
                if(isEmpty(req.body.translate_languages))
                    req.body.translate_languages = []

                if(req.body.original_languages !== undefined && isArray(req.body.original_languages)
                && req.body.translate_languages !== undefined && isArray(req.body.translate_languages)) {
                    //작업언어쌍 케이스 get_id_from_pair_array
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
            }
            await getConnection().manager.save(user);

            if (isEmpty(id) && !isEmpty(password_gen) && password_gen == 'Y' && !isEmpty(email)) {
                let template_obj: { [k: string]: any } = {};
                template_obj.site_url = config.SITE_URL;
                template_obj.domain = user_type;
                template_obj.userid = user_id;
                template_obj.password = gen_pwd;   
                if(user_type == 'tc')
                    sendEmail(email, system_lang, lang[user.system_lang]['email']['tc_a07'], 'tc_a07', template_obj);
                else if (user_type == 'translator')
                    sendEmail(email, system_lang, lang[user.system_lang]['email']['translator_a07'], 'translator_a07', template_obj);
                else if (user_type == 'reviewer')
                    sendEmail(email, system_lang, lang[user.system_lang]['email']['reviewer_a07'], 'reviewer_a07', template_obj);
            }
            return res.json(resp);
        }
        catch(error) {
            console.log(error)
            resp.errorCode = 500;
            resp.errorMsg = "Internal Server Error";
            res.json(resp);
            return;
        }
    };

    static getTags = async (_req: Request, res: Response) => {
        const tagRepository = getRepository(Tag);
        const tagList = await tagRepository.find({select: ["id", "name"]});
        return res.json({
            "errorCode": 0,
            "errorMsg": "",
            "data": tagList
        })
    };
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        user_type: ['tc', 'translator', 'reviewer'],  //유형 전체 선택인 케이스   Array로 request보내지 말고 -1 request 보낼것
        keyword_type: 1,   // 1: 이름 , 2: 아이디 , 3: 전화번호 , 4: 이메일
        search_keyword: 'asdf',   //검색어
        search_type: 1,    // 1: 포함 , 2: 일치

        tags: [], //아무것도 선택하지 않았을때 [] - > empty array , 전체선택한 케이스 Array가 아닌 -1을 ~~

        w_lang_type: 1,  // -1: 전체 , 1:  언어쌍 , 2: 단일언어
        work_lang: {               //언어쌍인 케이스 ,  단일언어인 케이스에는 work_lang에 id값 추가 , 전체선택인 케이스 -1
            original: 1,
            translate: 2
        },

        correction_rate_start: 0,  //작업금액 보정률 범위
        correction_rate_end: 0,

        total_work_numbers_start: 0,   // 총작업수 범위
        total_work_numbers_end: 0,

        total_work_price_start: 0, // 총작업금액 범위
        total_work_price_end: 0
    }
    */
    static getWorkerList = async (req: Request, res: Response) => {
        
        const {
            table,
            search
        } = req.body;

        let tc_sub_query = getConnection()
            .createQueryBuilder()
            .select('"user"."id"', 'id')
            .addSelect(' \
                case \
                when sum(trans_request.tc_work_price) is NULL \
                then 0 \
                else ROUND(cast(sum(trans_request.tc_work_price) as numeric), 3) \
                end', 'work_price')
            .addSelect(' \
                case \
                when count(trans_request.id) is NULL \
                then 0 \
                else count(trans_request.id) \
                end', 'work_numbers')
            .from(User, "user")
            .leftJoin('user.tc_trans_requests', 'trans_request')
            .where('user.user_type = 4')
            .groupBy('user.id');
        
        
        let translate_review_query = getConnection()
            .createQueryBuilder()
            .select('"user"."id"', 'id')
            .addSelect(' \
                case \
                when sum(request_detail_worker.price) is NULL \
                then 0 \
                else ROUND(cast(sum(request_detail_worker.price) as numeric), 3) \
                end', 'work_price')
            .addSelect(' \
                case \
                when count(request_detail_worker.id) is NULL \
                then 0 \
                else count(request_detail_worker.id) \
                end', 'work_numbers')
            .from(User, "user")
            .leftJoin('user.request_detail_workers', 'request_detail_worker')
            .where('user.user_type = 5')
            .orWhere('user.user_type = 6')
            .groupBy('user.id');
        
        let query =  getRepository(User)
            .createQueryBuilder("user")
            .addSelect(' \
                case \
                when user.user_type = 4 \
                then "tc_t_r"."work_price" \
                else  "tr_t_r"."work_price" \
                end \
            ', 'user_total_work_price')
            .addSelect(' \
                case \
                when user.user_type = 4 \
                then "tc_t_r"."work_numbers" \
                else  "tr_t_r"."work_numbers" \
                end \
            ', 'user_total_work_numbers')
            .leftJoinAndSelect("user.tags", "user_tag")
            .leftJoinAndSelect("user.tags", "worker_tag")
            .leftJoinAndSelect("worker_tag.tag", "tag1");

        query = query.leftJoin('(' + tc_sub_query.getQuery() + ')', "tc_t_r", '"user"."id" = "tc_t_r"."id"')
        query = query.leftJoin('(' + translate_review_query.getQuery() + ')', "tr_t_r", '"user"."id" = "tr_t_r"."id"') 
        
        if(isNotEmpty(search)) {
            if(search.w_lang_type == 1 || search.w_lang_type != 2) {
                query = query.leftJoinAndSelect("user.language_pairs", "users_translate_pair");
                query = query.leftJoinAndSelect("user.language_pairs", "workers_translate_pair");
                query = query.leftJoinAndSelect("workers_translate_pair.original", "working_language as A");
                query = query.leftJoinAndSelect("workers_translate_pair.translate", "working_language as B");
            }
            if(search.w_lang_type == 2 || search.w_lang_type != 1) {
                query = query.leftJoinAndSelect("user.working_languages", "users_working_language");
                query = query.leftJoinAndSelect("user.working_languages", "workers_working_language");
                query = query.leftJoinAndSelect("workers_working_language.workingLanguage", "working_language as C");
            }
        }
        else {
            query = query.leftJoinAndSelect("user.language_pairs", "users_translate_pair");
            query = query.leftJoinAndSelect("user.language_pairs", "workers_translate_pair");
            query = query.leftJoinAndSelect("workers_translate_pair.original", "working_language as A");
            query = query.leftJoinAndSelect("workers_translate_pair.translate", "working_language as B");
            query = query.leftJoinAndSelect("user.working_languages", "users_working_language");
            query = query.leftJoinAndSelect("user.working_languages", "workers_working_language");
            query = query.leftJoinAndSelect("workers_working_language.workingLanguage", "working_language as C");
        }

        {
            let user_type_query = 'user.user_type = :user_type1' , filter = {};
            filter = {
                ...filter,
                'user_type1': global.WORK_TYPE[0]
            }
            for( let i = 1; i < global.WORK_TYPE.length; i ++ ) {
                user_type_query += ' or user.user_type = :user_type' + (i + 1);
                let key = `user_type${i+1}`
                filter = {
                    ...filter,
                    [key] : global.WORK_TYPE[i]
                }
            }
            query = query.where(new Brackets(qb => {
                qb.where(user_type_query, filter)
            }));
        }

        if(isNotEmpty(search)) {
            //사용자 유형
            if( isArray(search.user_type) && search.user_type.length > 0 ) {
                let user_type_query = 'user.user_type = :user_type1' , filter = {};
                filter = {
                    ...filter,
                    'user_type1': global.ROLE.indexOf(search.user_type[0]) + 1
                }
                for( let i = 1; i < search.user_type.length; i ++ ) {
                    user_type_query += ' or user.user_type = :user_type' + (i + 1);
                    let key = `user_type${i+1}`
                    filter = {
                        ...filter,
                        [key] : global.ROLE.indexOf(search.user_type[i]) + 1
                    }
                }
                query = query.andWhere(new Brackets(qb => {
                    qb.where(user_type_query, filter)
                }));
            }

            //검색어
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

            //작업금액 보정률
            if( isNotEmpty(search.correction_rate_start) && (isNumber(search.correction_rate_start) || isNumberString(search.correction_rate_start) ) )
                query = query.andWhere('user.correction_rate >= ' + search.correction_rate_start);
            if( isNotEmpty(search.correction_rate_end) && (isNumber(search.correction_rate_end) || isNumberString(search.correction_rate_end)) )
                query = query.andWhere('user.correction_rate <= ' + search.correction_rate_end);
            //총 작업수
            if( isNotEmpty(search.total_work_numbers_start) && (isNumber(search.total_work_numbers_start) || isNumberString(search.total_work_numbers_start)) )
                query = query.andWhere('case \
                when user.user_type = 4 \
                then "tc_t_r"."work_numbers" \
                else  "tr_t_r"."work_numbers" \
                end >= ' + search.total_work_numbers_start);
            if( isNotEmpty(search.total_work_numbers_end) && (isNumber(search.total_work_numbers_end) || isNumberString(search.total_work_numbers_end)) )
                query = query.andWhere('case \
                when user.user_type = 4 \
                then "tc_t_r"."work_numbers" \
                else  "tr_t_r"."work_numbers" \
                end <= ' + search.total_work_numbers_end);
            //총 작업금액
            if( isNotEmpty(search.total_work_price_start) && (isNumber(search.total_work_price_start) || isNumberString(search.total_work_price_start)) )
                query = query.andWhere('\
                case \
                when user.user_type = 4 \
                then "tc_t_r"."work_price" \
                else  "tr_t_r"."work_price" \
                end >= ' + search.total_work_price_start);
            if( isNotEmpty(search.total_work_price_end) && (isNumber(search.total_work_price_end) || isNumberString(search.total_work_price_end)) )
                query = query.andWhere('\
                case \
                when user.user_type = 4 \
                then "tc_t_r"."work_price" \
                else  "tr_t_r"."work_price" \
                end <= ' + search.total_work_price_end);
            //태그 search
            if( isArray(search.tags) && search.tags.length > 0 ) {
                let tag_query = '"user_tag"."tagId" = :tag1', filter = {};
                filter = {
                    ...filter,
                    'tag1': search.tags[0]
                }
                for( let i = 1; i < search.tags.length; i ++) {
                    tag_query += ' or "user_tag"."tagId" = :tag' + (i  + 1);
                    let key = `tag${i+1}`
                        filter = {
                            ...filter,
                            [key] : search.tags[i]
                        }
                }
                query = query.andWhere(new Brackets(qb => {
                    qb.where(tag_query, filter)
                }));
            }
            //작업언어
            if(isNotEmpty(search.w_lang_type) && search.w_lang_type > 0 && search.w_lang_type == 1 && isObject(search.work_lang)) {
                query = query.andWhere('"users_translate_pair"."originalId" = :original_id', {original_id: search.work_lang.original})
                            .andWhere('"users_translate_pair"."translateId" = :translate_id', {translate_id: search.work_lang.translate});
            }
            else if(isNotEmpty(search.w_lang_type) && search.w_lang_type > 0 &&  search.w_lang_type == 2 && !isObject(search.work_lang)) {
                query = query.andWhere('"users_working_language"."workingLanguageId" = :working_lang_id', {working_lang_id: search.work_lang});
            }
        }

        query = query.andWhere('"user"."is_delete" = \'N\'')

        query = query.orderBy('user.create_date', "DESC");

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
                user_type: global.ROLE[item.user_type - 1],
                user_id: item.login_id,
                user_name: item.user_name,
                phone_number: item.country_code + ' ' + item.phone_number,
                email: item.user_email,
                correction_rate: item.correction_rate == null ? 0 : item.correction_rate,
                can_work: item.can_work == null ? 0 : item.can_work,
                total_work_numbers: item.total_work_numbers == null? 0: item.total_work_numbers,
                total_work_price: item.total_work_price == null? 0: item.total_work_price,
                reg_date: item.create_date,
                admin_memo: item.admin_memo
            }
            table_item.tags = []
            for(let i = 0; i < item.tags.length; i ++)
            {
                table_item.tags.push(item.tags[i].tag.name);
            }
            table_item.working_language = []
            if(isArray(item.language_pairs) && item.language_pairs.length > 0) {
                item.language_pairs.forEach(function(detail) {
                    table_item.working_language.push({
                        original: detail.original.prefix,
                        translate: detail.translate.prefix
                    })
                })
            }
            else if(isArray(item.working_languages) && item.working_languages.length > 0) {
                item.working_languages.forEach(function(detail) {
                    table_item.working_language.push(detail.workingLanguage.prefix)
                })
            }
            table_data.push(table_item);
        });
        return res.json({ errorCode: 0, errorMsg: '', data: {list: table_data , totalCount: totals} });
    };

    static deleteWorker = async(req: Request, res: Response) => {
        const { ids } = req.body;
        if( !( isArray(ids) && ids.length > 0 ) )
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            for(let i = 0; i < ids.length; i ++) {
                let index = ids[i]
                /* 
                //remove user tags
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(UserTag)
                .where('"user_tag"."userId" = :id', { id: index })
                .execute();
                //remove users_working_language
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(UsersWorkingLanguage)
                .where('"users_working_language"."userId" = :id', { id: index })
                .execute();
                //remove translate pair
                await getConnection()
                .createQueryBuilder()
                .delete()
                .from(UsersTranslatePair)
                .where('"users_translate_pair"."userId" = :id', { id: index })
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
                
                let query = getRepository(UserTag)
                    .createQueryBuilder("user_tag")
                    .leftJoin(UserTag, "A", '"A"."tagId" = "user_tag"."tagId" and "A"."userId" != :user_id', { user_id: index })
                    .leftJoinAndSelect("user_tag.tag", "tag")
                    .where('"user_tag"."userId" = :user_id', { user_id: index })
                    .andWhere('"A"."id" is NULL');
                let _result = await query.getMany();

                    await getConnection()
                    .createQueryBuilder()
                    .delete()
                    .from(UserTag)
                    .where('"user_tag"."userId" = :id', { id: index })
                    .execute();    
                
                for (let k = 0; k < _result.length; k++) {
                    await getConnection()
                        .createQueryBuilder()
                        .delete()
                        .from(Tag)
                        .where('"tag"."id" = :id', { id: _result[k].tag.id })
                        .execute();
                }
            }
            return res.json({ errorCode: 0, errorMsg: "" });
        }
        catch( error ) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
    static getWorkerLanguage = async(req: Request, res: Response) => {
        try {
            let userRepository = getRepository(User);
            let _user_info = await userRepository.findOne(req.decodedUser.id);
            if(_user_info == undefined)
                return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
            let data: {[k: string]: any} = {};
            if(req.decodedUser.user_type == (global.ROLE.indexOf('tc') + 1) ||  req.decodedUser.user_type == (global.ROLE.indexOf('reviewer') + 1)) {
                data.working_languages = [];
                if(isArray(_user_info.working_languages))
                    for(let i = 0; i < _user_info.working_languages.length; i ++) {
                        data.working_languages.push({
                            id: _user_info.working_languages[i].workingLanguage.id,
                            name: _user_info.working_languages[i].workingLanguage.name
                        })
                    }
            }
            else {
                data.originals = [];
                data.translates = [];
                if(isArray(_user_info.language_pairs))
                    for(let i = 0; i < _user_info.language_pairs.length; i ++) {
                        data.originals.push({
                            id: _user_info.language_pairs[i].original.id,
                            name: _user_info.language_pairs[i].original.name
                        });
                        data.translates.push({
                            id: _user_info.language_pairs[i].translate.id,
                            name: _user_info.language_pairs[i].translate.name
                        })
                    }
            }
            return res.json({
                errorCode: 0,
                errorMsg: '',
                data: data
            })
        }
        catch(error) {
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
            if(global.WORK_TYPE.indexOf(user.user_type) < 0)
                return res.json({ errorCode: 1, errorMsg: 'Invalid Id, This is not worker id.' });
            let data: {[k: string]: any} = {};
            data = {
                id: id,
                user_type: global.ROLE[user.user_type - 1],
                user_id: user.login_id,
                user_name: user.user_name,
                country_code: user.country_code,
                phone_number: user.phone_number,
                email: user.user_email,
                system_lang: user.system_lang,
                sms_notice_check:  user.is_sms_notice_on,
                email_notice_check: user.is_email_notice_on,
                memo: isEmpty(user.admin_memo) ? '' : user.admin_memo,
                correction_rate: user.correction_rate,
                can_work: user.can_work,
                avatar: (user.avatar === null || user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + user.avatar)
            }
            let tags = []
            for(let i = 0; i < user.tags.length; i ++)
                tags.push(user.tags[i].tag.name)
            data.tags = tags;
            let working_languages = []
            if(global.ROLE[user.user_type - 1] == 'tc' || global.ROLE[user.user_type - 1] == 'reviewer') {
                for(let i = 0; i < user.working_languages.length; i ++)
                    working_languages.push({
                        id: user.working_languages[i].workingLanguage.id,
                        name: user.working_languages[i].workingLanguage.name
                    })
            }
            else {
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
            }
            data.working_languages = working_languages;
            return res.json({ errorCode: 0, errorMsg: "", data: data });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
};
export default WorkerController;