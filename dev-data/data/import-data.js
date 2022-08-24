const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connected successfully'));

//CARREGAR DADOS DO JSON
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`));

//DELETAR TOURS
const deleteFunc = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted succesfully');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//IMPORTAR TOURS
const importFunc = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data imported succesfully');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

//AGE DE ACORDO COM A OPÇÃO ESCOLHIDA
if (process.argv[2] === '--import') {
  importFunc();
} else if (process.argv[2] === '--delete') {
  deleteFunc();
}
