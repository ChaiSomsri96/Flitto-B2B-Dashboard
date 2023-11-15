import { Comment } from './../entity/comment';
import { removeFile } from './../middlewares/validation';
import { InquiryAttach } from './../entity/inquiry-attach';
import { User } from './../entity/user';
import { Manager } from './../entity/manager';
import { getInquiryMaxId, insertNoticeUser, convertTranslateMsg } from './../helpers/db-util';;
import { Inquiry } from './../entity/inquiry';
import { getRepository, getConnection, Brackets } from 'typeorm';
import { isEmpty, isArray, isNotEmpty } from 'class-validator';
import { Request, Response } from "express";
import config from './../config/config';
import global from './../config/global';
import { Trigger } from './../entity/entity-enum';
import { Notice } from './../entity/notice';
import { sendTalk, sendSms, sendEmail, webPush } from './../helpers/notice-method';
import lang from "../lang/index";
class InquiryController {
    static uploadImage = async (req: Request, res: Response) => {
        if (req.file) {
            return res.json({ errorCode: 0, errorMsg: "", url: config.INQUIRY_PREFIX_URL + '/' + req.file.filename });
        }
        else {
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    /*
    table: {
        page: 1,
        page_length: 20
    },
    search: {
        user_type: ['tc', 'translator', 'reviewer', '', '']    // 유형 전체 선택인 케이스   Array로 request보내지 말고 -1 request 보낼것
        search_type: 1 , //1: 포함, 2: 일치
        keyword_type: 1, //1: 제목, 2: 작성자명, 3: 작성자 ID
        search_keyword: 'asdf' , //검색어
        notice_check: 'Y' ,
    }
    */
    static getInquiryList = async(req: Request, res: Response) => {
        const {
            table,
            search
        } = req.body;
        let query = getRepository(Inquiry)
                    .createQueryBuilder("inquiry");
        query = query.leftJoinAndSelect("inquiry.user", "user");
        query = query.leftJoinAndSelect("inquiry.comments", "comment");
        query = query.leftJoinAndSelect("inquiry.attaches", "inquiry_attach");
        query = query.leftJoinAndSelect(Inquiry, "A", '"inquiry"."parent_id" = "A"."parent_id"');
        query = query.leftJoinAndSelect(User, "B", '"A"."userId" = "B"."id"');
        if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {   
            query = query.leftJoin(Manager, 'manager', 'B.id = "manager"."requesterId" and "manager"."managerId" = ' + req.decodedUser.id)
        }
        query = query.where("1=1");
        query = query.andWhere('"user"."is_delete" = \'N\'');   
        query = query.andWhere(new Brackets(qb => {
            qb.where('"inquiry"."is_delete" = \'N\' or ("inquiry"."is_delete" = \'Y\' and "inquiry"."childs" > 0)')
        }))

        if(global.ROLE[req.decodedUser.user_type - 1] != 'admin' && global.ROLE[req.decodedUser.user_type - 1] != 'company' && global.ROLE[req.decodedUser.user_type - 1] != 'manager') {
            /* query = query.andWhere(new Brackets(qb => {
                qb.where('"inquiry"."userId" = :field_name or "A"."userId" = :field_name', { field_name: req.decodedUser.id })
            })); */
            query = query.andWhere(new Brackets(qb => {
                qb.where('"A"."type" = 2 or "A"."userId" = :field_name or "A"."parentUserId" = :field_name', { field_name: req.decodedUser.id })
            }));
        }
        else if(global.ROLE[req.decodedUser.user_type - 1] == 'company') {
            /* query = query.andWhere(new Brackets(qb => {
                qb.where('"inquiry"."userId" = :field_name or "user"."parent_id" = :field_name or \
                        "A"."userId" = :field_name or "B"."parent_id" = :field_name', { field_name: req.decodedUser.id })
            })); */
            query = query.andWhere(new Brackets(qb => {
                qb.where('"A"."type" = 2 or "A"."userId" = :field_name or "B"."parent_id" = :field_name or "A"."parentUserId" = :field_name or "A"."parentCompanyId" = :field_name', { field_name: req.decodedUser.id })
            }));
        }
        else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
            query = query.andWhere(new Brackets(qb => {
                qb.where('"A"."type" = 2 or "A"."userId" = :field_name or "manager"."id" is not null or "A"."parentUserId" = :field_name', { field_name: req.decodedUser.id })
            }));
        }
        if( !(search == null || search == undefined) ) {
            // 일자 범위 선택
            if(isNotEmpty(search.start_date))
                query = query.andWhere('inquiry.inquiry_date >= ' + search.start_date);
            if(isNotEmpty(search.end_date))
                query = query.andWhere('inquiry.inquiry_date <= ' + search.end_date);
            // 검색어
            let field_name = '';
            if( isNotEmpty(search.keyword_type) ) {
                switch(search.keyword_type) {
                    case 1:
                        field_name = 'A.title';
                        break;
                    case 2:
                        field_name = 'B.user_name';
                        break;
                    case 3:
                        field_name = 'B.login_id';
                        break;
                }
            }
            else
                field_name = 'A.title';
            if(isNotEmpty(search.search_keyword)) {
                if(isEmpty(search.search_type) || search.search_type == 1) {
                    query = query.andWhere(field_name + ' like :data' , {data: ('%' + search.search_keyword + '%').toString()});
                }
                else {
                    query = query.andWhere(field_name + ' = :data' , {data: search.search_keyword});
                }
            }
            if(isNotEmpty(search.notice_check) && search.notice_check == 'Y')
                query = query.andWhere('"inquiry"."type" = 2');
            //사용자 유형
            if( isArray(search.user_type) && search.user_type.length > 0 ) {
                let user_type_query = '"B"."user_type" = :user_type1' , filter = {};
                filter = {
                    ...filter,
                    'user_type1': global.ROLE.indexOf(search.user_type[0]) + 1
                }
                for( let i = 1; i < search.user_type.length; i ++ ) {
                    user_type_query += ' or "B"."user_type" = :user_type' + (i + 1);
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
        }
        query = query.orderBy('inquiry.type', 'DESC');
        query = query.addOrderBy('inquiry.inquiry_date', 'DESC');
        query = query.addOrderBy('inquiry.childs', 'DESC');
        query = query.addOrderBy('inquiry.create_date', 'DESC');
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
                depth: item.depth,
                type: item.type,
                reg_date: item.create_date,
                comment_count: item.comments.length,
                creator_user_id: item.user?.login_id,
                creator_user_name: item.user?.user_name,
                title: item.title,
                delete: item.is_delete,
                attach_count: item.attaches.length
            }
            let diffTime = Math.floor(Date.now() / 1000) - item.create_date;
            if(diffTime < 86400)
                table_item.is_new = 'Y'
            else
                table_item.is_new = 'N'
            if(global.ROLE[req.decodedUser.user_type - 1] == 'admin')
                table_item.user_type = item.user?.user_type;
            table_data.push(table_item);
        })
        return res.json({ errorCode: 0, errorMsg: '', data: {list: table_data , totalCount: totals} });
    }
    static deleteInquiry = async(req: Request, res: Response) => {
        const { inquiry_ids } = req.body;
        if(isEmpty(inquiry_ids))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            const inquiryRepository = getRepository(Inquiry);
            for(let i = 0; i < inquiry_ids.length; i ++) {
                let inquiry = await inquiryRepository.findOne(inquiry_ids[i]);
                if(inquiry == undefined)
                    continue;
                if(global.ROLE[req.decodedUser.user_type - 1] != 'admin' && inquiry.user?.id != req.decodedUser.id )
                    continue;
                inquiry.is_delete = Trigger.ON
                inquiry.type = 1
                inquiry.update_date = Math.floor(Date.now() / 1000);
                await inquiryRepository.save(inquiry);
            }
            return res.json({ errorCode: 0, errorMsg: "" });
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static deleteComment = async(req: Request, res: Response) => {
        const { id, inquiry_id } = req.body;
        if(isEmpty(id) || isEmpty(inquiry_id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        try {
            let _comment = await getRepository(Comment)
            .createQueryBuilder("comment")
            .leftJoinAndSelect("comment.user", "user")
            .leftJoinAndSelect("comment.inquiry", "inquiry")
            .where('"comment"."id" = :id', { id: id })
            .getOne();
            if(_comment == undefined)
                return res.json({ errorCode: 15, errorMsg: 'invalid comment id' });
            if( !(_comment.inquiry.id == inquiry_id && _comment.user.id == req.decodedUser.id))
                return res.json({ errorCode: 401, errorMsg: 'You do not have permission.' });
            await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Comment)
            .where('"comment"."inquiryId" = :inquiry_id and "comment"."userId" = :user_id and "comment"."id" = :id', {
                inquiry_id: inquiry_id,
                user_id: req.decodedUser.id,
                id: id
            })
            .execute();
            return res.json({errorCode: 0 , errorMsg: ""});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static registerComment  = async(req: Request, res: Response) => {
        const { comment, inquiry_id } = req.body;
        if(isEmpty(comment) || isEmpty(inquiry_id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        
        const inquiryRepository = getRepository(Inquiry);
        const userRepository = getRepository(User);
        try {
            let _comment;
            if(isEmpty(req.body.id)) {
                let _inquiry = await inquiryRepository.findOne(inquiry_id)
                if(_inquiry == undefined)
                    return res.json({ errorCode: 15, errorMsg: 'invalid inquiry id' });
                let _user = await userRepository.findOne(req.decodedUser.id)
                if(_user == undefined)
                    return res.json({ errorCode: 15, errorMsg: 'invalid your id' });
                _comment = new Comment();
                _comment.create_date = _comment.update_date = Math.floor(Date.now() / 1000);
                _comment.inquiry = _inquiry;
                _comment.user = _user;
                //댓글 알림
                if (_inquiry.notice_comment == Trigger.ON) {
                    let _notice = new Notice();
                    _notice.create_date = Math.floor(Date.now() / 1000);
                    _notice.update_date = Math.floor(Date.now() / 1000);
                    _notice.user = _user;
                    _notice.inquiry = _inquiry;
                    _notice.type = 16;
                    let _notice_ret = await getConnection().manager.save(_notice);       

                    insertNoticeUser(_inquiry.user, _notice_ret);

                    let _template_code: "admin_a13" | "client_a04" | "requestor_a03" | "tc_a06" | "translator_a06" | "reviewer_a06" = "admin_a13"
                    if (_inquiry.user.user_type == 1)
                        _template_code = 'admin_a13';
                    else if (_inquiry.user.user_type == 2)
                        _template_code = 'client_a04';
                    else if (_inquiry.user.user_type == 3)
                        _template_code = 'requestor_a03';
                    else if (_inquiry.user.user_type == 4)
                        _template_code = 'tc_a06';
                    else if (_inquiry.user.user_type == 5)
                        _template_code = 'translator_a06';
                    else if (_inquiry.user.user_type == 6)
                        _template_code = 'reviewer_a06';
                    else if (_inquiry.user.user_type == 7) 
                        _template_code = 'client_a04';
                    
                    webPush([_inquiry.user.player_id], _inquiry.user.system_lang, convertTranslateMsg(lang[_inquiry.user.system_lang]["web_push"][_template_code], { title: _inquiry.title }))
                    if (_inquiry.user.is_sms_notice_on == Trigger.ON) {
                        if (_inquiry.user.country_code == '+82' && _inquiry.user.system_lang == 'KO') {
                            let template_obj: { [k: string]: any } = {};   
                            template_obj.title = _inquiry.title
                            sendTalk(parseInt(_inquiry.user.country_code.substring(1, _inquiry.user.country_code.length)), _inquiry.user.phone_number, _inquiry.user.system_lang, _template_code, template_obj)    
                        }
                        else if (_inquiry.user.country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = '';
                            msg = convertTranslateMsg(lang[_inquiry.user.system_lang]["sms"][_template_code], {
                                title: _inquiry.title
                            });
                            sendSms(parseInt(_inquiry.user.country_code.substring(1, _inquiry.user.country_code.length)), _inquiry.user.phone_number, _inquiry.user.system_lang, msg)
                        }
                    }
                    if (_inquiry.user.is_email_notice_on == Trigger.ON) {
                        let template_obj: { [k: string]: any } = {};
                        template_obj.title = _inquiry.title;
                        template_obj.site_url = config.SITE_URL;
                        template_obj.username = _inquiry.user.user_name;
                        template_obj.userid = _inquiry.user.login_id;       
                        sendEmail(_inquiry.user.user_email, _inquiry.user.system_lang, lang[_inquiry.user.system_lang]['email'][_template_code], _template_code, template_obj)       
                    }
                }
            }
            else {
                _comment = await getRepository(Comment)
                .createQueryBuilder("comment")
                .leftJoinAndSelect("comment.user", "user")
                .leftJoinAndSelect("comment.inquiry", "inquiry")
                .where('"comment"."id" = :id', { id: req.body.id })
                .getOne();
                if(_comment == undefined)
                    return res.json({ errorCode: 15, errorMsg: 'invalid comment id' });
                if( !(_comment.inquiry.id == inquiry_id && _comment.user.id == req.decodedUser.id))
                    return res.json({ errorCode: 401, errorMsg: 'You do not have permission.' });
                _comment.update_date = Math.floor(Date.now() / 1000);
            }
            _comment.comment = comment;
            let _result = await getConnection().manager.save(_comment);
            let data: {[k: string]: any} = {};
            data = {
                id: _result.id,
                reg_date: _result.create_date
            };
            if(_result.create_date != _result.update_date)
                data.update_date = _result.update_date
            return res.json({errorCode: 0 , errorMsg: "", data: data});
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
    static detail = async(req: Request, res: Response) => {
        const { id } = req.body;
        if(isEmpty(id))
            return res.json({ errorCode: 400, errorMsg: 'Invalid Parameter' });
        const inquiryRepository = getRepository(Inquiry);
        try {
            let query = getRepository(Inquiry)
                .createQueryBuilder('inquiry')
                .leftJoinAndSelect("inquiry.user", "user")
                .leftJoinAndSelect('inquiry.attaches', 'attaches')
                .leftJoinAndSelect('inquiry.comments', 'comments')
                .leftJoinAndSelect('comments.user', 'comment_user')
                .where('"inquiry"."id" = :inquiry_id', { inquiry_id: id })
                .orderBy('"comments"."create_date"', 'ASC')
            let inquiry = await query.getOne()
            if(inquiry == undefined)
                return res.json({ errorCode: 15, errorMsg: 'invalid inquiry id' });
            /*
            if((global.WORK_TYPE.indexOf(req.decodedUser.user_type) >= 0 || global.ROLE[req.decodedUser.user_type - 1] == 'requester') && inquiry.user?.id != req.decodedUser.id && inquiry.type != 2)
                return res.json({ errorCode: 401, errorMsg: 'no permission to get information of this inquiry' });
            else if(global.ROLE[req.decodedUser.user_type - 1] == 'company' && (req.decodedUser.id != inquiry.user?.id) && (req.decodedUser.id != inquiry.user?.parent_id) && inquiry.type != 2)
                return res.json({ errorCode: 401, errorMsg: 'no permission to get information of this inquiry' });
            */
           let _parent_inquiry = await inquiryRepository.findOneOrFail(inquiry.parent_id)
            if (global.ROLE[req.decodedUser.user_type - 1] == 'admin') {
                //관리자인 경우
            }
            else if (inquiry.type == 2) {
                //공지사항인 경우
            }
            else if (global.WORK_TYPE.indexOf(req.decodedUser.user_type) >= 0) {
                //작업자인 경우
                if (_parent_inquiry.user.id != req.decodedUser.id) {
                    return res.json({ errorCode: 401, errorMsg: 'no permission to get information of this inquiry' });
                }
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'company') {
                //고객사인 경우
                if (_parent_inquiry.user.id != req.decodedUser.id && _parent_inquiry.user.parent_id != req.decodedUser.id) {
                    return res.json({ errorCode: 401, errorMsg: 'no permission to get information of this inquiry' });
                }
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'manager') {
                //담당자인 경우
                let query = getRepository(User)
                    .createQueryBuilder("user")   
                    .leftJoin('user.managers', 'manager', '"manager"."requesterId" = ' + _parent_inquiry.user.id)
                    .where('"user"."id" = ' + req.decodedUser.id)
                    .andWhere('"manager"."id" is not NULL')
                let _managers = await query.getMany();
                if (_managers.length < 1 && _parent_inquiry.user.id != req.decodedUser.id)
                    return res.json({ errorCode: 401, errorMsg: 'no permission to get information of this inquiry' });
            }
            else if (global.ROLE[req.decodedUser.user_type - 1] == 'requester') {
                //요청자인 경우
                if (_parent_inquiry.user.id != req.decodedUser.id) {
                    return res.json({ errorCode: 401, errorMsg: 'no permission to get information of this inquiry' });
                }
            }

            let data: {[k: string]: any} = {};
            data = {
                id: id,
                creator_id: inquiry.user?.id,
                title: inquiry.title,
                content: inquiry.content,
                notice_reply: inquiry.notice_reply,
                notice_comment: inquiry.notice_comment,
                creator_name: inquiry.user?.user_name,
                creator_user_id: inquiry.user?.login_id,
                creator_avatar: (inquiry.user?.avatar === null || inquiry.user?.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + inquiry.user?.avatar),
                type: inquiry.type
            }
            data.attaches = [];
            if(isArray(inquiry.attaches))
                for(let i = 0; i < inquiry.attaches.length; i ++) {
                    data.attaches.push({
                        id: inquiry.attaches[i].id,
                        file_name: inquiry.attaches[i].file_name,
                        file_link: config.INQUIRY_PREFIX_URL + inquiry.attaches[i].file,
                        file_size: inquiry.attaches[i].file_size
                    })
                }
            data.comments = [];
            if(isArray(inquiry.comments))
                for(let i = 0; i < inquiry.comments.length; i ++) {
                    let comment_detail: {[k: string]: any} = {};
                    comment_detail = {
                        user_id: inquiry.comments[i].user.login_id,
                        user_name: inquiry.comments[i].user.user_name,
                        reg_date: inquiry.comments[i].create_date,
                        comment: inquiry.comments[i].comment,
                        avatar: (inquiry.comments[i].user.avatar === null || inquiry.comments[i].user.avatar === '') ? '' : (config.IMAGE_PREFIX_URL + inquiry.comments[i].user.avatar),
                    }
                    if(inquiry.comments[i].user.id == req.decodedUser.id) {
                        comment_detail.can_modify = 'Y'
                        comment_detail.comment_id = inquiry.comments[i].id
                    }
                    else
                        comment_detail.can_modify = 'N'
                    if(inquiry.comments[i].create_date != inquiry.comments[i].update_date)
                        comment_detail.update_date = inquiry.comments[i].update_date
                    data.comments.push(comment_detail)
                }
            data.depth = (inquiry.code.length - inquiry.parent_id.toString().length) / 2;
            data.reg_date = inquiry.create_date;
            if(inquiry.create_date != inquiry.update_date)
                data.update_date = inquiry.update_date;
            
            return res.json({ errorCode: 0 , errorMsg: "", data: data});
        }
        catch(error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    };
    static registerInquiry = async(req: Request, res: Response) => {
        const {
            title,
            content,
            notice_reply,
            notice_comment
        } = req.body;
        try {
            const inquiryRepository = getRepository(Inquiry);
            const userRepository = getRepository(User);
            let parent_id = 0;
            let inquiry;
            //if api is create request
            if(isEmpty(req.body.id)) {
                inquiry = new Inquiry();
                inquiry.update_date = inquiry.create_date = Math.floor(Date.now() / 1000);
                inquiry.attaches = [];
            }
            //if api is update request
            else {
                inquiry = await inquiryRepository.findOneOrFail(req.body.id)
                inquiry.update_date = Math.floor(Date.now() / 1000);
            }
            inquiry.title = title;
            inquiry.content = content;
            inquiry.notice_reply = notice_reply;
            inquiry.notice_comment = notice_comment;
            if(isEmpty(req.body.type))
                inquiry.type = 1;
            else
                inquiry.type = req.body.type

            if(isEmpty(req.body.id) && isEmpty(req.body.parent_id)) {
                inquiry.parent_id = await getInquiryMaxId();
                inquiry.code = inquiry.parent_id.toString();
            }
            else if(isEmpty(req.body.id) && isNotEmpty(req.body.parent_id)) {
//                let parent_inquiry = await inquiryRepository.findOne(req.body.parent_id)
                let query = getRepository(Inquiry)
                    .createQueryBuilder("inquiry")
                    .leftJoinAndSelect("inquiry.user", "user")
                    .where("inquiry.id = :parent_id", {parent_id: req.body.parent_id});
                let parent_inquiry = await query.getOne();
                if(parent_inquiry == undefined) {
                    removeFile(req);
                    return res.json({ errorCode: 15, errorMsg: 'invalid parent inquiry id' });
                }
                if(parent_inquiry.type == 2) {
                    //공지사항
                    removeFile(req);
                    return res.json({ errorCode: 1, errorMsg: 'you can not make reply for notice' });
                }
                inquiry.parentUserId = parent_inquiry.user.id
                inquiry.parentCompanyId = parent_inquiry.user.parent_id
                inquiry.parent_id = parent_inquiry.parent_id;
                parent_id = parent_inquiry.parent_id;
                inquiry.depth = parent_inquiry.depth + 1;
                inquiry.code = parent_inquiry.code + (parent_inquiry.childs + 1).toString().padStart(2, '0');
                if(parent_inquiry.depth == 0)
                    parent_inquiry.childs += 1;
                await inquiryRepository.save(parent_inquiry);
            }
            let user = await userRepository.findOne(req.decodedUser.id)
            if(isEmpty(user) || user == undefined) {
                removeFile(req);
                return res.json({ errorCode: 15, errorMsg: 'invalid your id' });
            }
            if(isEmpty(req.body.id))
                inquiry.user = user;
            //update request  delete ids
            if(isArray(req.body.file_delete_ids) && req.body.file_delete_ids.length > 0) {
                for(let i = 0; i < req.body.file_delete_ids.length; i ++) {
                    let _attach = await getRepository(InquiryAttach)
                                    .createQueryBuilder("inquiry_attach")
                                    .leftJoinAndSelect("inquiry_attach.inquiry", "inquiry")
                                    .leftJoinAndSelect("inquiry.user", "user")
                                    .where('"inquiry_attach"."id" = :id', {id: req.body.file_delete_ids[i]})
                                    .getOne();
                    if(_attach == undefined)
                        continue;
                    if((_attach.inquiry.user.id != req.decodedUser.id) && global.ROLE[req.decodedUser.user_type - 1] != 'admin')
                        continue;
                    await getConnection()
                    .createQueryBuilder()
                    .delete()
                    .from(InquiryAttach)
                    .where('"inquiry_attach"."id" = :id', {id: req.body.file_delete_ids[i]})
                    .execute();
                }
            }
            if(req.files) {
                if(Array.isArray(req.files)) {
                    for( let i = 0; i < req.files.length; i ++ ) {
                        let inquiryAttach = new InquiryAttach();
                        inquiryAttach.create_date = Math.floor(Date.now() / 1000);
                        inquiryAttach.update_date = Math.floor(Date.now() / 1000);
                        inquiryAttach.file = req.files[i].filename;
                        inquiryAttach.file_name = req.files[i].originalname;
                        inquiryAttach.file_size = req.files[i].size;
                        await getConnection().manager.save(inquiryAttach);
                        inquiry.attaches.push(inquiryAttach);
                    }
                }
            }
            let _result = await inquiryRepository.save(inquiry);
            if(isEmpty(req.body.id) && isEmpty(req.body.parent_id)) {
                if(_result.id != _result.parent_id) {
                    parent_id = _result.id
                    _result.parent_id = _result.id
                    _result.code = _result.id.toString()
                    _result = await inquiryRepository.save(_result);
                }
                else
                    parent_id = _result.parent_id
            }
            if(isEmpty(req.body.id)) {
                await getConnection()
                    .createQueryBuilder()
                    .update(Inquiry)
                    .set({
                        inquiry_date: Math.floor(Date.now() / 1000)
                    })
                    .where("parent_id = :parent_id", {parent_id: parent_id})
                    .execute();
            }
            //답글 알림
            if (isEmpty(req.body.id) && isNotEmpty(req.body.parent_id)) {
                let inquiry_query = getRepository(Inquiry)
                    .createQueryBuilder("inquiry")
                    .leftJoinAndSelect("inquiry.user", 'user')
                    .where('"inquiry"."id" = ' + req.body.parent_id)
                let _parent_inquiry = await inquiry_query.getOne();
                if (_parent_inquiry != undefined && _parent_inquiry.notice_reply == Trigger.ON) {
                    let _notice = new Notice();
                    _notice.create_date = Math.floor(Date.now() / 1000);
                    _notice.update_date = Math.floor(Date.now() / 1000);
                    _notice.user = user;
                    _notice.inquiry = _result;
                    _notice.parent_inquiry = _parent_inquiry;
                    _notice.type = 15;
                    let _notice_ret = await getConnection().manager.save(_notice);
                    insertNoticeUser(_parent_inquiry.user, _notice_ret);
                    // let _template_code = '';
                    let _template_code: "admin_a12" | "client_a03" | "requestor_a02" | "tc_a05" | "translator_a05" | "reviewer_a05"  = "admin_a12"
                    if (_parent_inquiry.user.user_type == 1)
                        _template_code = 'admin_a12';
                    else if (_parent_inquiry.user.user_type == 2)
                        _template_code = 'client_a03';
                    else if (_parent_inquiry.user.user_type == 3)
                        _template_code = 'requestor_a02';
                    else if (_parent_inquiry.user.user_type == 4)
                        _template_code = 'tc_a05';
                    else if (_parent_inquiry.user.user_type == 5)
                        _template_code = 'translator_a05';
                    else if (_parent_inquiry.user.user_type == 6)
                        _template_code = 'reviewer_a05';
                    else if (_parent_inquiry.user.user_type == 7)
                        _template_code = 'client_a03';
                    //web push
                    webPush([_parent_inquiry.user.player_id], _parent_inquiry.user.system_lang, convertTranslateMsg(lang[_parent_inquiry.user.system_lang]["web_push"][_template_code], { title: _parent_inquiry.title }))
                    if (_parent_inquiry.user.is_sms_notice_on == Trigger.ON) {
                        if (_parent_inquiry.user.country_code == '+82' && _parent_inquiry.user.system_lang == 'KO') {
                            let template_obj: { [k: string]: any } = {};   
                            template_obj.title = _parent_inquiry.title
                            sendTalk(parseInt(_parent_inquiry.user.country_code.substring(1, _parent_inquiry.user.country_code.length)), _parent_inquiry.user.phone_number, _parent_inquiry.user.system_lang, _template_code, template_obj)
                        }
                        else if (_parent_inquiry.user.country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = '';
                            msg = convertTranslateMsg(lang[_parent_inquiry.user.system_lang]["sms"][_template_code], {
                                title: _parent_inquiry.title
                            });
                            sendSms(parseInt(_parent_inquiry.user.country_code.substring(1, _parent_inquiry.user.country_code.length)), _parent_inquiry.user.phone_number, _parent_inquiry.user.system_lang, msg)
                        }
                    }
                    if (_parent_inquiry.user.is_email_notice_on == Trigger.ON) {
                        let template_obj: { [k: string]: any } = {};
                        template_obj.title = _parent_inquiry.title;
                        template_obj.site_url = config.SITE_URL;
                        template_obj.username = _parent_inquiry.user.user_name;
                        template_obj.userid = _parent_inquiry.user.login_id;
                        sendEmail(_parent_inquiry.user.user_email, _parent_inquiry.user.system_lang, lang[_parent_inquiry.user.system_lang]['email'][_template_code], _template_code, template_obj)   
                    }
                }
            }
            //어드민 게시글 등록 알림
            if (isEmpty(req.body.id) && req.decodedUser.user_type != global.ROLE.indexOf("admin") + 1) {
                let _notice = new Notice();
                _notice.create_date = Math.floor(Date.now() / 1000);
                _notice.update_date = Math.floor(Date.now() / 1000);
                _notice.user = user;
                _notice.inquiry = _result;
                _notice.type = 14;
                let _notice_ret = await getConnection().manager.save(_notice);
                /**
                 * get admin list
                 */
                let admin_query = getRepository(User)
                .createQueryBuilder("user")
                .where('"user"."user_type" = 1');
                let _admins = await admin_query.getMany();
                for ( let i = 0; i < _admins.length; i++ ) {
                    insertNoticeUser(_admins[i], _notice_ret)
                }
                for (let i = 0; i < _admins.length; i++) {
                    //web push
                    webPush([_admins[i].player_id], _admins[i].system_lang, convertTranslateMsg(lang[_admins[i].system_lang]["web_push"]["admin_a11"], { title: title }))
                    
                    if (_admins[i].is_sms_notice_on == Trigger.ON) {
                        if (_admins[i].country_code == '+82' && _admins[i].system_lang == 'KO') {
                            let template_obj: { [k: string]: any } = {};
                            template_obj.title = title;
                            template_obj.site_url = config.SITE_URL;
                            sendTalk(parseInt(_admins[i].country_code.substring(1, _admins[i].country_code.length)), _admins[i].phone_number, _admins[i].system_lang, 'admin_a11', template_obj)
                        }
                        else if (_admins[i].country_code == '+81') {
                            //do nothing
                        }
                        else {
                            let msg = '';
                            msg = convertTranslateMsg(lang[_admins[i].system_lang]["sms"]["admin_a11"],
                            {
                                                title: title
                            });
                            sendSms(parseInt(_admins[i].country_code.substring(1, _admins[i].country_code.length)), _admins[i].phone_number, _admins[i].system_lang, msg)
                        }
                    }
                    if (_admins[i].is_email_notice_on == Trigger.ON) {
                        let template_obj: { [k: string]: any } = {};
                        template_obj.title = title;
                        template_obj.site_url = config.SITE_URL;
                        template_obj.username = user.user_name;
                        template_obj.userid = user.login_id;
                        template_obj.reg_date = Math.floor(Date.now() / 1000);
                        sendEmail(_admins[i].user_email, _admins[i].system_lang, lang[_admins[i].system_lang]['email']['admin_a11'], 'admin_a11', template_obj)   
                    }
                }
                //   
            }
            return res.json({
                "id": _result.id,
                "errorCode": 0,
                "errorMsg": ""
            })
        }
        catch(error) {
            console.log(error)
            removeFile(req);
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default InquiryController;