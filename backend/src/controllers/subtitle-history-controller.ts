import { getConnection } from 'typeorm';
import { RequestDetail } from './../entity/request-detail';
import { TransRequest } from './../entity/trans-request';
import { Manager } from './../entity/manager';
import { getRepository, Brackets } from 'typeorm';
import { Request, Response } from 'express';
import { isNotEmpty, isEmpty, isArray, isNumberString,  isNumber } from 'class-validator';
import global from './../config/global';
import { Trigger } from './../entity/entity-enum';
import { calc_working_time } from './../helpers/utils';
class SubtitleHistoryController {
    /*
    {
        table: {
            page: 1,
            page_length: 20
        },
        search: {
            date_type: 1~ 작업요청일시, 2~ 작업완료일시 3~ 작업완료 예정일시 
                        4 ~ TC완료일시
                        5 ~ 번역완료일시
                        6 ~ 검수완료일시 추가
            start_date: 12329334,
            end_date: 12329334,
            finish_work_type: 1, // 전체 선택한 경우 Parameter를 업로드 하지 말것.  1:작업완료, 2:작업미완료
            status: ['preparing', '', '' , ''], // 전체 선택한 경우 Parameter를 업로드하지 말것.
            original_language: 2, // 원본언어, 전체 선택한 경우 Parameter를 업로드 하지 말것.
            translate_language: 2, //번역언어, 전체 선택한 경우 Parameter를 업로드 하지 말것.


            price_type: 1~ 번역금액(엔) 2~ 번역금액(KRW) 3~ 번역금액($) 4~ 작업금액 (합) 5~ 작업금액 (TC) 6~ 작업금액 (번역) 7~ 작업금액 (검수)
            start_work_price: 0,
            end_work_price: 500,




            companies: [], // 고객사
            requesters: [], // 요청자
            extras: ['Y' , 'N' , 'Y' , ...], //전체 선택한 경우 Parameter를 업로드 하지 말것.
            ------------
            --index--
            0: 원본자막Y
            1: 원본자막N
            2: 긴급번역Y
            3: 긴급번역N
            4: 제목/설명 번역 Y
            5: 제목/설명 번역 N
            6: 원어민 검수 Y
            7: 원어민 검수 N
            8: Youtube 적용 Y
            9: Youtube 적용 N
            10: 선결제 Y
            11: 선결제 N
            12: 선결제 F
            -------------
            tc_users: [], //TC작업자
            translate_users: [], //번역가
            review_users: [], //검수자
            keyword_type: 1, // 1: 제목 , 2: 작업번호 , 3: 요청자 메모
            search_keyword: 'asdf', // 검색어
            search_type: 1  // 1: 포함, 2: 일치
        }
    }
    */
    static getAdminRequestList = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            let sum_query = getConnection()
                            .createQueryBuilder()
                            .select('sum(trans_request.duration) / count(request_detail.id)', 'duration')
                            .addSelect('sum(CASE \
                                WHEN trans_request.currency_type != \'JPY\' \
                                THEN 0 \
                                ELSE request_detail.work_price \
                                END) / count(request_detail.id)', 'jpy_work_price')
                            .addSelect('sum(CASE \
                                WHEN trans_request.currency_type != \'KRW\' \
                                THEN 0 \
                                ELSE request_detail.work_price \
                                END) / count(request_detail.id)', 'krw_work_price')
                            .addSelect('sum(CASE \
                                WHEN trans_request.currency_type != \'USD\' \
                                THEN 0 \
                                ELSE request_detail.work_price \
                                END) / count(request_detail.id)', 'usd_work_price')
                            .addSelect('ROUND(cast(sum(CASE \
                                WHEN  trans_request.has_original_video = \'Y\' or parent.has_tc_service = \'N\'  \
                                THEN 0 \
                                WHEN request_detail.status = 1 and trans_request.tc_price_set = \'Y\' \
                                THEN trans_request.tc_price_value \
                                WHEN request_detail.status = 1 and trans_request.tc_price_set = \'N\' \
                                THEN company_price.tc_price * trans_request.duration_minute \
                                ELSE trans_request.tc_work_price \
                                END) / count(request_detail.id) as numeric), 3)', 'tc_price')
                            .addSelect('ROUND(cast(sum(CASE \
                                WHEN  request_detail.status <= 3 and request_detail.translate_price_set = \'Y\'  \
                                THEN  request_detail.translate_price_value \
                                WHEN request_detail.status <= 3 and request_detail.translate_price_set = \'N\'  \
                                THEN company_price.trans_price * trans_request.duration_minute \
                                ELSE request_detail.translate_work_price \
                                END) / count(request_detail.id) as numeric), 3)', 'translate_price')
                            .addSelect('ROUND(cast(sum(CASE \
                                WHEN  trans_request.is_native_review = \'N\'  \
                                THEN 0 \
                                WHEN request_detail.status <= 5 and request_detail.review_price_set = \'Y\' \
                                THEN request_detail.review_price_value \
                                WHEN request_detail.status <= 5 and request_detail.review_price_set = \'N\' \
                                THEN company_price.test_price * trans_request.duration_minute \
                                ELSE request_detail.review_work_price \
                                END) / count(request_detail.id) as numeric), 3)', 'review_price')
                            .addSelect('ROUND(cast(sum( \
                                CASE \
                                WHEN  trans_request.has_original_video = \'Y\' or parent.has_tc_service = \'N\'  \
                                THEN 0 \
                                WHEN request_detail.status = 1 and trans_request.tc_price_set = \'Y\' \
                                THEN trans_request.tc_price_value \
                                WHEN request_detail.status = 1 and trans_request.tc_price_set = \'N\' \
                                THEN company_price.tc_price * trans_request.duration_minute \
                                ELSE trans_request.tc_work_price \
                                END + \
                                CASE \
                                WHEN  request_detail.status <= 3 and request_detail.translate_price_set = \'Y\'  \
                                THEN  request_detail.translate_price_value \
                                WHEN request_detail.status <= 3 and request_detail.translate_price_set = \'N\'  \
                                THEN company_price.trans_price * trans_request.duration_minute \
                                ELSE request_detail.translate_work_price \
                                END + \
                                CASE \
                                WHEN  trans_request.is_native_review = \'N\'  \
                                THEN 0 \
                                WHEN request_detail.status <= 5 and request_detail.review_price_set = \'Y\' \
                                THEN request_detail.review_price_value \
                                WHEN request_detail.status <= 5 and request_detail.review_price_set = \'N\' \
                                THEN company_price.test_price * trans_request.duration_minute \
                                ELSE request_detail.review_work_price \
                                END ) / count(request_detail.id) as numeric), 3)', 'work_sum_price')    
                            .from(RequestDetail, "request_detail")
                            .leftJoin("request_detail.request", "trans_request")
                            .leftJoin("request_detail.workers", "translate_worker", "translate_worker.worker_type = 5") 
                            .leftJoin("request_detail.workers", "review_worker", "review_worker.worker_type = 6")
                            .leftJoin("request_detail.workers", "request_detail_worker")
                            .leftJoin("translate_worker.user", "translator")
                            .leftJoin("review_worker.user", "reviewer")
                            .leftJoin("request_detail_worker.user", "worker")
                            .leftJoin("trans_request.original_language", "working_language")
                            .leftJoin("request_detail.translate_language", "translate_language")
                            .leftJoin("trans_request.user", "user")
                            .leftJoin("user.parent", "parent")
                            .leftJoin('parent.prices', 'company_price', '"company_price"."originalId" = "trans_request"."originalLanguageId" and "company_price"."translateId" = "request_detail"."translateLanguageId"')
                            .leftJoin("trans_request.tc_user", "tc_user");

