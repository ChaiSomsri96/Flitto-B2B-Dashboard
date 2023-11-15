import { MigrationInterface, QueryRunner, getRepository } from "typeorm";
import { WorkingLanguage } from '../entity/working-language';

let languages = [
    '한국어',
    '영어',
    '일본어',
    '중국어간체',
    '중국어번체',
    '인도네시아어',
    '베트남어',
    '태국어',
    '스페인어'
]
let prefix = [ 'K', 'E', 'J', 'C', 'CT', 'I', 'V', 'T', 'S' ]

export class CreateWorkingLanguage1595043498095 implements MigrationInterface {

    public async up(_queryRunner: QueryRunner): Promise<void> {
        for(let i = 0; i < languages.length; i ++) {
            let working_language = new WorkingLanguage();
            working_language.create_date = Math.floor(Date.now() / 1000);
            working_language.update_date = Math.floor(Date.now() / 1000);
            working_language.name = languages[i];
            working_language.order = i + 1;
            working_language.prefix = prefix[i]
            const workingLanguageRepository = getRepository(WorkingLanguage);
            await workingLanguageRepository.save(working_language);
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
    }

}
