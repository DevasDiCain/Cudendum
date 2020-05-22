//Entrada en la ejecución
const electron = require('electron');
const url = require('url');
const path = require('path');
const mysql = require('mysql')
const md5 = require('js-md5');


//Session Global Variables
const almacen = [];


//$.getScript("https://rezitech.github.com/stash/stash.min.js");//Sesiones

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: '',
  database: 'cudendum'
})
var jsdom = require('jsdom');
$ = require('jquery')(new jsdom.JSDOM().window)

const { app, BrowserWindow, Menu, ipcMain } = electron;

// SET ENV
//process.env.NODE_ENV = 'production';

let mainWindow;
let registerWindow;


//************************************************************************** */
//--------------------------EJECUCIÓN----------------------------------
//*************************************************************************** */

//Escuchar la app cuando esté lista
app.on('ready', function () {
  connection.connect(function (err) {
    if (err) {
      console.log(err.code)
      console.log(err.fatal)
    }
  })
  //----------------------------------Creación de las ventanas principales------------------------------------------------

  //creamos la ventana principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    icon: __dirname + '/cudendum.ico',
    webPreferences: { nodeIntegration: true },
    defaultEncoding: 'UTF-8',
  });

  //cargamos el html en la ventana

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/renderer/loginWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  //Aquí construimos el menú para plantillas
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

  //lo insertamos
  Menu.setApplicationMenu(mainMenu);


  /*--------------------------------------------------------------------------------------
  ----------------------EVENTOS-----------------------------------------------------------
  ------------------------------------------------------------------------------------------*/
  //Cuando se cierre la ventana principal se cierra la app entera
  mainWindow.on('closed', function () {
    connection.end(function () {
      //Aquí se cierra la conexión 
    })
    app.quit();

  });
  //Capturar click derecho para menú contextual
  mainWindow.webContents.on('context-menu', (e, args) => {
    mainMenu.popup(mainWindow);
  })
})

//************************************************************************** */
//--------------------------VENTANAS----------------------------------
//*************************************************************************** */
//Método que creará ventanas de registro
function createRegisterWindow() {
  //creamos la ventana De registro
  registerWindow = new BrowserWindow({
    width: 500,
    height: 800,
    resizable: false,
    frame: false,
    title: 'Registro',
    webPreferences: { nodeIntegration: true },
    defaultEncoding: 'UTF-8'

  });
  //cargamos el html en la ventana
  registerWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/renderer/registerWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  //Liberamos memoria cuaando se cierre el popup
  registerWindow.on('close', function () {
    registerWindow = null;

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
  })
}



//************************************************************************** */
//--------------------------ipcMain----------------------------------
//*************************************************************************** */


