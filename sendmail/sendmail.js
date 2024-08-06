const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5505;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const mongoURI = "mongodb://localhost:27017";

mongoose.connect(mongoURI );

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error(`Failed to connect to MongoDB: ${err.message}`);
});

// Email scheduling schema
const scheduleSchema = new mongoose.Schema({
  email: String,
  subject: String,
  body: String,
  frequency: String, // daily, weekly, monthly
  dayOfWeek: String, // for weekly
  dayOfMonth: Number, // for monthly
  time: String, // "HH:MM"
});

const Schedule = mongoose.model("Schedule", scheduleSchema);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'visrutlukhi@gmail.com',
    pass: 'zmmwlzwncgltrvvg',
  }
});

const sendMail = async (mailOptions) => {
    console.log("SendMail" , mailOptions);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// Schedule email sending based on frequency
const scheduleEmail = (schedule) => {
  let cronTime;
  console.log("Schdeule Email");

//   switch (schedule.frequency) {
//     case 'daily':
//       cronTime = `0 ${schedule.time.split(':')[1]} ${schedule.time.split(':')[0]} * * *`;
//       break;
//     case 'weekly':
//       cronTime = `0 ${schedule.time.split(':')[1]} ${schedule.time.split(':')[0]} * * ${schedule.dayOfWeek}`;
//       break;
//     case 'monthly':
//       cronTime = `0 ${schedule.time.split(':')[1]} ${schedule.time.split(':')[0]} ${schedule.dayOfMonth} * *`;
//       break;
//     default:
//       throw new Error('Invalid frequency');
//   }

  cron.schedule('*/1 * * * *', () => {
    console.log("Cron");
    const mailOptions = {
      from: 'visrutlukhi@gmail.com',
      to: schedule.email,
      subject: schedule.subject,
      text: schedule.body,
    //   attechments:[
    //     {
    //         filename:"test.pdf",
    //         path:path.join(__dirname,"test.pdf"),
    //         contenttype:'application/pdf'
    //     },
    //     {
    //         filename:"sample.jpg",
    //         path:path.join(__dirname,"sample.jpg"),
    //         contenttype:'image/jpg'
    //     }
    //   ]
    };
    sendMail(mailOptions);
  });
};

app.post("/schedule-email", async (req, res) => {

  const { email, subject, body, frequency,dayOfWeek,dayOfMonth,time} = req.body;

  try {
    const newSchedule = new Schedule({ email, subject, body,frequency,dayOfWeek,dayOfMonth,time});
    await newSchedule.save();
    
    scheduleEmail(newSchedule);

    res.status(201).send(newSchedule);
  } catch (error) {
    res.status(500).send("Error scheduling email");
  }
});

const start = () => {
  try {
    app.listen(PORT, () => {
      console.log(`${PORT} is live here`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
