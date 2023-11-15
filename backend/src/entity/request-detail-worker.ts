import { User } from './user';
import { RequestDetail } from './request-detail';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import {Trigger} from './entity-enum';
@Entity()
export class RequestDetailWorker {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @ManyToOne(_type => RequestDetail, request_detail => request_detail.workers)
    request_detail: RequestDetail;

    @Column({ nullable: true })
    worker_type: number;

    @Column({ nullable: true })
    end_date: number;

    //예정일시
    @Column({ nullable: true })
    predict_end_date: number;

    @Column({ nullable: true, default: 0, type: "float4" })
    price: number;

    //작업 완료
    @Column({
        type: "enum",
        enum: Trigger,
        default: Trigger.OFF
    })
    is_end: Trigger;

    //작업자 아이디
    @ManyToOne(_type => User, user => user.request_detail_workers , {eager: true})
    user: User;
}