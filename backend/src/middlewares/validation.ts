import { Inquiry } from './../entity/inquiry';
import { User } from './../entity/user';
import { isEmpty, isNotEmpty, isArray } from 'class-validator';
import { Request, Response, NextFunction } from "express";
import { getRepository } from "typeorm";
import fs from "fs";
import global from "../config/global";
import config from "../config/config";
export const removeFile = (req: Request, prefix: String = '') => {
    if(req.file) {
        if(prefix == '')
            fs.unlinkSync(config.LOCATION_PATH + '/'  + req.file.filename)
        else
            fs.unlinkSync(config.LOCATION_TRANSLATE_PATH + '/'  + req.file.filename)
    }
    else if( req.files && Array.isArray(req.files)) {
        for(let i = 0; i < req.files.length; i ++) {
            fs.unlinkSync(config.LOCATION_INQUIRY_PATH + req.files[i]['filename'])
        }
    }
    else if( req.files ) {
        if(Object.create(req.files)['file']) {
            fs.unlinkSync(config.LOCATION_PATH + '/'  + Object.create(req.files)['file'][0]['filename'])
        }
        if(Object.create(req.files)['logo']) {
            fs.unlinkSync(config.LOCATION_PATH + '/'  + Object.create(req.files)['logo'][0]['filename'])
        }
    }
}
export const requestTranslateValidation = async(req: Request, res: Response, next: NextFunction) => {
    const {
        youtube_url , youtube_id, predict_time, work_price, original_language, translate_languages
    } = req.body;
    let resp = { errorCode: 0, errorMsg: '' }
    const userRepository = getRepository(User);
    if(global.ROLE[req.decodedUser.user_type - 1] != 'requester') {
        if(isEmpty(req.body.requester_id)) {
            //고객사 , 관리자인 경우 요청자 아이디는 필수 입력값
            resp.errorCode = 400;
            resp.errorMsg = 'Invalid Parameter';
        }
        else if(isEmpty(req.body.company_id) && (global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'manager')) {
            resp.errorCode = 400;
            resp.errorMsg = 'Invalid Parameter';
        }
        else {
            res.locals.requester_id = req.body.requester_id
            let user = await userRepository.findOne(req.body.requester_id);
            if(user == undefined) {
                resp.errorCode = 15;
                resp.errorMsg = 'invalid requester id';
            }
            else {
                if(global.ROLE[req.decodedUser.user_type - 1] == 'company' ) {
                    if(user.parent_id != req.decodedUser.id) {
                        resp.errorCode = 401;
                        resp.errorMsg = 'no permission to use this requester id.'
                    }
                    else
                        res.locals.company_id = req.decodedUser.id
                }
                else if(global.ROLE[req.decodedUser.user_type - 1] == 'admin' || global.ROLE[req.decodedUser.user_type - 1] == 'manager'){
                    if(user.parent_id != req.body.company_id) {
                        resp.errorCode = 401;
                        resp.errorMsg = 'no permission to use this requester id.'
                    }
                    else
                        res.locals.company_id = req.body.company_id
                }
            }
        }
    }
    else {
        res.locals.requester_id = req.decodedUser.id
        let user = await userRepository.findOne(req.decodedUser.id);
        if(user == undefined) {
            resp.errorCode = 15;
            resp.errorMsg = 'invalid requester id';
        }
        else
            res.locals.company_id = user.parent_id
    }
    if(isEmpty(youtube_url) || isEmpty(youtube_id) || isEmpty(predict_time)
        || isEmpty(work_price) || isEmpty(original_language) || isEmpty(translate_languages) || !isArray(translate_languages) || translate_languages.length < 1) {
            resp.errorCode = 400;
            resp.errorMsg = 'Invalid Parameter';
    }
    if(resp.errorCode == 0) {
        let user = await userRepository.findOne(res.locals.company_id)
        if(user == undefined) {
            resp.errorCode = 15;
            resp.errorMsg = 'invalid company id';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req, 'translate')
        return res.json(resp);
    }
    next();
    return;
}
export const registerInquiryValidation = async(req: Request, res: Response, next: NextFunction) => {
    const {
        title,
        content
    } = req.body;
    let resp = {
        errorCode: 0, errorMsg: ''
    }
    if(isEmpty(title) || isEmpty(content)) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter'
    }

    if(isNotEmpty(req.body.id)) {
        const inquiryRepository = getRepository(Inquiry);
        let inquiry = await inquiryRepository.findOne(req.body.id)
        if(inquiry == undefined) {
            resp.errorCode = 15;
            resp.errorMsg = 'invalid inquiry id';
        }
        else if(global.ROLE[req.decodedUser.user_type - 1] != 'admin' && inquiry.user?.id != req.decodedUser.id ) {
            resp.errorCode = 401;
            resp.errorMsg = 'no permission to edit inquiry';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req);
        return res.json(resp);
    }
    next();
    return;
}
export const registerAdminValidation = async (req: Request, res: Response, next: NextFunction) => {
    const {
        user_id,
        user_name,
        system_lang,
        email_notice_check,
        sms_notice_check
    } = req.body;
    if (req.fileValidationError) {
        return res.json({ errorCode: 10, errorMsg: 'You can select only image file' });
    }
    let resp = {
        errorCode: 0, errorMsg: ''
    }
    if(isEmpty(user_id) || isEmpty(user_name) || isEmpty(system_lang) || isEmpty(email_notice_check) || isEmpty(sms_notice_check)) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter'
    }
    if(isNotEmpty(req.body.id)) {
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.body.id);
            if(user === undefined) {
                resp.errorCode = 1;
                resp.errorMsg = 'failed to get user information';
            }
            else if(global.ROLE.indexOf("admin") < 0) {
                resp.errorCode = 2;
                resp.errorMsg = 'You can\'t edit because id is not admin id';
            }
        }
        catch(error) {
            console.log(error)
            resp.errorCode = 500;
            resp.errorMsg = 'Internal Server Error';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req);
        return res.json(resp);
    }
    next();
    return;
}
export const registerWorkValidation = async (req: Request, res: Response, next: NextFunction) => {
    const {
        user_type, // 계정 유형
        user_id, // 아이디
        user_name, // 이름
        country_code, // 코드
        phone_number, // 전화번호
        email, // 이메일
        system_lang, // 시스템언어
        correction_rate, // 작업금액 보정률
        can_work, // 동시작업 가능 수량
        sms_notice_check, // 알림톡 / SMS 알림
        email_notice_check // 이메일 알림
    } = req.body;
    if (req.fileValidationError) {
        return res.json({ errorCode: 10, errorMsg: 'You can select only image file' });
    }
    let resp = {
        errorCode: 0, errorMsg: ''
    }
    if( isEmpty(user_type) || isEmpty(user_id) || isEmpty(user_name)
    || isEmpty(country_code) || isEmpty(phone_number) || isEmpty(email) || isEmpty(system_lang)
    || isEmpty(correction_rate) || isEmpty(can_work) || isEmpty(sms_notice_check) || isEmpty(email_notice_check) ) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter'
    }
    if(isNotEmpty(req.body.id)) {
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.body.id);
            if(user === undefined) {
                resp.errorCode = 1;
                resp.errorMsg = 'failed to get user information';
            }
            else if(global.WORK_TYPE.indexOf(user.user_type) < 0) {
                resp.errorCode = 2;
                resp.errorMsg = 'You can\'t edit because id is not worker id';
            }
        }
        catch(error) {
            console.log(error)
            resp.errorCode = 500;
            resp.errorMsg = 'Internal Server Error';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req);
        return res.json(resp);
    }
    next();
    return;
};

