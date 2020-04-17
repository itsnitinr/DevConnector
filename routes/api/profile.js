const express = require("express");
const router = express.Router();
const {check, validationResult} = require("express-validator");
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route   GET api/profile/me
// @desc    Get current user's profile
// @access  Private
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate("user", ["name", "avatar"]);
        if  (!profile) {
            return res.status(400).json({msg: "There is no profile for this user"});
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private

router.post("/", [auth, [
        check("status", "Status is required").not().isEmpty(),
        check("skills", "Skills is required").not().isEmpty()
    ]],
    async (req, res) => {

        // Check for errors
        const errors = validationResult(req);
        if  (!errors.isEmpty()) {
            res.status(400).json({errors: errors.array()});
        }

        // Destructuring
        const {
            company,
            website,
            location, 
            bio,
            status,
            githubUsername,
            skills,
            youtube,
            facebook,
            twitter,
            instagram,
            linkedin
        } = req.body;

        // Build profile
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (company) profileFields.company = company;
        if (status) profileFields.status = status;
        if (githubUsername) profileFields.githubUsername = githubUsername;
        if (skills) {
            profileFields.skills = skills.split(",").map(skill => skill.trim());
        }
        
        // Build social object
        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (facebook) profileFields.social.facebook = facebook;
        if (twitter) profileFields.social.twitter = twitter;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedin = linkedin;

        try  {
            
            let profile = await Profile.findOne({user: req.user.id});
            if (profile) {
                // Update if profile is found
                profile = await Profile.findOneAndUpdate({user: req.user.id}, {$set: profileFields}, {new: true});
                return res.json(profile);
            }
            //  Create if profile not found
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server error");
        }

    }
);

// @route   GET api/profile
// @desc    Get all user profiles
// @access  Public
router.get("/", async (req, res) => {
    try {
        
        // Send all profiles 
        const profiles = await Profile.find().populate("user", ["name", "avatar"]);
        res.json(profiles);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get user profile by ID
// @access  Public
router.get("/user/:user_id", async (req, res) => {
    try {
        
        // Get user profile if avaialable
        const profile = await Profile.findOne({user: req.params.user_id}).populate("user", ["name", "avatar"]);
        
        // Return error if profile not found
        if (!profile) {
            return res.status(400).json({msg: "Profile not found"});
        }

        // Return profile if available
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        if (err.kind == "ObjectId") {
            return res.status(400).json({msg: "Profile not found"});
        }
        res.status(500).send("Server error");
    }
});

module.exports = router;