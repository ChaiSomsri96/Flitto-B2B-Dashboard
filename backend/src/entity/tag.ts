import { WorkerAssignSettingTag } from './worker-assign-setting-tag';
import { UserTag } from './user-tag';
import {Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column()
    name: string;

    @OneToMany(_type => UserTag, user_tag => user_tag.tag)
    user_tags: UserTag[];

    @OneToMany(_type => WorkerAssignSettingTag, worker_assign_setting_tag => worker_assign_setting_tag.tag)
    worker_assign_setting_tags: WorkerAssignSettingTag[];
}