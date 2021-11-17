const express = require('express');
const router = express.Router();
const passport = require('passport');
const { isLoggedIn } = require('../lib/auth');
const LocalStrategy = require('passport-local').Strategy;
const helpers = require('../lib/helpers');
const moment = require('moment');
const LocalStorage = require('node-localstorage').LocalStorage,
    localStorage = new LocalStorage('./scratch');
const uuid = require('uuid').v4;
const cloudinary = require('cloudinary').v2;
const fs = require('fs-extra');



const pool = require('../database');

const formatterPeso = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
})


cloudinary.config({
    cloud_name: 'compugamer',
    api_key: '851294445867891',
    api_secret: 'JWMTFc_Vw8yCqORfHBdrHjWfsg4',

});


router.get('/addUser', isLoggedIn, (req, res)=>{
    res.render('users/addUser')
});

router.post('/addUser', async(req, res)=>{
    req.check('nombre', 'El nombre es requerido').notEmpty();
    req.check('apellido', 'El apellido es requqerido').notEmpty();
    req.check('cedula', 'La cedula es requerida').notEmpty();
    req.check('celular', 'El celular es requerido').notEmpty();
    req.check('fecha_registro', 'La fecha es requerida').notEmpty();
    req.check('membresia', 'La membresia es requerida').notEmpty();
    req.check('cantidad', 'La cantidad es requerida').notEmpty();
    const errors = req.validationErrors();
    if (errors.length > 0) {
        req.flash('message', errors[0].msg);
        res.redirect('/users/addUser');
    }
    const {nombre, apellido, cedula, celular, fecha_registro, membresia} = req.body;
    var fecha_fin = new Date(fecha_registro);
    var result = {};
    try{
        result = await cloudinary.uploader.upload(req.file.path);
        await fs.unlink(req.file.path);
     }catch(e){
        result.url = "";
        result.public_id = "";
     }

  if(membresia == 'Dia'){
        var dias = 2;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    } if(membresia == 'Semana'){
        var dias = 9;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    } if(membresia == '15dias'){
        var dias = 16;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    } if(membresia == 'Mes'){
        var dias = 31;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    }
    
    const newUser = {
        nombre,
        apellido,
        cedula,
        celular,
        fecha_registro,
        fecha_fin,
        image_url: result.url,
        public_id: result.public_id,
       };

    await pool.query('INSERT INTO users set ?', [newUser]);

    
    const {cantidad} = req.body;
    const newPago = {
        cedula,
        nombre,
        apellido,
        membresia,
        fecha_registro,
        cantidad
    }
    await pool.query('INSERT INTO pagos set ?', [newPago]);

    req.flash('success', 'Usuario guardado correctamente');
    res.redirect('listUsers');
});

router.get('/listUsers', isLoggedIn, async(req, res)=>{
    const users = await pool.query('SELECT * FROM users');
    
    for(var i= 0; i <users.length; i++){
        const fecha = users[i].fecha_registro;
        const fecha2 = users[i].fecha_fin;
        const fechaNueva = moment(fecha);
        const fechaFinal = moment(fecha2);
        users[i].fecha_registro = fechaNueva.format('DD/MM/YYYY');
        users[i].fecha_fin = fechaFinal.format('DD/MM/YYYY');
    }

    res.render('users/listUsers', {users});
});

router.get('/delete/:id', isLoggedIn, async(req, res)=>{ 
    const { id } = req.params;
    if(id == 88){
        req.flash('message', 'No se puede eliminar al creador web');
        res.redirect('/users/listUsers');
    }else{
    await pool.query('DELETE FROM users WHERE ID = ?', [id]);
    req.flash('success', 'Usuario eliminado');
    res.redirect('/users/listUsers');
    }
});

router.get('/deletePago/:id', async(req, res)=>{ 
    const { id } = req.params;
    await pool.query('DELETE FROM pagos WHERE ID = ?', [id]);
    req.flash('success', 'Pago eliminado');
    res.redirect('/users/ingresosDiarios');
});

router.get('/editUser/:id', isLoggedIn, async(req, res)=>{
    const {id} = req.params;
    const users = await pool.query('SELECT * FROM users WHERE ID = ?', [id]);
    res.render('users/editUser', {users: users[0]});
});

router.post('/editUsers/:id', async(req, res)=>{

    const {id} = req.params;
    const {nombre, apellido, cedula, celular} = req.body;
    

    await pool.query('UPDATE users SET nombre = ?, apellido = ? , cedula = ?, celular = ? WHERE id = ?', [nombre, apellido, cedula, celular, id]);
    req.flash('success', 'Información actualizada');
    res.redirect('/users/listUsers');
});

router.get('/editFoto/:id', isLoggedIn, async(req, res)=>{
    const {id} = req.params;
    const users = await pool.query('SELECT * FROM users WHERE ID = ?', [id]);
    res.render('users/editFoto', {users: users[0]});
});

router.post('/editFoto/:id', async(req, res)=>{
    const id = req.params.id;
     try {
          const row = await pool.query('SELECT public_id FROM users WHERE id = ?', [id]);
          await cloudinary.uploader.destroy(row[0].public_id);
     } catch (error) {

     }
     const result = await cloudinary.uploader.upload(req.file.path);
     const image_url = result.url;
     const public_id = result.public_id;
     await pool.query('UPDATE users SET image_url = ?, public_id = ? WHERE id = ?', [image_url, public_id, id]);
     req.flash('success', 'Se actualizo su foto de perfil correctamente');
     await fs.unlink(req.file.path);

     res.redirect('/users/listUsers');
})

