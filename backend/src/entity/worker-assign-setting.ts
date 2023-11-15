import { User } from './user';
import { WorkerAssignSettingTag } from './worker-assign-setting-tag';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { WorkType } from './entity-enum';

//작업자 할당 설정
@Entity()
export class WorkerAssignSetting {
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
    worker_type: WorkType;

    //1: 푸시발송 , 2:  수동 할당
    @Column({ nullable: true })
    assign_type: number;

    //1: 일반 2: 태그 전체 선택
    @Column({ nullable: true, default: 1})
    tag_type: number;

    //태그
    @Column({ nullable: true })
    tags: string;

    //대상작업자 수
    @Column({ nullable: true })
    numbers: number;

    @ManyToOne(_type => User, user => user.assigns)
    user: User;

    @OneToMany(_type => WorkerAssignSettingTag, setting_tag => setting_tag.worker_assign_setting, {eager: true})
    setting_tags: WorkerAssignSettingTag[];
}