            let query = getRepository(RequestDetail)
                        .createQueryBuilder("request_detail")
                        .addSelect('ROUND(cast(CASE \
                         WHEN  trans_request.has_original_video = \'Y\' or parent.has_tc_service = \'N\'   \
                         THEN 0 \
                         WHEN request_detail.status = 1 and trans_request.tc_price_set = \'Y\' \
                         THEN trans_request.tc_price_value \
                         WHEN request_detail.status = 1 and trans_request.tc_price_set = \'N\' \
                         THEN company_price.tc_price * trans_request.duration_minute \
                         ELSE trans_request.tc_work_price \
                         END as numeric), 3) as request_detail_temp_price')   
                         .addSelect('ROUND(cast(CASE \
                         WHEN  request_detail.status <= 3 and request_detail.translate_price_set = \'Y\'  \
                         THEN  request_detail.translate_price_value \
                         WHEN request_detail.status <= 3 and request_detail.translate_price_set = \'N\'  \
                         THEN company_price.trans_price * trans_request.duration_minute \
                         ELSE request_detail.translate_work_price \
                         END as numeric), 3) as request_detail_temp_price_translate') //번역가 작업금액
                         .addSelect('ROUND(cast(CASE \
                         WHEN  trans_request.is_native_review = \'N\'  \
                         THEN 0 \
                         WHEN request_detail.status <= 5 and request_detail.review_price_set = \'Y\' \
                         THEN request_detail.review_price_value \
                         WHEN request_detail.status <= 5 and request_detail.review_price_set = \'N\' \
                         THEN company_price.test_price * trans_request.duration_minute \
                         ELSE request_detail.review_work_price \
                         END as numeric), 3) as request_detail_temp_price_review') //검수자 작업금액
                         .addSelect(' \
                         ROUND(cast(CASE \
                         WHEN  trans_request.has_original_video = \'Y\' or parent.has_tc_service = \'N\'    \
                         THEN 0 \
                         WHEN request_detail.status = 1 and trans_request.tc_price_set = \'Y\' \
                         THEN trans_request.tc_price_value \
                         WHEN request_detail.status = 1 and trans_request.tc_price_set = \'N\' \
                         THEN company_price.tc_price * trans_request.duration_minute \
                         ELSE trans_request.tc_work_price \
                         END + \
                         CASE \
                         WHEN  request_detail.status <= 3 and request_detail.translate_price_set = \'Y\'  \
                         THEN  request_detail.translate_price_value \
                         WHEN request_detail.status <= 3 and request_detail.translate_price_set = \'N\'  \
                         THEN company_price.trans_price * trans_request.duration_minute \
                         ELSE request_detail.translate_work_price \
                         END + \
                         CASE \
                         WHEN  trans_request.is_native_review = \'N\'  \
                         THEN 0 \
                         WHEN request_detail.status <= 5 and request_detail.review_price_set = \'Y\' \
                         THEN request_detail.review_price_value \
                         WHEN request_detail.status <= 5 and request_detail.review_price_set = \'N\' \
                         THEN company_price.test_price * trans_request.duration_minute \
                         ELSE request_detail.review_work_price \
                         END as numeric), 3) \
                         as request_detail_temp_sum_price \
                         ') //작업금액 합계
                        // .addSelect('ROUND(cast(request_detail.work_price as numeric), 3)', 'request_detail_work_price')
                        .leftJoinAndSelect("request_detail.request", "trans_request")
                        .leftJoinAndSelect("request_detail.workers", "translate_worker", "translate_worker.worker_type = 5")
                        .leftJoinAndSelect("request_detail.workers", "review_worker", "review_worker.worker_type = 6")
                        .leftJoinAndSelect("request_detail.workers", "request_detail_worker")
                        .leftJoinAndSelect("translate_worker.user", "translator")
                        .leftJoinAndSelect("review_worker.user", "reviewer")
                        .leftJoinAndSelect("request_detail_worker.user", "worker")
                        .leftJoinAndSelect("trans_request.original_language", "working_language")
                        .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("user.parent", "parent")
                        .leftJoinAndSelect('parent.screen_time_limit', 'screen_time_limit')
                        .leftJoinAndSelect('parent.end_time_settings', 'end_time_setting')
                        .leftJoinAndSelect('parent.prices', 'company_price', '"company_price"."originalId" = "trans_request"."originalLanguageId" and "company_price"."translateId" = "request_detail"."translateLanguageId"')
                        .leftJoinAndSelect("trans_request.tc_user", "tc_user");
            
            query = query.where("1=1")
            sum_query = sum_query.where("1=1")

