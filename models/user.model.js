const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    ime: { type: String, required: true, trim: true, maxlength: 50 },
    priimek: { type: String, required: true, trim: true, maxlength: 50 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    geslo: { type: String, required: true, minlength: 6 },
    aktiven: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "users" }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("geslo")) return next();
  const salt = await bcrypt.genSalt(10);
  this.geslo = await bcrypt.hash(this.geslo, salt);
  next();
});

userSchema.methods.preveriGeslo = async function (vnesenoGeslo) {
  return await bcrypt.compare(vnesenoGeslo, this.geslo);
};

module.exports = mongoose.model("User", userSchema);
