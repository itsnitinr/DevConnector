const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const config = require("config");
const bcrypt = require("bcryptjs");
const auth = require("../../middleware/auth");
const User = require("../../models/User");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get("/", auth, async (req, res) => {
   try {
       const user = await User.findById(req.user.id).select("-password");
       res.json(user);
   } catch (err) {
       console.error(err.message);
       res.status(500).send("Server error");
   }
});

// @route   POST api/auth
// @desc    Logs in an user & gets token
// @access  Public
router.post(
  "/",
  
  // Validation Array used express-validator
  [
    check("email", "Please enter a valid email address").isEmail(),
    check("password", "Enter a password containing atleast 6 characters").exists(),
  ],
  async (req, res) => {
   
    const errors = validationResult(req);
    // Return 400 status code if any errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Extract user information from body
    const {email, password} = req.body;
    try {
        
        // If user doesn't exist, return 400 status code
        let user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({errors: [{msg: "Invalid Credentials"}]});
        }

        // Check if passwords match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({errors: [{msg: "Invalid Credentials"}]});
        }

        // JWT Token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            config.get("JWTSecret"),
            {expiresIn: 3600},
            (err, token) => {
                if (err) throw err;
                res.json({token})
            }
        );

    } catch (err) {
        console.log(err.message);
        res.status(500).send("Server error");
    }

  }
);

module.exports = router;