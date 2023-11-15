import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Period {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column({ nullable: true, default: 0 })
    year: number;

    @Column({ nullable: true, default: 0 })
    month: number;
}