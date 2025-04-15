const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const ustvariToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

exports.registracija = async (req, res) => {
  try {
    const { ime, priimek, email, geslo } = req.body;
    const obstoječUporabnik = await User.findOne({ email });

    if (obstoječUporabnik) {
      return res
        .status(400)
        .json({ status: "error", message: "E-mail že obstaja" });
    }

    const novUporabnik = new User({ ime, priimek, email, geslo });
    await novUporabnik.save();

    res
      .status(201)
      .json({ status: "success", token: ustvariToken(novUporabnik) });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.prijava = async (req, res) => {
  try {
    const { email, geslo } = req.body;
    const uporabnik = await User.findOne({ email });

    if (!uporabnik || !(await uporabnik.preveriGeslo(geslo))) {
      return res.status(401).json({
        status: "error",
        message: "Napačen e-mail ali geslo",
      });
    }

    res.json({ status: "success", token: ustvariToken(uporabnik) });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
