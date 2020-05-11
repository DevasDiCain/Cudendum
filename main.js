//Entrada en la ejecución
const electron = require('electron');
const url = require('url');
const path = require('path');

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
  //creamos la ventana
  mainWindow = new BrowserWindow({
    width: 1200,
    webPreferences: { nodeIntegration: true },
    defaultEncoding: 'UTF-8',
  });

  //cargamos el html en la ventana

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/renderer/mainWindow.html'),
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
    height: 590,
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


// Capturar evento en renderer (item:add)
ipcMain.on('item:add', function (e, item) {
  mainWindow.webContents.send('item:add', item);
  registerWindow.close();
})
ipcMain.on('closeRegisterWindow',function(){
  if(registerWindow != null)
       registerWindow.close();
})
ipcMain.on('register',function(){
  console.log("registrando");
})

//************************************************************************** */
//--------------------------PLANTILLAS-MENUS----------------------------------
//*************************************************************************** */

//Vamos a crear el menu
//Que no es más que un array de objetos
const mainMenuTemplate = [
  {
    label: 'Acceso',
    submenu: [
      {
        label: 'Registro',
        click() {
          createRegisterWindow();
          Menu.setApplicationMenu(registerMenu);
        }
      },
      {
        label: 'Iniciar',
        click() {
          mainWindow.webContents.send('item:clear');
        }
      },
      {
        label: 'Salir',
        //Aquí añado un shortcut, dependiendo del so donde se ejecute
        accelerator: process.plataform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
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
//--------------------------COMUNICACIÓN ENTRE PROCESOS----------------------
//*************************************************************************** */

//************************************************************************** */
//--------------------------FUNCIONES BÁSICAS----------------------
//*************************************************************************** */

function closeWindow(){
  registerWindow.close();
}
function register(){
  console.log("registrando");
}