const bcrypt = require('bcryptjs');
const helpers = {};

// METODO PARA ENCRIPTAR CONTRASEÑA
helpers.encryptPassword = async (contraseña)=>{
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contraseña, salt);
    return hash;
};

// METODO PARA COMPARAR CONTRASEÑA EN EL LOGIN
helpers.matchPassword = async (contraseña, contraseñaGuardada)=>{
    
    console.log(contraseña);
    console.log(contraseñaGuardada);
    try{ 
        return await bcrypt.compare(contraseña, contraseñaGuardada);
        
    } catch(e){
        console.log(e);
        
    }
};

module.exports= helpers;

