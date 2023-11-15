import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class AnalysisDate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true, type: "date" })
    basic_date: Date;
}