router.get('/diasRestantes', isLoggedIn, (req, res)=>{
    res.render('users/diasRestantes');
});


router.post('/diasRestantes', async(req, res)=>{
    const {cedula} = req.body;
    
    const users = await pool.query('SELECT * FROM users WHERE cedula = ?', cedula);

    var fechaInicio = moment(users[0].fecha_fin);
    var fechaActual = moment();
    

    console.log(fechaActual);
    console.log(fechaInicio);

    const dias = fechaInicio.diff(fechaActual, 'd') +1;

    console.log(dias);
    
    res.render('users/dias', {users: users[0] , dias});

});

router.get('/ingresosDiarios', isLoggedIn, async(req, res)=>{
    var hoy = moment();
    hoy = hoy.format('YYYY/MM/DD');
    const pagos = await pool.query('SELECT * FROM pagos WHERE fecha_registro = ?', hoy);
    var ingresosDiarios=0;
    for(var i= 0; i <pagos.length; i++){
        
        const fecha = pagos[i].fecha_registro;
        const fechaNueva = moment(fecha);
        pagos[i].fecha_registro = fechaNueva.format('DD/MM/YYYY');
        ingresosDiarios += pagos[i].cantidad;
    }
    for (let clave in pagos) {
      
        if (pagos.hasOwnProperty(clave)) {

             pagos[clave].cantidad = formatterPeso.format(pagos[clave].cantidad);

        }
   }

   ingresosDiarios = formatterPeso.format(ingresosDiarios);
    res.render('users/ingresosDiarios', {pagos, ingresosDiarios});
});


router.get('/ingresosSemanales', isLoggedIn, async(req, res)=>{
    var hoy = moment();
    hoy = hoy.format('YYYY-MM-DD');
    var semana = moment().subtract(8, 'd');
    semana = semana.format('YYYY-MM-DD');
    
    const pagos = await pool.query('SELECT * FROM pagos WHERE fecha_registro  BETWEEN ? AND ? ', [semana, hoy]);
    var ingresosSemana=0;
        for(var i= 0; i <pagos.length; i++){
            const fecha = pagos[i].fecha_registro;
            const fechaNueva = moment(fecha);
            pagos[i].fecha_registro = fechaNueva.format('DD/MM/YYYY');
            ingresosSemana += pagos[i].cantidad;
        }

        for (let clave in pagos) {
      
            if (pagos.hasOwnProperty(clave)) {
    
                 pagos[clave].cantidad = formatterPeso.format(pagos[clave].cantidad);
    
            }
       }
       ingresosSemana = formatterPeso.format(ingresosSemana);

    res.render('users/ingresosSemanales', {pagos, ingresosSemana});
});

router.get('/usersActivos', isLoggedIn, async(req, res)=>{
    
    const usersActivos = [];
    const users = await pool.query('SELECT * FROM users ');
    var hoy = new Date();
    
    for(var j = 0; j <users.length; j++){
        if (hoy > users[j].fecha_fin){
            users.splice(j, 1);
        }
    }
    

    for(var i= 0; i <users.length ; i++){
        const fecha = users[i].fecha_registro;
        const fecha2 = users[i].fecha_fin;
        const fechaNueva = moment(fecha);
        const fechaFinal = moment(fecha2);
        users[i].fecha_registro = fechaNueva.format('DD/MM/YYYY');
        users[i].fecha_fin = fechaFinal.format('DD/MM/YYYY');
        
    }

   res.render('users/usersActivos', {users});
}); 

router.get('/renovarUser/:id', isLoggedIn, async(req, res)=>{
    const { id } = req.params;
    const user = await pool.query('SELECT * FROM users WHERE ID = ?', [id]);
    console.log(user)
    res.render('users/renovarUser', {user: user[0]});
});

router.post('/renovarUser/:id', async(req, res)=>{
    const {id} = req.params;
    const {nombre, apellido, cedula, celular, fecha_registro, membresia} = req.body;

    var fecha_fin = new Date(fecha_registro);
    
   if(membresia == 'Dia'){
        var dias = 2;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    } if(membresia == 'Semana'){
        var dias = 9;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    } if(membresia == '15dias'){
        var dias = 16;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    } if(membresia == 'Mes'){
        var dias = 31;
        fecha_fin.setDate(fecha_fin.getDate() + dias);
    }

    
    await pool.query(
        'UPDATE users SET nombre =?, apellido =?, cedula =?, celular=?, fecha_registro =?, fecha_fin =? WHERE ID = ?',
         [nombre, apellido, cedula, celular, fecha_registro, fecha_fin, id]);

    const {cantidad} = req.body;
    const newPago = {
        cedula,
        nombre,
        apellido,
        membresia,
        fecha_registro,
        cantidad
    }
    await pool.query('INSERT INTO pagos set ?', [newPago]);

    req.flash('success', 'Membresia renovada');
    res.redirect('/users/listUsers');
});







 
module.exports = router;