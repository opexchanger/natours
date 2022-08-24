const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  //DEFINE the email options
  const mailOptions = {
    from: 'Flávinho 69 The Badass <flavioneto96@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //SEND the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