// Capturar evento de cierre de ventana de registro
ipcMain.on('closeRegisterWindow', function () {
  if (registerWindow != null)
    registerWindow.close();
})
//ERRORES
ipcMain.on('empty-field', function () {
  registerWindow.close();
  console.log("Error Registro con campos vacios");
})
ipcMain.on('empty-field-edit', function () {
  console.log("Error EDIT, campos vacíos");
})
//CAPTURA DE EVENTO DE REGISTRO
ipcMain.on('register', function (error, usuario, clave, nombre, apellidos, email, telefono) {
  get("usuarios", "usuario", usuario).then(function (rows) {//Antes de registrar compruebo que no existe una cuenta con el mismo usuario
    if (typeof rows == "undefined") {
      register(usuario, clave, nombre, apellidos, email, telefono).then(function () {//SE REGISTRA Y HASTA QUE NO SE LLEVE A CABO NO SE AVANZA
        registerWindow.close();
        login(usuario, clave).then(function (rows) {//UNA VEZ SE REGISTRE LOGUEAMOS Y SI TODO VA BIEN AVANZAMOS
          console.log(rows.length);
          if (rows.length >= 1) {
            let user = getSessionValue("usuario").then(function (resolve) { console.log("get Usuario->" + resolve) }).catch((err) => setImmediate(() => { console.log(err) }))
            let password = getSessionValue("clave").then(function (resolve) { console.log("get clave->" + resolve) }).catch((err) => setImmediate(() => { console.log(err) }))
            let time = getSessionValue("tiempo").then(function (resolve) { console.log("get tiempo->" + resolve) }).catch((err) => setImmediate(() => { console.log(err) }))
            if (typeof user != "undefined" && typeof password != "undefined" && typeof time != "undefined") {
              //Se carga la vista normal
              mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'src/renderer/views/normal_view.html'),
                protocol: 'file:',
                slashes: true
              }));
              //necesario para acceder al dom una vez EXISTA
              mainWindow.webContents.once('did-navigate', () => {
                mainWindow.webContents.once('dom-ready', () => {
                  mainWindow.webContents.executeJavaScript("console.log(document.getElementById('mostrarUsuario').innerHTML='" + usuario + "')")
                })
              })
            }
            else {
              console.log("Fallo en la sesión");//Aquí generar popUp de error
            }
          }
          else {
            console.log("Fallo en el loggin");//Aquí generar popUp de error
          }
        }).catch((err) => setImmediate(() => { console.log(err); }));
      }).catch((err) => setImmediate(() => { console.log(err); }));//Aquí recojo el error pero sino lo lanzo
    }
    else {
      console.log("ERROR- El usuario '" + usuario + "' ya se encuentra en la base de datos");
    }
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
//Ir al registro
ipcMain.on('go-register', function () {
  createRegisterWindow();
  Menu.setApplicationMenu(registerMenu);
})
//LOGUEAR
ipcMain.on('login', function (event, usuario, clave) {
  if (usuario.includes("'") || usuario.includes("<") || usuario.includes(">") || usuario.includes("*"))//Control de inyeccion SQL
  {
    console.log("Pillado tratando de hacer inyección SQL");//Aquí generar popUp de error
  }
  else {
    login(usuario, clave).then(function (rows) {
      if (rows.length >= 1) {
        let user = getSessionValue("usuario").then(function (resolve) { console.log("get Usuario->" + resolve) }).catch((err) => setImmediate(() => { console.log(err) }))
        let password = getSessionValue("clave").then(function (resolve) { console.log("get clave->" + resolve) }).catch((err) => setImmediate(() => { console.log(err) }))
        let time = getSessionValue("tiempo").then(function (resolve) { console.log("get tiempo->" + resolve) }).catch((err) => setImmediate(() => { console.log(err) }))
        let tipo = getSessionValue("tipo").then(function (resolve) {
          if (typeof user != "undefined" && typeof password != "undefined" && typeof time != "undefined") {
            if (resolve == "normal") {
              //Se carga la vista normal
              mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'src/renderer/views/normal_view.html'),
                protocol: 'file:',
                slashes: true
              }));
              //necesario para acceder al dom una vez EXISTA
              mainWindow.webContents.once('did-navigate', () => {
                mainWindow.webContents.once('dom-ready', () => {
                  mainWindow.webContents.executeJavaScript("console.log(document.getElementById('mostrarUsuario').innerHTML='" + usuario + "')")
                })
              })
            }
            if (resolve == "admin") {
              //Se carga la vista admin
              mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'src/renderer/views/admin_view.html'),
                protocol: 'file:',
                slashes: true
              }));
              //necesario para acceder al dom una vez EXISTA
              mainWindow.webContents.once('did-navigate', () => {
                mainWindow.webContents.once('dom-ready', () => {
                  mainWindow.webContents.executeJavaScript("console.log(document.getElementById('mostrarUsuario').innerHTML='" + usuario + "')")
                })
              })
            }
            if (resolve == "cliente") {
              //Se carga la vista cliente
              mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'src/renderer/views/guess_view.html'),
                protocol: 'file:',
                slashes: true
              }));
              //necesario para acceder al dom una vez EXISTA
              mainWindow.webContents.once('did-navigate', () => {
                mainWindow.webContents.once('dom-ready', () => {
                  mainWindow.webContents.executeJavaScript("console.log(document.getElementById('mostrarUsuario').innerHTML='" + usuario + "')")
                })
              })
            }

          }
          else {
            console.log("Fallo en la sesión");//Aquí generar popUp de error
          }
        }).catch((err) => setImmediate(() => { console.log(err) }))

           //Se carga la vista de carga
              mainWindow.loadURL(url.format({
                pathname: path.join(__dirname, 'src/renderer/views/chargeLogin_view.html'),
                protocol: 'file:',
                slashes: true
              }));
      }
      else {
        event.reply("errorLogin");
        console.log("Fallo en el loggin");//Aquí generar popUp de error
      }
    }).catch((err) => setImmediate(() => { console.log(err); }));//Aquí recojo el error pero sino lo lanzo
  }
})
//CERRAR SESIÓN
ipcMain.on("sesion-off", function () {
  setSessionValue("usuario", "undefined");
  setSessionValue("clave", "undefined");
  setSessionValue("tiempo", "undefined");
  let user, password, time;
  getSessionValue("usuario").then(function (resolve) { user = resolve }).catch((err) => setImmediate(() => { console.log(err) }))
  getSessionValue("clave").then(function (resolve) { password = resolve }).catch((err) => setImmediate(() => { console.log(err) }))
  getSessionValue("tiempo").then(function (resolve) { time = resolve }).catch((err) => setImmediate(() => { console.log(err) }))

  if (typeof user != "undefined" && typeof password != "undefined" && typeof time != "undefined") {
    console.log("ERROR AL DESTRUIR LAS SESIONES");
  }
  else {
    console.log("bien");
    //Se carga la vista normal
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'src/renderer/loginWindow.html'),
      protocol: 'file:',
      slashes: true
    }));
  }
});
//IR AL PERFIL
ipcMain.on("goToProfile", function (event, user) {
  get("usuarios", "usuario", user).then(function (rows) {//Obtengo los datos 
    event.reply('showProfile', rows)//Los mando al renderer
  }).catch((err) => setImmediate(() => { console.log(err) }))

});
//MOSTRAR EDICIÓN DE PERFIL
ipcMain.on("showEditProfile", function (event, user) {
  get("usuarios", "usuario", user).then(function (rows) {//Obtengo los datos 
    event.reply('showEditProfile', rows)//Los mando al renderer
  }).catch((err) => setImmediate(() => { console.log(err) }))
})

