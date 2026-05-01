import Mailgen from "mailgen";
import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://taskmanagelink.com",
    },
  });

  const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: process.env.MAILTRAP_SMTP_PORT,
    auth: {
      user: process.env.MAILTRAP_SMTP_USER,
      pass: process.env.MAILTRAP_SMTP_PASS,
    },
  });

  console.log(process.env.MAILTRAP_SMTP_HOST);
console.log(process.env.MAILTRAP_SMTP_PORT);

  const mail = {
    from: "mail.taskmanager@example.com",
    to: options.email,
    subject: options.subject,
    text: emailTextual,
    html: emailHtml,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error("Email failed", error);
  }
};

const emailVerificationMailgenContent = (username, verificationurl) => {
  return {
    body: {
      name: username,
      intro: "Welcome! Please verify your email.",
      action: {
        instructions: "Click below:",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationurl,
        },
      },
    },
  };
};

const forgotPasswordMailgenContent = (username, passwordResultUrl) => {
  return {
    body: {
      name: username,
      intro: "Reset your password",
      action: {
        instructions: "Click below:",
        button: {
          color: "#22BC66",
          text: "Reset Password",
          link: passwordResultUrl,
        },
      },
    },
  };
};

export {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
};