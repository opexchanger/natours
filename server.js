const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Oreião, pó falá na porta ${port}`);
});

//FUNÇÃO PRA CHAMAR NO CRASH DO SERVER
const shutdown = (err, message) => {
  console.log(err.name, err.message);
  console.log(message);
  server.close(() => {
    process.exit(1);
  });
};

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected successfully'))
  .catch((err) => {
    shutdown(err, 'DB Connection failed! Shutting down...');
  });

process.on('unhandledRejection', (err) => {
  shutdown(err, 'UNHANDLED REJECTION! Shutting down...');
});
