import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "woodrow1@ethereal.email",
    pass: "5dtHHUrGxZqFmWxXCd",
  },
});
const mail = {};
mail.sendResetPasswordOtp = (to, otp) => {
  return transporter.sendMail({
    from: "cellDoc24@gmail.com", // sender address
    to: `${to}`, // list of receivers
    subject: `Reset Password Otp`, // Subject line
    text: `Otp To confirm Your Email is:`, // plain text body
    html: `<div>
    <p>Otp Reset your password  is: </p>
                    <br/>
                    <br/>
                    ${otp}
                    <br/>
                    <br/>

        </div>`, // html body
  });
};

mail.sendSignUpOtp = (to, otp) => {
  return transporter.sendMail({
    from: "cellDoc24@gmail.com", // sender address
    to: `${to}`, // list of receivers
    subject: `Email Confirmation Otp`, // Subject line
    text: `Otp To confirm Your Email is:`, // plain text body
    html: `<div>
    <p>Otp To confirm Your Email is: </p>
                    <br/>
                    <br/>
                    ${otp}
                    <br/>
                    <br/>

        </div>`, // html body
  });
};

export default mail;
