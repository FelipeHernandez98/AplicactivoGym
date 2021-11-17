const express = require('express');
const validator = require('express-validator');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySqlStore = require('express-mysql-session');
const { database }= require('../src/keys');
const passport = require('passport');
const multer = require('multer');
const uuid = require('uuid').v4;
const bodyParser = require('body-parser');

//Initializationes
const app = express();
require('./lib/passport');

//Settings
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars'),
}));
app.set('view engine', '.hbs');

//Middlewares
app.use(session({
    secret: 'HulGym',
    resave: false,
    saveUninitialized: false,
    store: new MySqlStore(database)
}))
app.use(flash());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());
const storage = multer.diskStorage({
    destination: path.join(__dirname,'public/uploads'),
    filename: (req,file,cb)=>{
        cb(null, uuid() + path.extname(file.originalname));
    }
});
app.use(multer({storage: storage}).single('image'));


//Global variables
app.use((req, res, next)=>{
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});


//Static files
app.use(express.static(path.join(__dirname, 'public')));


//Routes
app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use('/users', require('./routes/users'));

//Public
app.use(express.static(path.join(__dirname, 'public')));

//Starting the server
app.listen(app.get('port'), () => {

    console.log('Server on port', app.get('port'));

});


