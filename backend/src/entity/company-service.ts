import { DetailServiceType } from './entity-enum';
import { User } from './user';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
@Entity()
export class CompanyService {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column({
        type: "enum",
        enum: DetailServiceType,
        default: DetailServiceType.TC_WORK
    })
    detail_service_type: DetailServiceType;

    @ManyToOne(_type => User, user => user.services)
    user: User;
}