import { WorkerAssignSetting } from './worker-assign-setting';
import { Entity, PrimaryGeneratedColumn, Column, /* OneToOne, JoinColumn,*/ ManyToOne } from 'typeorm';
import { Tag } from './tag';
// 작업할당 태그
@Entity()
export class WorkerAssignSettingTag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    //태그 아이디   N:N
    /* @OneToOne(_type => Tag)
    @JoinColumn()
    tag: Tag; */
    @ManyToOne(_type => Tag, tag => tag.worker_assign_setting_tags, {eager: true})
    tag: Tag;

    @ManyToOne(_type => WorkerAssignSetting, worker_assign_setting => worker_assign_setting.setting_tags)
    worker_assign_setting: WorkerAssignSetting;
}