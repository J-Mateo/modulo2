import env from './config/env.js';
import app from './app.js';
import { connectMongo } from './config/mongo.js';

const startServer = async () => {
  await connectMongo();

  const PORT = process.env.PORT || env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();