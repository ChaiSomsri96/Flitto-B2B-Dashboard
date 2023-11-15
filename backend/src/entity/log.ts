import { RequestDetail } from './request-detail';
import { TransRequest } from './trans-request';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
@Entity()
export class Log {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //상태
    @Column()
    status: number;

    @ManyToOne(_type => User, user=>user.logs, {eager: true})
    user: User;

    @ManyToOne(_type => RequestDetail, request=>request.logs)
    request: RequestDetail;

    @ManyToOne(_type => TransRequest, trans_request=>trans_request.logs)
    trans_request: TransRequest;
}