import env from './config/env.js';
import app from './app.js';
import { connectMongo } from './config/mongo.js';

const startServer = async () => {
  await connectMongo();

  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
};

startServer();