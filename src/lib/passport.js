const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../database');
const helpers = require('./helpers');
const bcrypt = require('bcryptjs')

passport.use('local.signin', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'contraseña',
    passReqToCallback: true
  }, async (req, username, contraseña, done) => {
    const rows = await pool.query('SELECT * FROM administradores WHERE username = ?', [username]);
   
  if (rows.length > 0) {
    const user = rows[0];
    var validPassword = false;
    if(contraseña === user.contraseña){
      validPassword = true;
    }
    console.log(validPassword);
    if (validPassword) {
      done(null, user, req.flash('success', 'Bienvenido ' + user.nombre));
    } else {
      done(null, false, req.flash('message', 'Contraseña incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', 'El usuario no existe'));
  }
  }));


  passport.use('local.signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'contraseña',
    passReqToCallback: true
  }, async (req, username, contraseña, done) => {
  
    const { nombre, cedula, celular } = req.body;
    let newUser = {
      nombre,
      username,
      cedula,
      celular,
      contraseña
    };
    newUser.contraseña = await helpers.encryptPassword(contraseña);
    // Saving in the Database
    const result = await pool.query('INSERT INTO administradores SET ? ', newUser);
    newUser.id = result.insertId;
    return done(null, newUser);
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM administradores WHERE id = ?', [id]);
    done(null, rows[0]);
  });