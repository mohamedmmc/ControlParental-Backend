import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.HOST_MAIL,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.USERGMAIL,
        pass: process.env.PASSGMAIL,
      },
    });

    await transporter.sendMail({
      from: process.env.USERGMAIL,
      to: email,
      subject: subject,
      text: text,
    });

    console.log("email sent sucessfully");
  } catch (error) {
    console.log(error, "email not sent");
  }
};

export default sendEmail;