            if(isNotEmpty(search)) {
                if(isEmpty(search.date_type))
                    return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
                let field_name = '';
                //작업 요청 일시
                if(search.date_type == 1)
                    field_name = 'request_detail.create_date';
                //작업 완료 일시
                else if(search.date_type == 2)
                    field_name = 'request_detail.end_date';
                //작업 완료 예정 일시
                else if(search.date_type == 3)
                    field_name = 'trans_request.predict_end_date';
                //TC 완료 일시
                else if (search.date_type == 4)
                    field_name = 'trans_request.tc_end_date';

                if (search.date_type == 1 || search.date_type == 2 || search.date_type == 3 || search.date_type == 4) {
                    //일자 범위 선택
                    if(isNotEmpty(search.start_date)) {
                        query = query.andWhere(field_name + ' >= ' + search.start_date);
                        sum_query = sum_query.andWhere(field_name + ' >= ' + search.start_date);
                    }
                    if(isNotEmpty(search.end_date)) {
                        query = query.andWhere(field_name + ' <= ' + search.end_date);
                        sum_query = sum_query.andWhere(field_name + ' <= ' + search.end_date);
                    }    
                }
                else {
                    /*
                    //번역 완료 일시
                    else if (search.date_type == 5)
                        field_name = 'trans_request.predict_end_date';
                    //검수 완료 일시
                    else if (search.date_type == 6)
                        field_name = 'trans_request.predict_end_date';
                    */
                    if (search.date_type == 5) {
                        if (isNotEmpty(search.start_date)) {
                            query = query.andWhere('"translate_worker"."end_date" >= ' + search.start_date);
                            sum_query = sum_query.andWhere('"translate_worker"."end_date" >= ' + search.start_date);
                        }   
                        if (isNotEmpty(search.end_date)) {
                            query = query.andWhere('"translate_worker"."end_date" <= ' + search.end_date);
                            sum_query = sum_query.andWhere('"translate_worker"."end_date" <= ' + search.end_date);
                        }
                    }
                    else if (search.date_type == 6) {
                        if (isNotEmpty(search.start_date)) {
                            query = query.andWhere('"review_worker"."end_date" >= ' + search.start_date);
                            sum_query = sum_query.andWhere('"review_worker"."end_date" >= ' + search.start_date);
                        }   
                        if (isNotEmpty(search.end_date)) {
                            query = query.andWhere('"review_worker"."end_date" <= ' + search.end_date);
                            sum_query = sum_query.andWhere('"review_worker"."end_date" <= ' + search.end_date);
                        }
                    }
                }
                //완료 상태
                if(isNotEmpty(search.finish_work_type)) {
                    if(search.finish_work_type == 1) {
                        query = query.andWhere('"request_detail"."is_end" = :value', {value: 'Y'});
                        sum_query = sum_query.andWhere('"request_detail"."is_end" = :value', {value: 'Y'});
                    }
                    else if(search.finish_work_type == 2) {
                        query = query.andWhere('"request_detail"."is_end" = :value', {value: 'N'});
                        sum_query = sum_query.andWhere('"request_detail"."is_end" = :value', {value: 'N'});
                    }
                }
                //진행 상태
                if(isNotEmpty(search.status) && isArray(search.status) && search.status.length > 0) {
                    let status_query = '', filter = {};
                    
                    if (search.status[0] == 'subtitle_apply_failed')
                        status_query = '"request_detail"."status" >= :status1';
                    else
                        status_query = '"request_detail"."status" = :status1';
                    filter = {
                        ...filter,
                        'status1': global.STATUS.indexOf(search.status[0]) + 1
                    }

                    for (let i = 1; i < search.status.length; i++) {

                        if (search.status[i] == 'subtitle_apply_failed')
                            status_query += ' or "request_detail"."status" >= :status' + (i + 1);
                        else
                            status_query += ' or "request_detail"."status" = :status' + (i + 1);
                        
                        let key = `status${i+1}`
                        filter = {
                            ...filter,
                            [key]: global.STATUS.indexOf(search.status[i]) + 1
                        }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(status_query, filter)
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where(status_query, filter)
                    }));
                }
                //원본언어
                if( isNotEmpty(search.original_language) ) {
                    query = query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                    sum_query = sum_query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                }
                //번역언어
                if( isNotEmpty(search.translate_language) ) {
                    query = query.andWhere('"request_detail"."translateLanguageId" = :translate_language', {translate_language: search.translate_language})
                    sum_query = sum_query.andWhere('"request_detail"."translateLanguageId" = :translate_language', {translate_language: search.translate_language})
                }
                //금액 필터
                if(isEmpty(search.price_type))
                    return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
                
                switch(search.price_type) {
                    case 1:
                        //번역금액(엔)
                            field_name = 'request_detail.work_price';
                            break;
                    case 2:
                        //번역금액(KRW)
                            field_name = 'request_detail.work_price';
                            break;
                    case 3:
                        //번역금액($)
                            field_name = 'request_detail.work_price';
                            break;
                    case 4:
                        //작업금액 (합)
                            field_name = ' \
                            ROUND(cast(CASE \
                            WHEN  trans_request.has_original_video = \'Y\' or parent.has_tc_service = \'N\'    \
                            THEN 0 \
                            WHEN request_detail.status = 1 and trans_request.tc_price_set = \'Y\' \
                            THEN trans_request.tc_price_value \
                            WHEN request_detail.status = 1 and trans_request.tc_price_set = \'N\' \
                            THEN company_price.tc_price * trans_request.duration_minute \
                            ELSE trans_request.tc_work_price \
                            END + \
                            CASE \
                            WHEN  request_detail.status <= 3 and request_detail.translate_price_set = \'Y\'  \
                            THEN  request_detail.translate_price_value \
                            WHEN request_detail.status <= 3 and request_detail.translate_price_set = \'N\'  \
                            THEN company_price.trans_price * trans_request.duration_minute \
                            ELSE request_detail.translate_work_price \
                            END + \
                            CASE \
                            WHEN  trans_request.is_native_review = \'N\'  \
                            THEN 0 \
                            WHEN request_detail.status <= 5 and request_detail.review_price_set = \'Y\' \
                            THEN request_detail.review_price_value \
                            WHEN request_detail.status <= 5 and request_detail.review_price_set = \'N\' \
                            THEN company_price.test_price * trans_request.duration_minute \
                            ELSE request_detail.review_work_price \
                            END as numeric), 3)';
                            break;
                    case 5:
                        //작업금액 (TC)
                            field_name = 'ROUND(cast(CASE \
                            WHEN  trans_request.has_original_video = \'Y\' or parent.has_tc_service = \'N\'    \
                            THEN 0 \
                            WHEN request_detail.status = 1 and trans_request.tc_price_set = \'Y\' \
                            THEN trans_request.tc_price_value \
                            WHEN request_detail.status = 1 and trans_request.tc_price_set = \'N\' \
                            THEN company_price.tc_price * trans_request.duration_minute \
                            ELSE trans_request.tc_work_price \
                            END as numeric), 3)';
                            break;
                    case 6:
                        //작업금액 (번역)
                            field_name = 'ROUND(cast(CASE \
                            WHEN  request_detail.status <= 3 and request_detail.translate_price_set = \'Y\'  \
                            THEN  request_detail.translate_price_value \
                            WHEN request_detail.status <= 3 and request_detail.translate_price_set = \'N\'  \
                            THEN company_price.trans_price * trans_request.duration_minute \
                            ELSE request_detail.translate_work_price \
                            END as numeric), 3)';
                            break;       
                    case 7:
                            //작업금액 (검수)
                            field_name = 'ROUND(cast(CASE \
                            WHEN  trans_request.is_native_review = \'N\'  \
                            THEN 0 \
                            WHEN request_detail.status <= 5 and request_detail.review_price_set = \'Y\' \
                            THEN request_detail.review_price_value \
                            WHEN request_detail.status <= 5 and request_detail.review_price_set = \'N\' \
                            THEN company_price.test_price * trans_request.duration_minute \
                            ELSE request_detail.review_work_price \
                            END as numeric), 3)';
                            break;       
                }

                if( (isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)))
                ||  (isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price))) ) {
                    if(search.price_type == 1) {
                        query = query.andWhere('trans_request.currency_type=\'JPY\'')
                        sum_query = sum_query.andWhere('trans_request.currency_type=\'JPY\'')
                    }
                    else if(search.price_type == 2) {
                        query = query.andWhere('trans_request.currency_type=\'KRW\'')
                        sum_query = sum_query.andWhere('trans_request.currency_type=\'KRW\'')
                    }
                    else if(search.price_type == 3) {
                        query = query.andWhere('trans_request.currency_type=\'USD\'')
                        sum_query = sum_query.andWhere('trans_request.currency_type=\'USD\'')
                    }
                }

                if( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) {
                    query = query.andWhere(field_name + ' >= ' + search.start_work_price);
                    sum_query = sum_query.andWhere(field_name + ' >= ' + search.start_work_price);
                }    
                if( isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price)) ) {
                    query = query.andWhere(field_name + ' <= ' + search.end_work_price);
                    sum_query = sum_query.andWhere(field_name + ' <= ' + search.end_work_price);
                }
                // 고객사, 요청자
                if(isNotEmpty(search.companies) && isArray(search.companies) && search.companies.length > 0) {      
                    //parent
                    let company_query = '"user"."parent_id" = :company1', filter = {};    
                    if(search.companies.length > 0) {
                        filter = {
                            ...filter,
                            'company1': search.companies[0]
                        }
                        for(let i = 1; i < search.companies.length; i ++) {
                            company_query += ' or "user"."parent_id" = :company' + (i + 1);
                            let key = `company${i+1}`
                            filter = {
                                ...filter,
                                [key]: search.companies[i]
                            }
                        }
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(company_query, filter)
                        }));
                        sum_query = sum_query.andWhere(new Brackets(qb => {
                            qb.where(company_query, filter)
                        }));
                    }
                }
                if(isNotEmpty(search.requesters) && isArray(search.requesters) && search.requesters.length > 0) {
                    let requester_query = '"trans_request"."userId" = :requester1', filter = {};    
                    if(search.requesters.length > 0) {
                        filter = {
                            ...filter,
                            'requester1': search.requesters[0]
                        }
                        for(let i = 1; i < search.requesters.length; i ++) {
                            requester_query += ' or "trans_request"."userId" = :requester' + (i + 1);
                            let key = `requester${i+1}`
                            filter = {
                                ...filter,
                                [key]: search.requesters[i]
                            }
                        }
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(requester_query, filter)
                        }));
                        sum_query = sum_query.andWhere(new Brackets(qb => {
                            qb.where(requester_query, filter)
                        }));
                    }   
                }
                //tc user
                if(isNotEmpty(search.tc_users) && isArray(search.tc_users) && search.tc_users.length > 0) {
                    let tc_query = '"trans_request"."tcUserId" = :tcUser1', filter = {};    
                    if(search.tc_users.length > 0) {
                        filter = {
                            ...filter,
                            'tcUser1': search.tc_users[0]
                        }
                        for(let i = 1; i < search.tc_users.length; i ++) {
                            tc_query += ' or "trans_request"."tcUserId" = :tcUser' + (i + 1);
                            let key = `tcUser${i+1}`
                            filter = {
                                ...filter,
                                [key]: search.tc_users[i]
                            }
                        }
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(tc_query, filter)
                        }));
                        sum_query = sum_query.andWhere(new Brackets(qb => {
                            qb.where(tc_query, filter)
                        }));
                    }   
                }
                // translate user
                if(isNotEmpty(search.translate_users) && isArray(search.translate_users) && search.translate_users.length > 0) {
                    let translate_query = '("translate_worker"."userId" = :translateUser1 and "translate_worker"."worker_type" = 5)', filter = {};    
                    if(search.translate_users.length > 0) {
                        filter = {
                            ...filter,
                            'translateUser1': search.translate_users[0]
                        }
                        for(let i = 1; i < search.translate_users.length; i ++) {
                            translate_query += ' or ("translate_worker"."userId" = :translateUser' + (i + 1) + ' and "translate_worker"."worker_type" = 5)';
                            let key = `translateUser${i+1}`
                            filter = {
                                ...filter,
                                [key]: search.translate_users[i]
                            }
                        }
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(translate_query, filter)
                        }));
                        sum_query = sum_query.andWhere(new Brackets(qb => {
                            qb.where(translate_query, filter)
                        }));
                    }   
                }
                //review_users
                if(isNotEmpty(search.review_users) && isArray(search.review_users) && search.review_users.length > 0) {
                    let review_query = '("review_worker"."userId" = :reviewUser1 and "review_worker"."worker_type" = 6)', filter = {};    
                    if(search.review_users.length > 0) {
                        filter = {
                            ...filter,
                            'reviewUser1': search.review_users[0]
                        }
                        for(let i = 1; i < search.review_users.length; i ++) {
                            review_query += ' or ("review_worker"."userId" = :reviewUser' + (i + 1) + ' and "review_worker"."worker_type" = 6)';
                            let key = `reviewUser${i+1}`
                            filter = {
                                ...filter,
                                [key]: search.review_users[i]
                            }
                        }
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(review_query, filter)
                        }));
                        sum_query = sum_query.andWhere(new Brackets(qb => {
                            qb.where(review_query, filter)
                        }));
                    }   
                }

                if( isNotEmpty(search.search_keyword) ) {
                    let field_name = ''
                    if(isEmpty(search.keyword_type) || isEmpty(search.search_type))
                        return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' })
                    switch(search.keyword_type) {
                        case 1:
                            field_name = '"trans_request"."title"'
                            break;
                        case 2:
                            field_name = '"request_detail"."id"::varchar(255)'
                            break;
                        case 3:
                            field_name = '"trans_request"."requester_memo"'
                            break;
                    }
                    if(search.search_type == 1) {
                        query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                        sum_query = sum_query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                    }
                    else {
                        query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
                        sum_query = sum_query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
                    }
                }

                if(isNotEmpty(search.extras) && isArray(search.extras) && search.extras.length > 0) {
                    let extra_query = '1 != 1'
                    for(let i = 0; i < search.extras.length; i ++) {
                        if(search.extras[i] == 0)
                            extra_query += ' or ("trans_request"."has_original_video" = \'Y\')'
                        else if(search.extras[i] == 1)
                            extra_query += ' or ("trans_request"."has_original_video" = \'N\')'
                        else if(search.extras[i] == 2)
                            extra_query += ' or ("trans_request"."is_urgent" = \'Y\')'
                        else if(search.extras[i] == 3)
                            extra_query += ' or ("trans_request"."is_urgent" = \'N\')'
                        else if(search.extras[i] == 4)
                            extra_query += ' or ("trans_request"."is_title_desc" = \'Y\')'
                        else if(search.extras[i] == 5)
                            extra_query += ' or ("trans_request"."is_title_desc" = \'N\')'
                        else if(search.extras[i] == 6)
                            extra_query += ' or ("trans_request"."is_native_review" = \'Y\')'
                        else if(search.extras[i] == 7)
                            extra_query += ' or ("trans_request"."is_native_review" = \'N\')'
                        else if(search.extras[i] == 8)
                            extra_query += ' or ("trans_request"."is_youtube_request" = \'Y\')'
                        else if(search.extras[i] == 9)
                            extra_query += ' or ("trans_request"."is_youtube_request" = \'N\')'
                        else if(search.extras[i] == 10)
                            extra_query += ' or ("trans_request"."is_card_payment" = \'Y\' and "trans_request"."work_price" != 0)'
                        else if(search.extras[i] == 11)
                            extra_query += ' or ("trans_request"."is_card_payment" = \'N\' and "trans_request"."work_price" != 0)'
                        else if(search.extras[i] == 12)
                            extra_query += ' or ("trans_request"."work_price" = 0)'
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(extra_query)
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where(extra_query)
                    }));
                }
            }
            query = query.orderBy('request_detail.id', 'DESC')
            sum_query = sum_query.groupBy('request_detail.id');

            let __sum_query = getConnection()
                                .createQueryBuilder()
                                .select('ROUND(cast(sum(src.tc_price) as numeric), 3)', 'tc_work_price_sum')
                                .addSelect('ROUND(cast(sum(src.translate_price) as numeric), 3)', 'translate_work_price_sum')
                                .addSelect('ROUND(cast(sum(src.review_price) as numeric), 3)', 'review_work_price_sum')
                                .addSelect('ROUND(cast(sum(src.work_sum_price) as numeric), 3)', 'total_work_price_sum')
                                .addSelect('sum(src.duration)', 'duration_sum')
                                .addSelect('sum(src.jpy_work_price)', 'jpy_price_sum')
                                .addSelect('sum(src.krw_work_price)', 'krw_price_sum')
                                .addSelect('sum(src.usd_work_price)', 'usd_price_sum')
                                .from('(' + sum_query.getQuery() + ')', 'src')
                                .setParameters(sum_query.getParameters());

            let _result_sum = await __sum_query.getRawOne();

            let totals = await query.getCount();
            if(isNotEmpty(table)) {
                query.skip((table.page - 1) * table.page_length)
                .take(table.page_length);
            }
            let _result = await query.getMany();
            let table_data: Array<any>;
            table_data = [];
            for(let i = 0; i < _result.length; i ++) {
                let item = _result[i];
                let table_item: {[k: string]: any} = {};
                table_item = {
                    work_no: item.id, //작업번호
                    tc_id: item.request.id, //tc id
                    tc_work_no: item.request.id,
                    status: (item.status <= 8 ? global.STATUS[item.status - 1] : 'subtitle_apply_failed'), //진행상태
                    title: item.request.title, //제목
                    duration: item.request.duration, //영상길이
                    youtube_url: item.request.youtube_url,
                    original_language: item.request.original_language.prefix, //원본언어
                    translate_language: item.translate_language.prefix, //번역언어
                    payment_method: item.request.work_price == 0 ? 'F' : item.request.is_card_payment, //선결제
                    currency_type: item.request.currency_type, //화폐종류
                    work_price: item.work_price, //번역금액
                    original_video: isEmpty(item.request.original_video) ? '' : (item.request.original_video), //원본자막
                    tc_video: isEmpty(item.request.tc_video) ? '' : (item.request.tc_video), //TC자막
                    translate_video: isEmpty(item.translate_video) ? '' : (item.translate_video), //번역자막
                    review_video: isEmpty(item.review_video) ? '' : (item.review_video), //검수자막
                    emergency_request_check: item.request.is_urgent, //긴급번역24시간
                    title_request_check: item.request.is_title_desc, //제목/설명 번역
                    native_review_check: item.request.is_native_review, //원어민 검수
                    youtube_apply_check: item.request.is_youtube_request, //Youtube 자동적용
                    company_name: item.request.user.parent.company_name, //고객사 이름
                    company_user_id: item.request.user.parent.login_id, //고객사 아이디
                    company_user_no: item.request.user.parent.id,
                    user_name: item.request.user.user_name, //요청자 이름
                    user_id: item.request.user.login_id, //요청자 아이디
                    user_no: item.request.user.id, //요청자 아이디
                    tc_user_name: isEmpty(item.request.tc_user) ? null : item.request.tc_user.user_name, //TC작업자 이름
                    tc_user_id: isEmpty(item.request.tc_user) ? null : item.request.tc_user.login_id, //TC작업자 아이디
                    tc_user_no: isEmpty(item.request.tc_user) ? null : item.request.tc_user.id, //TC작업자 번호
                    req_date: item.request.create_date, //작업요청 일시
                    predict_end_date: item.request.predict_end_date, //작업완료 예정일시
                    end_date: item.end_date, //작업완료일시
                    is_end: item.is_end, //작업완료여부
                    requester_memo: (isEmpty(item.request.requester_memo) ? '' : item.request.requester_memo) 
                }
                if(global.STATUS[item.status - 1] == 'tc_ing' || global.STATUS[item.status - 1] == 'translating' || global.STATUS[item.status - 1] == 'reviewing' || item.is_end == 'Y') {
                    table_item.can_push = 'N';
                }
                else {
                    table_item.can_push = 'Y'
                }
                table_item.tc_end_date = item.request.tc_end_date;
                table_item.tc_predict_end_date = item.request.tc_predict_end_date;
                table_item.translate_user_no = table_item.translate_user_name = table_item.translate_user_id = table_item.translate_end_date = table_item.translate_predict_end_date = null;
                table_item.review_user_no = table_item.review_user_name = table_item.review_user_id = table_item.review_end_date = table_item.review_predict_end_date = null;
                if(isArray(item.workers)) {
                    for(let i = 0; i < item.workers.length; i ++) {
                        if(item.workers[i].worker_type == global.ROLE.indexOf('translator') + 1) {
                            table_item.translate_end_date = item.workers[i].end_date;
                            table_item.translate_predict_end_date = item.workers[i].predict_end_date;
                            table_item.translate_user_name = item.workers[i].user.user_name;
                            table_item.translate_user_id = item.workers[i].user.login_id;
                            table_item.translate_user_no = item.workers[i].user.id;
                        }
                        else if(item.workers[i].worker_type == global.ROLE.indexOf('reviewer') + 1) {
                            table_item.review_end_date = item.workers[i].end_date;
                            table_item.review_predict_end_date = item.workers[i].predict_end_date;
                            table_item.review_user_name = item.workers[i].user.user_name;
                            table_item.review_user_id = item.workers[i].user.login_id;
                            table_item.review_user_no = item.workers[i].user.id;
                        }
                    }
                }

                table_item.no_need_tc_work = false
                if (item.request.has_original_video == Trigger.OFF && item.request.user.parent.has_tc_service == Trigger.ON) {
                    table_item.no_need_tc_work = false
                }
                else
                    table_item.no_need_tc_work = true
                
                if(item.request.has_original_video == Trigger.OFF && item.request.user.parent.has_tc_service == Trigger.ON && global.STATUS[item.status - 1] == 'preparing') {
                    table_item.tc_predict_time_can_edit = 'Y';
                    if(item.request.tc_predict_time_set == Trigger.ON)
                        table_item.tc_predict_end_date = item.request.tc_predict_time_value;
                    else
                        table_item.tc_predict_end_date = await calc_working_time(item.request.user.parent.screen_time_limit, item.request.user.parent.end_time_settings, item.request.duration_minute, global.ROLE.indexOf('tc') + 1, item.request.is_urgent);
                }
                else if ((item.request.has_original_video == Trigger.ON || item.request.user.parent.has_tc_service == Trigger.OFF) && global.STATUS[item.status - 1] == 'preparing') {
                    table_item.translate_predict_time_can_edit = 'Y';
                    if(item.translate_predict_time_set == Trigger.ON)
                        table_item.translate_predict_end_date = item.translate_predict_time_value;
                    else {
                        table_item.translate_predict_end_date = await calc_working_time(item.request.user.parent.screen_time_limit, item.request.user.parent.end_time_settings, item.request.duration_minute, global.ROLE.indexOf('translator') + 1, item.request.is_urgent);
                    }
                }
                else if(global.STATUS[item.status - 1] == 'tc_complete') {
                    table_item.translate_predict_time_can_edit = 'Y';
                    if(item.translate_predict_time_set == Trigger.ON)
                        table_item.translate_predict_end_date = item.translate_predict_time_value;
                    else
                        table_item.translate_predict_end_date = await calc_working_time(item.request.user.parent.screen_time_limit, item.request.user.parent.end_time_settings, item.request.duration_minute, global.ROLE.indexOf('translator') + 1, item.request.is_urgent);
                }
                else if(global.STATUS[item.status - 1] == 'translation_complete' && item.request.is_native_review == Trigger.ON) {
                    table_item.review_predict_time_can_edit = 'Y';
                    if(item.review_predict_time_set == Trigger.ON)
                        table_item.review_predict_end_date = item.review_predict_time_value;
                    else
                        table_item.review_predict_end_date = await calc_working_time(item.request.user.parent.screen_time_limit, item.request.user.parent.end_time_settings, item.request.duration_minute, global.ROLE.indexOf('reviewer') + 1, item.request.is_urgent);
                }
                table_item.tc_work_price = item.temp_price;
                table_item.translate_work_price = item.temp_price_translate;
                table_item.review_work_price = item.temp_price_review;
                table_item.sum_work_price = item.temp_sum_price;
                table_data.push(table_item);
            }
            return res.json({ errorCode: 0, errorMsg: "", data: {
                totalCount: totals,
                list: table_data,
                duration_sum: isEmpty(_result_sum.duration_sum) ? 0 : _result_sum.duration_sum,  
                jpy_price_sum: isEmpty(_result_sum.jpy_price_sum) ? 0 : _result_sum.jpy_price_sum,
                krw_price_sum: isEmpty(_result_sum.krw_price_sum) ? 0 : _result_sum.krw_price_sum,
                usd_price_sum: isEmpty(_result_sum.usd_price_sum) ? 0 : _result_sum.usd_price_sum,
                total_work_price_sum: isEmpty(_result_sum.total_work_price_sum) ? 0 : _result_sum.total_work_price_sum,
                tc_work_price_sum: isEmpty(_result_sum.tc_work_price_sum) ? 0 : _result_sum.tc_work_price_sum,
                translate_work_price_sum: isEmpty(_result_sum.translate_work_price_sum) ? 0 : _result_sum.translate_work_price_sum,
                review_work_price_sum: isEmpty(_result_sum.review_work_price_sum) ? 0 : _result_sum.review_work_price_sum
            } });
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    {
        table: {
            page: 1,
            page_length: 20
        },
        search: {
            date_type: 1~ 작업요청일시, 2~ 작업완료일시
            start_date: 12329334,
            end_date: 12329334,
            finish_work_type: 1, // 전체 선택한 경우 Parameter를 업로드 하지 말것.  1:작업전체완료, 2:작업부분완료, 3: 작업미완료
            status: ['preparing', '', '' , ''], // 전체 선택한 경우 Parameter를 업로드하지 말것.
            start_work_price: 0,
            end_work_price: 500,
            original_language: 2, // 원본언어, 전체 선택한 경우 Parameter를 업로드 하지 말것.
            translate_language: 2, //번역언어, 전체 선택한 경우 Parameter를 업로드 하지 말것.
            keyword_type: 1, // 1: 제목 , 2: 작업번호
            search_keyword: 'asdf', // 검색어
            search_type: 1,  // 1: 포함, 2: 일치
            requesters: []
        }
    }
    */
    static getRequestList = async(req: Request, res: Response) => {
        try {
            const { table, search } = req.body;
            let query = getRepository(TransRequest)
                        .createQueryBuilder("trans_request")
                        .leftJoinAndSelect("trans_request.details", "request_detail")
                        .leftJoinAndSelect("trans_request.user", "user")
                        .leftJoinAndSelect("trans_request.original_language", "woring_language")
                        .leftJoinAndSelect("request_detail.translate_language", "woring_language A");
        
            let sum_query = getRepository(TransRequest)
                            .createQueryBuilder("trans_request")
                            .select("sum(trans_request.duration) / count(trans_request.id)" , "duration_sum")
                            .addSelect("sum(trans_request.work_price) / count(trans_request.id)" , "work_price_sum")
                            .leftJoin("trans_request.details", "request_detail")
                            .leftJoin("trans_request.user", "user")
                            .leftJoin("trans_request.original_language", "woring_language")
                            .leftJoin("request_detail.translate_language", "woring_language A");
            
            if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                query = query.leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
                sum_query = sum_query.leftJoin(Manager, 'manager', 'user.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
            }
            if( global.ROLE[req.decodedUser.user_type - 1] == 'requester' ) {
                query = query.where('"trans_request"."userId" = :user_id', {user_id: req.decodedUser.id});
                sum_query = sum_query.where('"trans_request"."userId" = :user_id', {user_id: req.decodedUser.id});
            }
            else if( global.ROLE[req.decodedUser.user_type - 1] == 'company' ) {
                query = query.where('"user"."parent_id" = :user_id', {user_id: req.decodedUser.id})
                sum_query = sum_query.where('"user"."parent_id" = :user_id', {user_id: req.decodedUser.id})
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                query = query.where('"manager"."id" is not null')
                sum_query = sum_query.where('"manager"."id" is not null')
            }
            if(isNotEmpty(search)) {
                if(isEmpty(search.date_type))
                    return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
                let field_name = '';
                if(search.date_type == 1)
                    field_name = 'trans_request.create_date';
                else
                    field_name = 'request_detail.end_date';
                //일자 범위 선택
                if(isNotEmpty(search.start_date)) {
                    query = query.andWhere(field_name + ' >= ' + search.start_date);
                    sum_query = sum_query.andWhere(field_name + ' >= ' + search.start_date);
                }
                if(isNotEmpty(search.end_date)) {
                    query = query.andWhere(field_name + ' <= ' + search.end_date);
                    sum_query = sum_query.andWhere(field_name + ' <= ' + search.end_date);
                }
                if(isNotEmpty(search.finish_work_type)) {
                    if(search.finish_work_type == 1) {
                        query = query.andWhere('"trans_request"."is_end" = :value', {value: 'Y'});
                        sum_query = sum_query.andWhere('"trans_request"."is_end" = :value', {value: 'Y'});
                    }
                    else if(search.finish_work_type == 2) {
                        // query = query.andWhere('"request_detail"."is_end" = :value', {value: 'Y'});
                        query = query.andWhere('"trans_request"."create_date" != "trans_request"."update_date"')
                                     .andWhere('"trans_request"."is_end" != :value', {value: 'Y'});
                        
                        sum_query = sum_query.andWhere('"trans_request"."create_date" != "trans_request"."update_date"')
                                             .andWhere('"trans_request"."is_end" != :value', {value: 'Y'});
                    }
                    else {
                        query = query.andWhere('"trans_request"."create_date" = "trans_request"."update_date"');
                        sum_query = sum_query.andWhere('"trans_request"."create_date" = "trans_request"."update_date"');
                    }
                }
                if(isNotEmpty(search.requesters) && isArray(search.requesters) && search.requesters.length > 0) {
                    let requester_query = '"trans_request"."userId" = :requester1', filter = {};
                    if(search.requesters.length > 0) {
                        filter = {
                            ...filter,
                            'requester1': search.requesters[0]
                        }
                        for(let i = 1; i < search.requesters.length; i ++) {
                            requester_query += ' or "trans_request"."userId" = :requester' + (i + 1);
                            let key = `requester${i+1}`
                            filter = {
                                ...filter,
                                [key]: search.requesters[i]
                            }
                        }
                        query = query.andWhere(new Brackets(qb => {
                            qb.where(requester_query, filter)
                        }));
                        sum_query = sum_query.andWhere(new Brackets(qb => {
                            qb.where(requester_query, filter)
                        }));
                    }
                }
                if(isNotEmpty(search.status) && isArray(search.status) && search.status.length > 0) {
                    let status_query = '"request_detail"."status" = :status1', filter = {};
                    filter = {
                        ...filter,
                        'status1': global.STATUS.indexOf(search.status[0]) + 1
                    }
                    for(let i = 1; i < search.status.length; i ++) {
                        status_query += ' or "request_detail"."status" = :status' + (i + 1);
                        let key = `status${i+1}`
                        filter = {
                            ...filter,
                            [key]: global.STATUS.indexOf(search.status[i]) + 1
                        }
                    }
                    query = query.andWhere(new Brackets(qb => {
                        qb.where(status_query, filter)
                    }));
                    sum_query = sum_query.andWhere(new Brackets(qb => {
                        qb.where(status_query, filter)
                    }));
                }
                if( isNotEmpty(search.start_work_price) && (isNumber(search.start_work_price) || isNumberString(search.start_work_price)) ) {
                    query = query.andWhere('"trans_request"."work_price" >= ' + search.start_work_price);
                    sum_query = sum_query.andWhere('"trans_request"."work_price" >= ' + search.start_work_price);
                }
                if( isNotEmpty(search.end_work_price) && (isNumber(search.end_work_price) || isNumberString(search.end_work_price)) ) {
                    query = query.andWhere('"trans_request"."work_price" <= ' + search.end_work_price);
                    sum_query = sum_query.andWhere('"trans_request"."work_price" <= ' + search.end_work_price);
                }
        
                if( isNotEmpty(search.original_language) ) {
                    query = query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                    sum_query = sum_query.andWhere('"trans_request"."originalLanguageId" = :original_language', {original_language: search.original_language});
                }
                if( isNotEmpty(search.translate_language) ) {
                    query = query.andWhere('"request_detail"."translateLanguageId" = :translate_language', {translate_language: search.translate_language})
                    sum_query = sum_query.andWhere('"request_detail"."translateLanguageId" = :translate_language', {translate_language: search.translate_language})
                }
                /*
                keyword_type: 1, // 1: 제목 , 2: 작업번호
                search_keyword: 'asdf', // 검색어
                search_type: 1  // 1: 포함, 2: 일치
                */
               if( isNotEmpty(search.search_keyword) ) {
                   if(isEmpty(search.keyword_type) || isEmpty(search.search_type))
                        return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' })
                    switch(search.keyword_type) {
                        case 1:
                            field_name = '"trans_request"."title"'
                            break;
                        case 2:
                            field_name = '"request_detail"."id"::varchar(255)'
                            break;
                        case 3:
                            field_name = '"trans_request"."requester_memo"'
                            break;
                    }
                    if(search.search_type == 1) {
                        query = query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                        sum_query = sum_query.andWhere(field_name + ' like :field_name' , {field_name: '%' + search.search_keyword + '%'});
                    }
                    else {
                        query = query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
                        sum_query = sum_query.andWhere(field_name + ' = :field_name' , {field_name: search.search_keyword});
                    }
               }
            }
            query = query.orderBy("trans_request.create_date", "DESC");

            let totals = await query.getCount()
            sum_query = sum_query.groupBy('trans_request.id');
            let __sum_query = getConnection()
                            .createQueryBuilder()
                            .select('sum(src.duration_sum)', 'duration_sum')
                            .addSelect('sum(src.work_price_sum)', 'work_price_sum')
                            .from('(' + sum_query.getQuery() + ')', 'src')
                            .setParameters(sum_query.getParameters());
        
            let _result_sum = await __sum_query.getRawOne();
        
            if(isNotEmpty(table)) {
                query.skip((table.page - 1) * table.page_length)
                .take(table.page_length);
            }
            
            let _result = await query.getMany();
            let table_data: Array<any>;
            table_data = [];
        
            for(let i = 0; i < _result.length; i ++) {
                let item = _result[i];
                let table_item: {[k: string]: any} = {};
                //N , 1
                table_item.translate_languages = [];
                if(isArray(item.details) && item.details.length > 1) {
                    table_item.can_expand = 'Y';
                    table_item.end_date = item.end_date;
                    for(let i = 0; i < item.details.length; i ++)
                        table_item.translate_languages.push(item.details[i].translate_language.prefix);
                }
                else if(isArray(item.details) && item.details.length == 1) {
                    table_item.can_expand = 'N';
                    table_item.work_no = item.details[0].id
                    table_item.translate_languages.push(item.details[0].translate_language.prefix);
                    table_item.end_date = item.details[0].end_date;
                    if( item.is_native_review == 'Y' )
                        table_item.translate_video = isEmpty(item.details[0].review_video) ? '' : (item.details[0].review_video);
                    else
                        table_item.translate_video = isEmpty(item.details[0].translate_video) ? '' : (item.details[0].translate_video);
                }
                else {
                    table_item.can_expand = 'N';
                }
                table_item = {
                    ...table_item,
                    status: (item.status <= 8 ? global.STATUS[item.status - 1] : 'subtitle_apply_failed'),
                    title: item.title,
                    youtube_url: item.youtube_url,
                    duration: item.duration,
                    original_language: item.original_language.prefix,
                    work_price: item.work_price,
                    emergency_request_check: item.is_urgent,
                    title_request_check: item.is_title_desc,
                    native_review_check: item.is_native_review,
                    youtube_apply_check: item.is_youtube_request,
                    request_date: item.create_date,
                    predict_end_date: item.predict_end_date,
                    requester_memo: (isEmpty(item.requester_memo) ? '' : item.requester_memo) 
                };
                if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                    table_item.requester_user_name = item.user.user_name;
                    table_item.requester_user_id = item.user.login_id;
                }
                table_item.end_type = 3;
                if(isNotEmpty(item.original_video))
                    table_item.original_video = item.original_video;
                if(table_item.can_expand == 'Y') {
                    table_item.child = [];
                    for(let i = 0; i < item.details.length; i ++) {
                        if(item.details[i].is_end == 'Y')
                            table_item.end_type = 2;
                        let child_item: {[k: string]: any} = {};
                        child_item = {
                            work_no: item.details[i].id,
                            status: (item.details[i].status <= 8 ? global.STATUS[item.details[i].status-1] : 'subtitle_apply_failed'),
                            title: item.title,
                            duration: item.duration,
                            original_language: item.original_language.prefix,
                            translate_language: item.details[i].translate_language.prefix,
                            work_price: item.details[i].work_price,
                            requester_memo: (isEmpty(item.requester_memo) ? '' : item.requester_memo)
                        };
                        if(isNotEmpty(item.original_video))
                            child_item.original_video = item.original_video;
                        if(item.is_native_review == 'Y')
                            child_item.translate_video = isEmpty(item.details[i].review_video) ? '' : (item.details[i].review_video);
                        else
                            child_item.translate_video = isEmpty(item.details[i].translate_video) ? '' : (item.details[i].translate_video);
                        child_item.end_date = item.details[i].end_date;
                        child_item.is_end = item.details[i].is_end;
                        //
                        let mid_push = false
                        for(let j = 0; j < table_item.child.length; j ++) {
                            if(table_item.child[j].work_no < child_item.work_no) {
                                table_item.child.splice(j, 0, child_item)
                                mid_push = true
                                break;
                            }
                        }
                        if(!mid_push)
                            table_item.child.push(child_item);
                        //
                    }
                }
                else {
                    if (isArray(item.details) && item.details[0].is_end == 'Y')
                        table_item.end_type = 1;
                }
                if(item.is_end == 'Y')
                    table_item.end_type = 1;
                table_data.push(table_item);
            }
            return res.json({ errorCode: 0, errorMsg: '',
                            data: {totalCount: totals,
                                    list: table_data,
                                    duration_sum: isEmpty(_result_sum.duration_sum) ? 0 : _result_sum.duration_sum,
                                    work_price_sum: isEmpty(_result_sum.work_price_sum) ? 0 : _result_sum.work_price_sum}});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default SubtitleHistoryController;