import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { WorkType } from './entity-enum';

//고객사 한정 - 작업자 마감시간 설정
@Entity()
export class EndTimeSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //4: TC 5: 번역 6: 검수
    @Column({
        type: "enum",
        enum: WorkType,
        default: WorkType.TC
    })
    work_type: WorkType;

    //일반번역 48시간 번역 - 영상길이당 번역시간
    @Column({ nullable: true, default: 0 })
    general_trans_time: number;

    //일반번역 48시간 번역 - 마감 추가 시간
    @Column({ nullable: true, default: 0 })
    general_trans_add_time: number;

    //일반번역에서 초과번역시 영상길이당 번역 시간 (분당으로 계산됨)
    @Column({ nullable: true, default: 0 })
    general_excess_time: number;

    //일반번역에서 초과번역시 마감 추가 시간
    @Column({ nullable: true, default: 0 })
    general_excess_add_time: number;

    //긴급번역 영상길이 분당 번역시간
    @Column({ nullable: true, default: 0 })
    emergency_trans_time: number;

    //긴급번역 마감 추가 시간
    @Column({ nullable: true, default: 0 })
    emergency_add_time: number;

    @ManyToOne(_type => User, user => user.end_time_settings)
    user: User;
}