export const registerManagerValidation = async (req: Request, res: Response, next: NextFunction) => {
    const {
        user_id,
        user_name,
        system_lang,
        sms_notice_check,
        email_notice_check
    } = req.body;

    if (req.fileValidationError) {
        return res.json({ errorCode: 10, errorMsg: 'You can select only image file' });
    }
    let resp = {
        errorCode: 0, errorMsg: ''
    }
    if( isEmpty(user_id) || isEmpty(user_name)
        || isEmpty(system_lang) || isEmpty(sms_notice_check) || isEmpty(email_notice_check) ) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter'
    }   
    
    if (isNotEmpty(req.body.id)) {
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.body.id);
            if(user === undefined) {
                resp.errorCode = 1;
                resp.errorMsg = 'failed to get user information';
            }
            else if(global.ROLE[user.user_type-1] != 'manager') {
                resp.errorCode = 2;
                resp.errorMsg = 'You can\'t edit because id is not manager id';
            }
        }
        catch(error) {
            console.log(error);
            resp.errorCode = 500;
            resp.errorMsg = 'Internal Server Error';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req);
        return res.json(resp);
    }
    next();
    return;
}

export const registerRequesterValidation = async(req: Request, res: Response, next: NextFunction) => {
    const {
        user_id,
        user_name,
        // country_code,
        // phone_number,
        email,
        system_lang,
        sms_notice_check,
        email_notice_check,
        discount,
        free_req_cnt
    } = req.body;

    if (req.fileValidationError) {
        return res.json({ errorCode: 10, errorMsg: 'You can select only image file' });
    }
    let resp = {
        errorCode: 0, errorMsg: ''
    }
    if( isEmpty(user_id) || isEmpty(user_name) /*|| isEmpty(country_code) || isEmpty(phone_number) */
        || isEmpty(email) || isEmpty(system_lang) || isEmpty(sms_notice_check) || isEmpty(email_notice_check) ) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter'
    }
    if( global.ROLE[req.decodedUser.user_type - 1] == 'admin' && (isEmpty(discount) || isEmpty(free_req_cnt)) ) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter'
    }
    if(isNotEmpty(req.body.id)) {
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.body.id);
            if(user === undefined) {
                resp.errorCode = 1;
                resp.errorMsg = 'failed to get user information';
            }
            else if(global.ROLE[user.user_type-1] != 'requester') {
                resp.errorCode = 2;
                resp.errorMsg = 'You can\'t edit because id is not requester id';
            }
        }
        catch(error) {
            console.log(error);
            resp.errorCode = 500;
            resp.errorMsg = 'Internal Server Error';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req);
        return res.json(resp);
    }
    next();
    return;
}

