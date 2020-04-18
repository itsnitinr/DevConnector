const express = require("express");
const router = express.Router();
const {check, validationResult} = require("express-validator");
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const Profile = require("../../models/Profile");
const Post = require("../../models/Post");

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post("/", [auth, [
    check("text", "Text is required").not().isEmpty()
 ]], 
 async (req, res) => {
    
    // Checking for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        
        // Get name and avatar
        const user = await User.findById(req.user.id).select("-password");
        
        // Post object
        const post = new Post ({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        await post.save();
        res.json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }

});

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get("/", auth, async (req, res) => {
    try {

        // Get all posts
        const posts = await Post.find().sort({date: -1});
        res.json(posts);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
    try {

        // Get post by ID
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({msg: "Post not found"});
        }
        res.json(post);

    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({msg: "Post not found"});
        }
        res.status(500).send("Server error");
    }
});

// @route   DELETE api/posts/:id
// @desc    Delete post by ID
// @access  Private
router.delete("/:id", auth, async (req, res) => {
    try {

        // Find the post to be deleted
        const post = await Post.findById(req.params.id);

        // Check if post exists
        if (!post) {
            return res.send(404).json({msg: "Post not found"});
        }

        // Check if post belongs to logged in user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({msg: "Unauthorized"});
        }

        await post.remove();
        res.json({msg: "Post removed"});

    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({msg: "Post not found"});
        }
        res.status(500).send("Server error");
    }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put("/like/:id", auth, async (req, res) => {
    try {
        
        // Get the post by ID
        const post = await Post.findById(req.params.id);

        // Check if the post has already been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({msg: "Post has already been liked"});
        }

        // Add user to likes array
        post.likes.unshift({user: req.user.id});
        await post.save();
        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put("/unlike/:id", auth, async (req, res) => {
    try {
        
        // Get the post by ID
        const post = await Post.findById(req.params.id);

        // Check if the post has been liked
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({msg: "Post has not yet been liked"});
        }

        // Remove from likes array
        const removeIndex = post.likes.map(like => like.user.toString().indexOf(req.user.id));
        post.likes.splice(removeIndex, 1);
        await post.save();
        res.json(post.likes);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   POST api/posts/comment/:id
// @desc    Post a comment
// @access  Private
router.post("/comment/:id", [auth, [
    check("text", "Text is required").not().isEmpty()
 ]], 
 async (req, res) => {
    
    // Checking for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    try {
        
        // Get name and avatar
        const user = await User.findById(req.user.id).select("-password");
        const post = await Post.findById(req.params.id);

        // Comment object
        const comment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        };

        post.comments.unshift(comment);
        await post.save();
        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }

});

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
    try {
        
        // Get post and comment
        const post = await Post.findById(req.params.id);
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // Check if comment exists
        if (!comment) {
            return res.status(404).json({msg: "Comment not found"});
        }

        // Check if user is the person who commented
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({msg: "Unauthorized"});
        }

        // Remove from comments array
        const removeIndex = post.comments.map(comment => comment.user.toString().indexOf(req.user.id));
        post.comments.splice(removeIndex, 1);
        await post.save();
        res.json(post.comments);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;