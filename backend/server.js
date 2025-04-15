require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // Add this line
const userRoutes = require("./routes/user.route");
const authRoutes = require("./routes/auth.route");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/", (req, res) => {
  res.json({ status: "success", message: "Dobrodošli v User CRUD API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Pot ne obstaja" });
});

app.listen(PORT, () => {
  console.log(`🚀 Strežnik teče na portu ${PORT}`);
});