export const registerCompanyValidation = async(req: Request, res: Response, next: NextFunction) => {
    const {
        user_id, company_name, country_code, phone_number, email, system_lang,
        currency_type, title_cost, premium_rate, is_base_price_set, general_screen_limit,
        general_end_time, emergency_screen_limit, free_screen_limit,
        tc_assign_type, translator_assign_type, reviewer_assign_type,
        general_trans_time,  general_trans_add_time, general_excess_time,
        general_excess_add_time, emergency_trans_time, emergency_add_time, use_terms 
    } = req.body;
    if (req.fileValidationError) {
        return res.json({ errorCode: 10, errorMsg: 'You can select only image file' });
    }
    let resp = {
        errorCode: 0, errorMsg: ''
    }
    if(isEmpty(user_id) || isEmpty(company_name) || isEmpty(country_code) || isEmpty(phone_number)
    || isEmpty(email) || isEmpty(system_lang) || isEmpty(currency_type) || isEmpty(title_cost) || isEmpty(premium_rate)
    || isEmpty(is_base_price_set) || isEmpty(general_screen_limit) || isEmpty(general_end_time) || isEmpty(emergency_screen_limit)
    || isEmpty(free_screen_limit) || isEmpty(tc_assign_type) || isEmpty(translator_assign_type) || isEmpty(reviewer_assign_type)
    || !isArray(general_trans_time) || !isArray(general_trans_add_time) || !isArray(general_excess_time)
    || !isArray(general_excess_add_time) || !isArray(emergency_trans_time) || !isArray(emergency_add_time)) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter';
    }

    if(isNotEmpty(req.body.original_languages) && isArray(req.body.original_languages) && req.body.original_languages.length > 0) {
        if(isEmpty(req.body.translate_languages) || !isArray(req.body.translate_languages)
        || isEmpty(req.body.work_price) || !isArray(req.body.work_price)
        || isEmpty(req.body.tc_price) || !isArray(req.body.tc_price)
        || isEmpty(req.body.trans_price) || !isArray(req.body.trans_price)
        || isEmpty(req.body.test_price) || !isArray(req.body.test_price)) {
            resp.errorCode = 400;
            resp.errorMsg = 'Invalid Parameter';
        }
        if( (isArray(req.body.translate_languages) && (req.body.translate_languages.length != req.body.original_languages.length))
        ||  (isArray(req.body.work_price) && (req.body.work_price.length != req.body.original_languages.length))
        ||  (isArray(req.body.tc_price) && (req.body.tc_price.length != req.body.original_languages.length))
        ||  (isArray(req.body.trans_price) && (req.body.trans_price.length != req.body.original_languages.length))
        ||  (isArray(req.body.test_price) && (req.body.test_price.length != req.body.original_languages.length)) ) {
            resp.errorCode = 400;
            resp.errorMsg = 'Invalid Parameter';
        }
    }

    if (isEmpty(use_terms)) {
        resp.errorCode = 400;
        resp.errorMsg = 'Invalid Parameter';
    }

    if(isNotEmpty(req.body.id)) {
        try {
            const userRepository = getRepository(User);
            let user = await userRepository.findOne(req.body.id);
            if(user === undefined) {
                resp.errorCode = 1;
                resp.errorMsg = 'failed to get user information';
            }
            else if(global.ROLE[user.user_type-1] != 'company') {
                resp.errorCode = 2;
                resp.errorMsg = 'You can\'t edit because id is not company id';
            }
        }
        catch(error) {
            console.log(error);
            resp.errorCode = 500;
            resp.errorMsg = 'Internal Server Error';
        }
    }
    if(resp.errorCode != 0) {
        removeFile(req);
        return res.json(resp);
    }
    next();
    return;
};

