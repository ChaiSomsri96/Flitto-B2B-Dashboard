import "reflect-metadata";
import { createConnection } from "typeorm";
import express from "express";
import bodyParser from "body-parser";

import cors from "cors";
import routes from "./routes";
import { User } from "./entity/user";

// var upload = multer();
declare global {
  namespace Express {
    interface Request {
      decodedUser: User,
      fileValidationError: String,
      avatar: any
    }
  }
}

//Connects to the Database -> then starts the express
createConnection()
  .then(async () => {
    // Create a new express application instance
    const app = express();
    // Call midlewares
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));
    // process.setMaxListeners(15);
    // app.use(upload.any());
    //Set all routes from routes folder
    app.use("/", routes);
    app.listen(3001, () => {
      console.log("Server started on port 3001!");
    });
  })
  .catch(error => console.log(error));