//MODIFICAR EL PERFIL
ipcMain.on("editProfile", function (event, usuario, clave, nombre, apellido, email, telefono,id_usuario) {
  get("usuarios", "id_usuario", id_usuario).then(function (rows) {//Obtengo los datos 
    let query = "";
    if (clave == "") {
      let oldPassword = rows["clave"];
      query = "UPDATE usuarios SET usuario='" + usuario + "',clave='" + oldPassword + "',nombre='" + nombre + "',apellidos='" + apellido + "',email='" + email + "',telefono='" + telefono + "' WHERE usuario = '" + rows["usuario"] + "' and clave = '" + rows["clave"] + "'";
      updateUser(query, usuario, oldPassword).then(function (rows) {
        event.reply("editCorrect",usuario);
      }).catch((err) => setImmediate(() => { console.log(err) }))
    }
    else {
      clave = md5(clave);
      query = "UPDATE usuarios SET usuario='" + usuario + "',clave='" + clave + "',nombre='" + nombre + "',apellidos='" + apellido + "',email='" + email + "',telefono='" + telefono + "' WHERE usuario = '" + rows["usuario"] + "' and clave = '" + rows["clave"] + "'";
      updateUser(query, usuario, clave).then(function (rows) {
        event.reply("editCorrect");
      }).catch((err) => setImmediate(() => { console.log(err) }))
    }





  }).catch((err) => setImmediate(() => { console.log(err) }))
})
//Elimitar cuenta
ipcMain.on("deleteAccount", function (event,id_user) { 
  mainWindow.webContents.executeJavaScript('confirm("¿Estás seguro que desea eliminar su cuenta?");').then((result) => {
      if(result)
      {
        deleteAccount(id_user).then(function () {
          mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'src/renderer/loginWindow.html'),
            protocol: 'file:',
            slashes: true
          }));
        }).catch((err) => setImmediate(() => { console.log(err) }))
      }
      else
      {
        console.log("no eliminar");
      }
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("needHelp", function (event) { //ESTA FUNCION  NO ESTÁ IMPLEMENTADA
  console.log("hola");
  mainWindow.webContents.executeJavaScript('confirm("¿Desea solicitar ayuda?");').then((result) => {
    if(result)
    {
      console.log("Ayuda activada");
    }
    else
    {
      console.log("Ayuda desactividada");
    }
}).catch((err) => setImmediate(() => { console.log(err) }))
})

