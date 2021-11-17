const express = require('express');
const router = express.Router();

const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const LocalStorage = require('node-localstorage').LocalStorage,
localStorage = new LocalStorage('./scratch');

// SIGNUP
router.get('/addAdmin',  (req, res) => {
  localStorage.clear();
  res.render('auth/addAdmin');
});

router.post('/addAdmin', passport.authenticate('local.signup', {
  successRedirect: 'users/listUsers',
  failureRedirect: '/addAdmin',
  failureFlash: true
}));

// SINGIN
router.get('/signin', (req,res)=>{
  res.render('auth/signin');
  
});
router.post('/signin',(req,res,next)=>{
  req.check('username', 'Username is Required').notEmpty();
  req.check('contraseña', 'Password is Required').notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash('message', errors[0].msg);
    res.redirect('/signin');
  }
  passport.authenticate('local.signin', {
    successRedirect: 'users/listUsers',
    failureRedirect: '/signin',
    failureFlash: true
  })(req,res,next)
  
});

router.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/signin');
});


module.exports = router;