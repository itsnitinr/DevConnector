const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../../models/User");

// @route   POST api/users
// @desc    Register an user
// @access  Public
router.post(
  "/",
  
  // Validation Array used express-validator
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please enter a valid email address").isEmail(),
    check("password", "Enter a password containing atleast 6 characters").isLength({ min: 6 }),
  ],
  async (req, res) => {
   
    const errors = validationResult(req);
    // Return 400 status code if any errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Extract user information from body
    const {name, email, password} = req.body;
    try {
        
        // If user already exists, return 400 status code
        let user = await User.findOne({email});
        if (user) {
            return res.status(400).json({errors: [{msg: "That user already exists"}]});
        }

        // Get avatar through gravatar
        const avatar = gravatar.url(email, {
            s: "200",
            r: "pg",
            d: "mm"
        });

        // Create an user 
        user = new User({
            name,
            email,
            password, 
            avatar
        });

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        
        // Save user to database
        await user.save()

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
