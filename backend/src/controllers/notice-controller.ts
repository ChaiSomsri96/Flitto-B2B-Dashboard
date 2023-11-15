import { Request, Response } from 'express';
import { getConnection, getRepository } from 'typeorm';
import { NoticeUser } from './../entity/notice-user';
import { isArray } from 'class-validator';
import { getDateString } from './../helpers/utils';
import global from './../config/global';
import { Trigger } from './../entity/entity-enum';
class NoticeController {
    static getNoticeCount = async (req: Request, res: Response) => {
        try {
            let query = getRepository(NoticeUser)
                .createQueryBuilder("notice_user")
                .where('"notice_user"."userId" = ' + req.decodedUser.id)
                .andWhere('"notice_user"."is_read" = \'N\'')
            let unread_count = await query.getCount()
            return res.json({
                errorCode: 0, errorMsg: "", data: unread_count
            })
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static updateNoticeUnRead = async (req: Request, res: Response) => {
        try {
            await getConnection()
                .createQueryBuilder()
                .update(NoticeUser)
                .set({
                    is_read: Trigger.ON
                })
                .where('"notice_user"."userId" = ' + req.decodedUser.id)
                .execute();
            return res.json({
                errorCode: 0, errorMsg: ''
            })
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
    static getNoticeList = async (req: Request, res: Response) => {
        try {
            let pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 29);
            let query = getRepository(NoticeUser)
                .createQueryBuilder("notice_user")
                .leftJoinAndSelect("notice_user.notice", "notice");
            if ((req.decodedUser.user_type == global.ROLE.indexOf("company") + 1)
                || (req.decodedUser.user_type == global.ROLE.indexOf("requester") + 1)
                || (req.decodedUser.user_type == global.ROLE.indexOf("manager") + 1)) {
                query = query.leftJoinAndSelect("notice.trans_request", "trans_request")
                    .leftJoinAndSelect("notice.user", "notice_object")
                    .leftJoinAndSelect("trans_request.user", "user")
                    .leftJoinAndSelect("trans_request.details", "request_detail")
                    .leftJoinAndSelect("trans_request.original_language", "original_language")
                    .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                    .leftJoinAndSelect("notice.inquiry", "inquiry")
                    .leftJoinAndSelect("notice.parent_inquiry", "parent_inquiry");
            }
            else if (req.decodedUser.user_type == global.ROLE.indexOf("tc") + 1) {
                query = query.leftJoinAndSelect("notice.trans_request", "trans_request")
                    .leftJoinAndSelect("trans_request.original_language", "original_language")
                    .leftJoinAndSelect("trans_request.tc_user", "tc_user")
                    .leftJoinAndSelect("notice.inquiry", "inquiry")
                    .leftJoinAndSelect("notice.parent_inquiry", "parent_inquiry")
                    .leftJoinAndSelect("notice.user", "notice_object");
            }
            else if (req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) {
                query = query.leftJoinAndSelect("notice.request", "request_detail")
                    .leftJoinAndSelect("request_detail.request", "trans_request")
                    .leftJoinAndSelect("trans_request.original_language", "original_language")
                    .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                    .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', { worker_type: req.decodedUser.user_type })
                    .leftJoinAndSelect("request_detail_worker.user", "worker_user")
                    .leftJoinAndSelect("notice.inquiry", "inquiry")
                    .leftJoinAndSelect("notice.parent_inquiry", "parent_inquiry")
                    .leftJoinAndSelect("notice.user", "notice_object");
            }
            else if (req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1) {
                query = query.leftJoinAndSelect("notice.request", "request_detail")
                    .leftJoinAndSelect("request_detail.request", "trans_request")
                    .leftJoinAndSelect("request_detail.translate_language", "translate_language")
                    .leftJoinAndSelect("request_detail.workers", "request_detail_worker", 'request_detail_worker.worker_type = :worker_type', { worker_type: req.decodedUser.user_type })
                    .leftJoinAndSelect("request_detail_worker.user", "worker_user")
                    .leftJoinAndSelect("notice.inquiry", "inquiry")
                    .leftJoinAndSelect("notice.parent_inquiry", "parent_inquiry")
                    .leftJoinAndSelect("notice.user", "notice_object");
            }
            else if (req.decodedUser.user_type == global.ROLE.indexOf("admin") + 1) {
                query = query.leftJoinAndSelect("notice.user", "notice_object")
                    .leftJoinAndSelect("notice_object.parent", "notice_parent")
                    .leftJoinAndSelect("notice.trans_request", "trans_request")
                    .leftJoinAndSelect("trans_request.details", "details")
                    .leftJoinAndSelect("trans_request.user", "request_user")
                    .leftJoinAndSelect("request_user.parent", "request_parent")
                    .leftJoinAndSelect("notice.request", "request_detail")
                    .leftJoinAndSelect("request_detail.request", "request")
                    .leftJoinAndSelect("trans_request.original_language", "original_language1")
                    .leftJoinAndSelect("details.translate_language", "translate_language1")
                    .leftJoinAndSelect("request_detail.translate_language", "translate_language2")
                    .leftJoinAndSelect("request.original_language", "original_language2")
                    .leftJoinAndSelect("notice.inquiry", "inquiry")
                    .leftJoinAndSelect("notice.parent_inquiry", "parent_inquiry");
            }
            query = query.where('"notice_user"."userId" = ' + req.decodedUser.id)
                .andWhere('to_timestamp("notice_user"."create_date") >= \'' + getDateString(pastDate) + '\'')
            if ((req.decodedUser.user_type == global.ROLE.indexOf("tc") + 1)
                || (req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1)
                || (req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1)) {
                query = query.andWhere('"notice"."type" != 2')
            }
            query = query.orderBy('"notice_user"."create_date"', 'DESC');
            let _notice_list = await query.getMany();
            let table_data: Array<any>;
            table_data = [];
            for (let i = 0; i < _notice_list.length; i++) {
                let _item = _notice_list[i]
                let table_item: { [k: string]: any } = {};
                if ((req.decodedUser.user_type == global.ROLE.indexOf("company") + 1)
                    || (req.decodedUser.user_type == global.ROLE.indexOf("requester") + 1)
                    || (req.decodedUser.user_type == global.ROLE.indexOf("manager") + 1)) {
                    if (_item.notice.type == 1 || _item.notice.type == 2) {
                        table_item = {
                            id: _item.notice.trans_request.details[0].id,
                            end_date: _item.create_date,
                            title: _item.notice.trans_request.title,
                            original_language: _item.notice.trans_request.original_language.name,
                            notice_category: 1
                        }

                        if (_item.notice.type == 1)
                            table_item.type = 'client_a01'
                        if (_item.notice.type == 2)
                            table_item.type = 'requestor_a01'

                        if ( (req.decodedUser.user_type == global.ROLE.indexOf("company") + 1) || (req.decodedUser.user_type == global.ROLE.indexOf("manager") + 1))
                            table_item.requester = _item.notice.trans_request.user.user_name
                        table_item.translate_language = []
                        if (isArray(_item.notice.trans_request.details)) {
                            for (let j = 0; j < _item.notice.trans_request.details.length; j++)
                                table_item.translate_language.push(_item.notice.trans_request.details[j].translate_language.name)
                        }
                    }
                    else if (_item.notice.type == 15 || _item.notice.type == 16) {
                        table_item = {
                            id: _item.notice.inquiry.id,
                            end_date: _item.create_date,
                            // title: _item.notice.inquiry.title,
                            title: (_item.notice.type == 15 ? _item.notice.parent_inquiry.title : _item.notice.inquiry.title),
                            username: (_item.notice.user.user_type == 2 ? _item.notice.user.company_name : _item.notice.user.user_name),
                            userid: _item.notice.user.login_id,
                            notice_category: 2
                        }

                        if (_item.notice.type == 15 && ((req.decodedUser.user_type == global.ROLE.indexOf("company") + 1) || (req.decodedUser.user_type == global.ROLE.indexOf("manager") + 1)))
                            table_item.type = 'client_a03'
                        else if (_item.notice.type == 16 && ((req.decodedUser.user_type == global.ROLE.indexOf("company") + 1) || (req.decodedUser.user_type == global.ROLE.indexOf("manager") + 1)))
                            table_item.type = 'client_a04'
                        else if (_item.notice.type == 15 && (req.decodedUser.user_type == global.ROLE.indexOf("requester") + 1))
                            table_item.type = 'requestor_a02'
                        else if (_item.notice.type == 16 && (req.decodedUser.user_type == global.ROLE.indexOf("requester") + 1))
                            table_item.type = 'requestor_a03'
                    }
                }
                else if (req.decodedUser.user_type == global.ROLE.indexOf("tc") + 1) {
                    if (_item.notice.type == 1 || _item.notice.type == 3 || _item.notice.type == 4 || _item.notice.type == 17) {
                        table_item = {
                            id: _item.notice.trans_request.id,
                            end_date: _item.create_date,
                            title: _item.notice.trans_request.title,
                            original_language: _item.notice.trans_request.original_language.name,
                            notice_category: 1
                        }
                        if (_item.notice.type == 1)
                            table_item.type = 'tc_a01'
                        else if (_item.notice.type == 3)
                            table_item.type = 'tc_a02'
                        else if (_item.notice.type == 4)
                            table_item.type = 'tc_a03'
                        else if (_item.notice.type == 17)
                            table_item.type = 'tc_a04'

                        table_item.other = false
                        if ((_item.notice.trans_request.status >= global.STATUS.indexOf("tc_ing") + 1) && _item.notice.trans_request.tc_user.id != req.decodedUser.id)
                            table_item.other = true
                    }
                    else if (_item.notice.type == 15 || _item.notice.type == 16) {
                        table_item = {
                            id: _item.notice.inquiry.id,
                            end_date: _item.create_date,
                            //title: _item.notice.inquiry.title,
                            //title: _item.notice.parent_inquiry.title,
                            title: (_item.notice.type == 15 ? _item.notice.parent_inquiry.title : _item.notice.inquiry.title),
                            username: _item.notice.user.user_name,
                            userid: _item.notice.user.login_id,
                            notice_category: 2
                        }
                        if (_item.notice.type == 15)
                            table_item.type = 'tc_a05'
                        else if (_item.notice.type == 16)
                            table_item.type = 'tc_a06'
                    }
                }
                else if (req.decodedUser.user_type == global.ROLE.indexOf("translator") + 1) {
                    if (_item.notice.type == 1 || _item.notice.type == 10 || _item.notice.type == 11 || _item.notice.type == 17) {
                        table_item = {
                            id: _item.notice.request.id,
                            end_date: _item.create_date,
                            title: _item.notice.request.request.title,
                            original_language: _item.notice.request.request.original_language.name,
                            translate_language: _item.notice.request.translate_language.name,
                            notice_category: 1
                        }

                        if (_item.notice.type == 1)
                            table_item.type = 'translator_a01'
                        else if (_item.notice.type == 10)
                            table_item.type = 'translator_a02'
                        else if (_item.notice.type == 11)
                            table_item.type = 'translator_a03'
                        else if (_item.notice.type == 17)
                            table_item.type = 'translator_a04'
                        
                        table_item.other = false
                        if (_item.notice.request.status >= global.STATUS.indexOf("translating") + 1 && isArray(_item.notice.request.workers) && _item.notice.request.workers.length > 0 && _item.notice.request.workers[0].user.id != req.decodedUser.id)
                            table_item.other = true
                    }
                    else if (_item.notice.type == 15 || _item.notice.type == 16) {
                        table_item = {
                            id: _item.notice.inquiry.id,
                            end_date: _item.create_date,
                            // title: _item.notice.inquiry.title,
                            // title: _item.notice.parent_inquiry.title,
                            title: (_item.notice.type == 15 ? _item.notice.parent_inquiry.title : _item.notice.inquiry.title),
                            username: _item.notice.user.user_name,
                            userid: _item.notice.user.login_id,
                            notice_category: 2
                        }
                        if (_item.notice.type == 15)
                            table_item.type = 'translator_a05'
                        else if (_item.notice.type == 16)
                            table_item.type = 'translator_a06'
                    }
                }
                else if (req.decodedUser.user_type == global.ROLE.indexOf("reviewer") + 1) {
                    if (_item.notice.type == 1 || _item.notice.type == 12 || _item.notice.type == 13 || _item.notice.type == 17) {
                        table_item = {
                            id: _item.notice.request.id,
                            end_date: _item.create_date,
                            title: _item.notice.request.request.title,
                            translate_language: _item.notice.request.translate_language.name,
                            notice_category: 1
                        }
                        
                        if (_item.notice.type == 1)
                            table_item.type = 'reviewer_a01'
                        else if (_item.notice.type == 12)
                            table_item.type = 'reviewer_a02'
                        else if (_item.notice.type == 13)
                            table_item.type = 'reviewer_a03'
                        else if (_item.notice.type == 17)
                            table_item.type = 'reviewer_a04'
                        
                        table_item.other = false
                        if (_item.notice.request.status >= global.STATUS.indexOf("reviewing") + 1 && isArray(_item.notice.request.workers) && _item.notice.request.workers.length > 0 && _item.notice.request.workers[0].user.id != req.decodedUser.id)
                            table_item.other = true
                    }
                    else if (_item.notice.type == 15 || _item.notice.type == 16) {
                        table_item = {
                            id: _item.notice.inquiry.id,
                            end_date: _item.create_date,
                            // title: _item.notice.inquiry.title,
                            // title: _item.notice.parent_inquiry.title,
                            title: (_item.notice.type == 15 ? _item.notice.parent_inquiry.title : _item.notice.inquiry.title),
                            username: _item.notice.user.user_name,
                            userid: _item.notice.user.login_id,
                            notice_category: 2
                        }
                        if (_item.notice.type == 15)
                            table_item.type = 'reviewer_a05'
                        else if (_item.notice.type == 16)
                            table_item.type = 'reviewer_a06'
                    }
                }
                else if (req.decodedUser.user_type == global.ROLE.indexOf("admin") + 1) {
                    table_item = {}
                    table_item.end_date = _item.create_date
                    if (_item.notice.type == 1 || _item.notice.type == 2 || _item.notice.type == 8 || _item.notice.type == 9) {
                        table_item.title = _item.notice.trans_request.title
                        if (isArray(_item.notice.trans_request.details))
                            table_item.id = _item.notice.trans_request.details[0].id
                        table_item.original_language = _item.notice.trans_request.original_language.name
                        table_item.translate_language = []
                        for (let k = 0; k < _item.notice.trans_request.details.length; k++)
                            table_item.translate_language.push(_item.notice.trans_request.details[k].translate_language.name)

                        table_item.companyname = _item.notice.trans_request.user.parent.company_name
                        table_item.username = _item.notice.trans_request.user.user_name
                        if (_item.notice.type == 1)
                            table_item.type = 'admin_a01'
                        else if (_item.notice.type == 2)
                            table_item.type = 'admin_a10'
                        else if (_item.notice.type == 8)
                            table_item.type = 'admin_a08'
                        else
                            table_item.type = 'admin_a09'
                        table_item.notice_category = 1
                    }
                    else if (_item.notice.type == 4 || _item.notice.type == 5) {
                        table_item.title = _item.notice.trans_request.title
                        if (isArray(_item.notice.trans_request.details) && _item.notice.trans_request.details.length > 0)
                            table_item.id = _item.notice.trans_request.details[0].id
                        table_item.original_language = _item.notice.trans_request.original_language.name
                        if (_item.notice.type == 4) {
                            table_item.username = _item.notice.user.user_name
                            table_item.type = 'admin_a03'
                        }
                        else {
                            table_item.type = 'admin_a02'
                            table_item.username = _item.notice.user.user_name
                            table_item.companyname = _item.notice.user.parent.company_name
                        }
                        table_item.notice_category = 1
                    }
                    else if (_item.notice.type == 6 || _item.notice.type == 11) {
                        table_item.id = _item.notice.request.id
                        table_item.title = _item.notice.request.request.title
                        table_item.original_language = _item.notice.request.request.original_language.name
                        table_item.translate_language = _item.notice.request.translate_language.name
                        if (_item.notice.type == 6) {
                            table_item.type = 'admin_a04'
                            table_item.username = _item.notice.user.user_name
                            table_item.companyname = _item.notice.user.parent.company_name
                        }
                        else {
                            table_item.type = 'admin_a05'
                            table_item.username = _item.notice.user.user_name
                        }
                        table_item.notice_category = 1
                    }
                    else if (_item.notice.type == 7 || _item.notice.type == 13) {
                        table_item.id = _item.notice.request.id
                        table_item.title = _item.notice.request.request.title
                        table_item.username = _item.notice.user.user_name
                        table_item.translate_language = _item.notice.request.translate_language.name
                        if (_item.notice.type == 7) {
                            table_item.type = 'admin_a06'
                            table_item.username = _item.notice.user.user_name
                            table_item.companyname = _item.notice.user.parent.company_name
                        }
                        else
                            table_item.type = 'admin_a07'
                        table_item.username = _item.notice.user.user_name
                        table_item.notice_category = 1
                    }
                    else if (_item.notice.type == 14 || _item.notice.type == 15 || _item.notice.type == 16) {
                        table_item.notice_category = 2
                        table_item.id = _item.notice.inquiry.id
                        // table_item.title = _item.notice.inquiry.title
                        if (_item.notice.type == 15)
                            table_item.title = _item.notice.parent_inquiry.title
                        else
                            table_item.title = _item.notice.inquiry.title
                        table_item.username = (_item.notice.user.user_type == 2 ? _item.notice.user.company_name : _item.notice.user.user_name)
                        table_item.userid = _item.notice.user.login_id
                        if (_item.notice.type == 14)
                            table_item.type = 'admin_a11'
                        else if (_item.notice.type == 15)
                            table_item.type = 'admin_a12'
                        else if (_item.notice.type == 16)
                            table_item.type = 'admin_a13'
                    }
                }
                if (table_data.length < 1) {
                    table_data.push({
                        base_date: table_item.end_date,
                        details: [table_item]
                    });
                }
                else {
                    if (getDateString(new Date(table_item.end_date * 1000)) == getDateString(new Date(table_data[table_data.length - 1].base_date * 1000)))
                        table_data[table_data.length - 1].details.push(table_item)
                    else
                        table_data.push({
                            base_date: table_item.end_date,
                            details: [table_item]
                        });
                }
            }

            return res.json({
                errorCode: 0, errorMsg: "", data: table_data
            })
        }
        catch (error) {
            console.log(error)
            return res.json({ errorCode: 500, errorMsg: "Internal Server Error" });
        }
    }
}
export default NoticeController;