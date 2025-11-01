// halloween.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('./middleware/authMiddleware');
const HalloweenGame = require('./models/question');
const User = require('./models/User');

// ===== Status =====
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const game = await HalloweenGame.findOne({ user_id: req.user._id });
        if (!game) return res.json({ played: false, level: 0, completed: false, rewardClaimed: false });
        res.json({
            played: game.level > 0,       // đã bắt đầu game
            level: game.level || 0,       // LV hiện tại
            completed: game.completed,    // đã hoàn thành sự kiện chưa
            rewardClaimed: game.rewardClaimed || false
        });
    } catch(e){
        console.error(e);
        res.status(500).json({error:'Server error'});
    }
});

// ===== Complete Level =====
router.post('/complete-level', authMiddleware, async (req, res) => {
    try {
        const { level } = req.body;
        if (level == null) return res.status(400).json({error:'Thiếu level'});
        
        let game = await HalloweenGame.findOne({ user_id: req.user._id });
        if (!game) game = await HalloweenGame.create({ user_id: req.user._id, level });
        else if(game.completed) return res.status(400).json({error:'Bạn đã hoàn thành sự kiện'});
        else game.level = level;

        if(level >=5) game.completed = true;

        await game.save();
        res.json({
            success: true,
            level: game.level,
            completed: game.completed,
            rewardClaimed: game.rewardClaimed || false
        });
    } catch(e){
        console.error(e);
        res.status(500).json({error:'Server error'});
    }
});

// ===== Reward =====
router.post('/reward', authMiddleware, async (req,res)=>{
    try{
        const game = await HalloweenGame.findOne({user_id:req.user._id});
        if(!game || !game.completed) return res.status(400).json({error:'Chưa hoàn thành sự kiện'});
        if(game.rewardClaimed) return res.status(400).json({error:'Bạn đã nhận thưởng rồi'});

        // Tính phần thưởng
        const rand=Math.random()*100;
        let amount=5000;
        if(rand<74.95) amount=5000;
        else if(rand<94.95) amount=10000;
        else if(rand<97.45) amount=20000;
        else if(rand<99.95) amount=30000;
        else amount=50000;

        const user = await User.findById(req.user._id);
        user.balance = (user.balance || 0) + amount;
        await user.save();

        game.rewardClaimed = true;
        await game.save();

        res.json({ success:true, amount });
    }catch(e){
        console.error(e);
        res.status(500).json({error:'Server error'});
    }
});

module.exports = router;
