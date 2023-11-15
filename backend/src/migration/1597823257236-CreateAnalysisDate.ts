import { AnalysisDate } from './../entity/analysis-date';
import {MigrationInterface, QueryRunner, getConnection} from "typeorm";
export class CreateAnalysisDate1597823257236 implements MigrationInterface {
    public async up(_queryRunner: QueryRunner): Promise<void> {
        var day = new Date(2020, 7, 1);
        for(let i = 0; i <= 3650; i ++) {
            var _basic_date = new Date(day);
            let _analysis_date = new AnalysisDate();
            _analysis_date.basic_date = _basic_date;
            await getConnection().manager.save(_analysis_date);
            day.setDate(_basic_date.getDate() + 1);
        }
    }
    public async down(_queryRunner: QueryRunner): Promise<void> {
    }
}
