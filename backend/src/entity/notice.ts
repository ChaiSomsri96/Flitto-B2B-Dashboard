import { RequestDetail } from './request-detail';
import { TransRequest } from './trans-request';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Trigger } from './entity-enum';
import { NoticeUser } from './notice-user';
import { Inquiry } from './inquiry';
@Entity()
export class Notice {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    create_date: number;

    @Column()
    update_date: number;
    
    @Column()
    type: number;   

    @ManyToOne(_type => User, user=>user.notices, {eager: true})
    user: User;

    @OneToMany(_type => NoticeUser, notice_user => notice_user.notice)
    notice_users: NoticeUser[];
    
    @ManyToOne(_type => RequestDetail, request=>request.notices)
    request: RequestDetail;

    @ManyToOne(_type => TransRequest, trans_request=>trans_request.notices)
    trans_request: TransRequest;   

    @ManyToOne(_type => Inquiry, inquiry=>inquiry.notices)
    inquiry: Inquiry;

    @ManyToOne(_type => Inquiry, inquiry => inquiry.parent_notices)
    parent_inquiry: Inquiry;
        
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_read: Trigger;
}