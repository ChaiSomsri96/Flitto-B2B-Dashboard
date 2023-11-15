import { Inquiry } from './inquiry';
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne} from 'typeorm';
@Entity()
export class InquiryAttach {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    create_date: number;

    @Column()
    update_date: number;

    @Column({ nullable: true })
    file: string;

    @Column({ nullable: true })
    file_name: string;

    @Column({ nullable: true })
    file_size: number;

    @ManyToOne(_type => Inquiry, inquiry => inquiry.attaches)
    inquiry: Inquiry;
}
