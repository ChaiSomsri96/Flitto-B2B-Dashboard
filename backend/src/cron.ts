import "reflect-metadata";
import { createConnection } from "typeorm";
import { loop } from './helpers/cron-util'

createConnection()
.then(async() => {
    console.log('postgre connected successfully.')
    loop();
    setInterval(loop, 60000)
})
.catch(error => console.log(error));

