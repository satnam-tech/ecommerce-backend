import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import { User } from "./models/user.model.js";

//routes declaration
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

const users = [
  {
    fullName: "Rahul Sharma",
    phone: 9781758230,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Amit Verma",
    phone: 9876500002,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Sneha Kapoor",
    phone: 9876500003,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Priya Singh",
    phone: 9876500004,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Arjun Mehta",
    phone: 9876500005,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Vikram Joshi",
    phone: 9876500006,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Karan Malhotra",
    phone: 9876500007,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Neha Gupta",
    phone: 9876500008,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Rohit Agarwal",
    phone: 9876500009,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
  {
    fullName: "Pooja Choudhary",
    phone: 9876500010,
    role: "CUSTOMER",
    isVerified: false,
    lastOtpSent: new Date(),
    password: "Password@123",
  },
];

app.post("/dummy-data", async (req, res) => {
  const data = await User.insertMany(users);

  res.status(201).json({ message: "Dummy Data Added", data: data });
});


// Error Handling Middleware
app.use((err, req, res, next) => {
  // console.error("ERROR: ", err);
  // console.error("STATUS CODE: ", err.statusCode);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

export { app };