export const updateMyInfoValidation = (req: Request, res: Response, next: NextFunction) => {
    const {
        user_name,
        country_code,
        // phone_number,
        // email,
        system_lang,
        sms_notice_check,
        email_notice_check
    } = req.body;
    if (req.fileValidationError) {
        return res.json({ errorCode: 10, errorMsg: 'You can select only image file' });
    }
    if( (global.ROLE[req.decodedUser.user_type-1] != 'manager' && global.ROLE[req.decodedUser.user_type-1] != 'requester' && global.ROLE[req.decodedUser.user_type-1] != 'company' && (isEmpty(user_name) || isEmpty(country_code) || isEmpty(system_lang)
    || isEmpty(sms_notice_check) || isEmpty(email_notice_check)))
    || ( global.ROLE[req.decodedUser.user_type-1] == 'requester' && (isEmpty(user_name) || isEmpty(system_lang)
            || isEmpty(sms_notice_check) || isEmpty(email_notice_check)))
    || ( global.ROLE[req.decodedUser.user_type-1] == 'manager' && (isEmpty(system_lang) || isEmpty(sms_notice_check) || isEmpty(email_notice_check)) )
    || (global.ROLE[req.decodedUser.user_type-1] == 'company' && (isEmpty(system_lang) || isEmpty(sms_notice_check) || isEmpty(email_notice_check)))) {
        if( req.files ) {
            if(Object.create(req.files)['file']) {
                fs.unlinkSync(config.LOCATION_PATH + '/'  + Object.create(req.files)['file'][0]['filename'])
            }
            if(Object.create(req.files)['logo']) {
                fs.unlinkSync(config.LOCATION_PATH + '/'  + Object.create(req.files)['logo'][0]['filename'])
            }
        }
        return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter'});
    }
    next();
    return;
};

export const getWorkerListValidation = (req: Request, res: Response, next: NextFunction) => {
    const {
        table,
        search
    } = req.body;
    if(isNotEmpty(table)) {
        if(isEmpty(table.page) || isEmpty(table.page_length))
            return res.json( { errorCode: 400, errorMsg: 'Invalid Parameter' } )
    }
    if(isNotEmpty(search)) {
        if( isNotEmpty(search.keyword_type) && isEmpty(search.search_type) ) {
            return res.json( { errorCode: 400, errorMsg: 'Invalid Parameter' } )
        }
    }
    next();
    return;
}