ipcMain.on("goToNews", function (event) { 
      getAll("noticias").then((result)=>{
       event.reply("showNews",result)
    }).catch((err) => setImmediate(() => { console.log(err) }))
})
//------Administración--------
ipcMain.on("goToAdministrateUsers",function(event){
     getAll("usuarios").then((result)=>{
      event.reply("showUsers",result)
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("goToAdministrateNews",function(event){
  getAll("noticias").then((result)=>{
   event.reply("showNews",result)
}).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("addNew",function(event,titulo,copete,cuerpo){
  addNew(titulo,copete,cuerpo).then((result)=>{
    event.reply("newAdded");
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("showEditProfileAdmin",function(event,id_user){
  get("usuarios", "id_usuario", id_user).then(function (rows) {//Obtengo los datos 
    event.reply('showEditProfile', rows)//Los mando al renderer
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("deleteAccountAdm", function (event,id_user) { 
  mainWindow.webContents.executeJavaScript('confirm("¿Estás seguro que desea eliminar esta cuenta?");').then((result) => {
      if(result)
      {
        console.log("id_user->"+id_user);
        deleteAccount(id_user).then(function () {
          mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'src/renderer/views/admin_view.html'),
            protocol: 'file:',
            slashes: true
          }));
        }).catch((err) => setImmediate(() => { console.log(err) }))
      }
      else
      {
        console.log("no eliminar");
      }
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("deleteNew", function (event,id_new) { 
  mainWindow.webContents.executeJavaScript('confirm("¿Estás seguro que desea eliminar esta noticia?");').then((result) => {
      if(result)
      {
        deleteNew(id_new).then(function () {
          mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'src/renderer/views/admin_view.html'),
            protocol: 'file:',
            slashes: true
          }));
        }).catch((err) => setImmediate(() => { console.log(err) }))
      }
      else
      {
        console.log("no eliminar");
      }
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on('addNewUser', function () {
  createRegisterWindow();
  Menu.setApplicationMenu(registerMenu);
})
ipcMain.on("showEditNews",function(event,id_new){
  get("noticias", "idNoticia", id_new).then(function (rows) {//Obtengo los datos 
    event.reply('showEditNew', rows)//Los mando al renderer
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
ipcMain.on("editNew",function(event,titulo,copete,cuerpo,idNoticia){
  updateNews(titulo,copete,cuerpo,idNoticia).then(function (rows) {//Obtengo los datos 
    event.reply('newEdited', rows)//Los mando al renderer
  }).catch((err) => setImmediate(() => { console.log(err) }))
})
//************************************************************************** */
//--------------------------PLANTILLAS-MENUS----------------------------------
//*************************************************************************** */

//Vamos a crear el menu
//Que no es más que un array de objetos
const mainMenuTemplate = [
  {
    label: 'Salir',
    //Aquí añado un shortcut, dependiendo del so donde se ejecute
    accelerator: process.plataform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
    click() {
      app.quit();
      connection.end(function () {
        //Aquí se cierra la conexión 
      })
    }
  }
];

//
const registerWindowTemplate = [{
  label: 'Herramientas de desarrollo',
  submenu: [
    {
      label: 'Toggle DevTools',
      accelerator: process.plataform == 'darwin' ? 'Command+I' : 'Ctrl+I',
      click(item, focusedWindow) {
        focusedWindow.toggleDevTools();
      }
    },
    {
      role: 'reload'
    }
  ]
}];
const registerMenu = Menu.buildFromTemplate(registerWindowTemplate);

//************************************************************************** */
//--------------------------Ajustes SO----------------------------------
//*************************************************************************** */


//Si es mac, añade un objeto vacío al menú
if (process.plataform == 'darwin') {
  mainMenuTemplate.unshift({});
}

//Añadir herramientas de desarrollador si no  está en produccion
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Herramientas de desarrollo',
    submenu: [
      {
        label: 'Toggle DevTools',
        accelerator: process.plataform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  });
}


//************************************************************************** */
//--------------------------COMUNICACIÓN ENTRE PROCESOS----------------------*
//****************************************************************************/

//************************************************************************** */
//--------------------------FUNCIONES BÁSICAS--------------------------------*
//****************************************************************************/
function getSessionValue(key) {
  return new Promise(function (resolve, reject) {
    mainWindow.webContents.executeJavaScript('localStorage.getItem("' + key + '")', true).then((result) => {
      if (typeof result != "undefined")
        return resolve(result);
      else
        return reject("Esta variable de sesión no existe");
    }).catch((err) => setImmediate(() => { console.log(err) }))

  })
}
function setSessionValue(key, value) {
  return new Promise(function (resolve, reject) {
    mainWindow.webContents.executeJavaScript('localStorage.setItem("' + key + '","' + value + '")', true);

    mainWindow.webContents.executeJavaScript("localStorage.getItem('" + key + "')", true).then((result) => {
      if (typeof result != "undefined" && result == value)
        return resolve(result);
      else
        return reject("Esta variable de sesión no existe");

    }).catch((err) => setImmediate(() => { console.log(err) }))

  })
}







//************************************************************************** */
//--------------------------CONSULTAS A LA BASE DE DATOS----------------------
//*************************************************************************** */

//------GET--------------
function get(table, element, value) {
  return new Promise(function (resolve, reject) {
    if (isNaN(value)) {//soluciona el problema de buscar por un string o id
      value = "'" + value + "'"
    }
    let query = "SELECT * FROM " + table + " where " + element + " = " + value
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      let row = rows[0];
      resolve(row);

    })
  })
}
//----------GET * -------------------

function getAll(table) {
  return new Promise(function (resolve, reject) {
    let query = "SELECT * FROM " + table;
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      resolve(rows);

    })
  })
}

//--------------REGISTRO--------
function register(usuario, clave, nombre, apellidos, email, telefono) {
  return new Promise(function (resolve, reject) {
    let clave_encriptada = md5(clave);
    let query = "INSERT INTO `usuarios` ( `usuario`, `clave`, `nombre`, `apellidos`, `email`, `tipo`,  `telefono`) VALUES ('" + usuario + "','" + clave_encriptada + "', '" + nombre + "', '" + apellidos + "', '" + email + "', 'normal', '" + telefono + "');"
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      resolve(rows);

    })
  })
}

//----------Login------------
function login(usuario, clave) {

  return new Promise(function (resolve, reject) {
    clave = md5(clave);

    let query = "SELECT * FROM usuarios where usuario='" + usuario + "' and clave = '" + clave + "'"
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      let today = new Date();
      setSessionValue("usuario", usuario);
      setSessionValue("clave", clave);
      setSessionValue("tiempo", today.getHours());
      try {
        setSessionValue("tipo", rows[0]['tipo']);
      } catch (error) {
        console.log("------------error login----------------");
      }
      

      resolve(rows);

    })
  })
}

//UPDATE user
function updateUser(query, usuario, clave) {
  return new Promise(function (resolve, reject) {
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      let today = new Date();
      setSessionValue("usuario", usuario);
      setSessionValue("clave", clave);
      setSessionValue("tiempo", today.getHours());
      resolve(rows);

    })
  })
}

//DELETE user
function deleteAccount(id_usuario){
  return new Promise(function (resolve, reject) {
    let query="DELETE from usuarios where id_usuario='"+id_usuario+"'";
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      setSessionValue("usuario", "undefined");
      setSessionValue("clave", "undefined");
      setSessionValue("tiempo", "undefined");
      resolve(rows);

    })
  })
}

//Insert new

function addNew(titulo,copete,cuerpo){
  return new Promise(function (resolve, reject) {
    let query='INSERT into noticias (titulo,copete,cuerpo) values ("'+titulo+'","'+copete+'","'+cuerpo+'")';
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      resolve(rows);

    })
  })
}

//UPDATE news
function updateNews( titulo, copete,cuerpo,idNoticia) {
  return new Promise(function (resolve, reject) {
    let query='UPDATE  noticias set titulo="'+titulo+'", copete="'+copete+'",cuerpo="'+cuerpo+'" where idNoticia= "'+idNoticia+'"';
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      resolve(rows);

    })
  })
}
//DELETE new
function deleteNew(id_new){
  return new Promise(function (resolve, reject) {
    let query="DELETE from noticias where idNoticia='"+id_new+"'";
    console.log(query);

    connection.query(query, function (err, rows, fields) {
      if (err) {
        return reject(err);
      }
      resolve(rows);

    })
  })
}



