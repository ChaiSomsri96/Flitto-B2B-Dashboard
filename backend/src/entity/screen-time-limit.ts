import { Entity, PrimaryGeneratedColumn, Column/*, OneToOne, JoinColumn*/ } from 'typeorm';

//고객사한정 적용 (영상길이 제한 설정 - 자막 번역)
@Entity()
export class ScreenTimeLimit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //일반번역(48시간) , 48시간 번역가능 영상길이 limit
    @Column({ nullable: true, default: 0 })
    general_screen_limit: number;

    //일반벅역에서 초과시 요청자에게 표시되는 번역완료 예상 일시는 계산되는 마감시간의 총합 + *** 분으로 산출됨
    @Column({ nullable: true, default: 0 })
    general_end_time: number;

    //24시간 번역가능 영상길이 _ 분 이하, 초과시 긴급번역 요청 불가
    @Column({ nullable: true, default: 0 })
    emergency_screen_limit: number;

    //무료 요청간으 영상길이 - 제한
    @Column({ nullable: true, default: 0 })
    free_screen_limit: number;
}