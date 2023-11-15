import { Comment } from './comment';
import { InquiryAttach } from './inquiry-attach';
import { User } from './user';
import { Trigger } from './entity-enum';
import { Notice } from './notice';
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany} from 'typeorm';
@Entity()
export class Inquiry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column({ nullable: true })
    inquiry_date: number;

    @Column()
    title: string;

    @Column({ nullable: true, type: "text" })        
    content: string;

    @Column()
    type: number;

    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_delete: Trigger;

    @Column({ nullable: true })
    parent_id: number;

    @Column({ nullable: true, default: 0 })
    childs: number;

    @Column({ nullable: true, default: 0 })
    depth: number;

    @Column({ nullable: true, default: 0 })
    parentUserId: number;

    @Column({ nullable: true, default: 0 })
    parentCompanyId: number;

    @Column({ nullable: true })
    code: string

    @ManyToOne(_type => User, user=>user.inquiries, {eager: true})
    user: User;

    @OneToMany(_type => InquiryAttach, attach => attach.inquiry, {
        eager: true
    })
    attaches: InquiryAttach[];

    @OneToMany(_type => Comment, comment => comment.inquiry, {
        eager: true
    })
    comments: Comment[];

    @OneToMany(_type => Notice, notice => notice.inquiry)
    notices: Notice[];

    @OneToMany(_type => Notice, notice => notice.parent_inquiry)
    parent_notices: Notice[];

    // 답글알림
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    notice_reply: Trigger;
    // 댓글알림
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    notice_comment: Trigger;
}