//Electron
//https://medium.com/@alexanderruma/using-node-js-puppeteer-and-electronjs-to-create-a-web-scraping-app-with-a-desktop-interface-668493ced47d
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const ipc = electron.ipcMain;
//const Notification = electron.Notification;

//Bytenode
const bytenode = require('bytenode');
const fs = require('fs');
const v8 = require('v8');

v8.setFlagsFromString('--no-lazy');

if (!fs.existsSync('./driver/chromedriver.jsc')) {
  bytenode.compileFile('./driver/chromedriver.js', './driver/chromedriver.jsc');
}
if (!fs.existsSync('./dataManager.jsc')) {
	bytenode.compileFile('./dataManager.js', './dataManager.jsc');
}
if (!fs.existsSync('./services/authservice.jsc')) {
	bytenode.compileFile('./services/authservice.js', './services/authservice.jsc');
}

const {connexion} = require('./services/authservice.js');
//Config
const path = require('./config/path.json');

const {readDataFiles, writeDataFiles, getDataFiles, isDirectory, getPics} = require('./dataManager.js')

const {upload, setWSChrome, setBrowser} = require(path.driver.chromedriver);

//Variables
var config;
var currentLang = null;

var folders = null;
var currentFolder = null;

var currentOeuvre = null;
var currentOeuvrePath = null;

init();

//Script
var win = null; //Main window
var authWin = null;
function createAuthWindow() {
  
    function destroyAuthWin() {
        if (!authWin) return;
        authWin.close();
        authWin = null;
      }
  destroyAuthWin();
  authWin = new BrowserWindow({
    width: 400,
    height: 100,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    }
  });
  authWin.setMenu(null) //Disable menu
  authWin.loadFile('./renderers/login.html');
  authWin.on('closed', () => {
    authWin = null;
  });
}

async function createMainWindow() {
    try {
        authWin.hide();
        //Icone de menu en bas à droite de l'écran
        const tray = new Tray(path.appIcon);
        tray.setToolTip('RedBubot is running');
        const menu = Menu.buildFromTemplate([ //Click droit
            {
                label: 'Rediriger vers le support',
                click: () => {
                    electron.shell.openExternal('https:/#');
                }
            }
        ]);
        tray.setContextMenu(menu);
        //Window settings
        win = new BrowserWindow({
            width: 1000,
            height: 700,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        })
        win.setMenu(null) //Disable menu
        win.loadFile(path.views.home)
    } catch (err) {
        createAuthWindow()
    }
}

//Classic events
app.on('ready', () => {
    createAuthWindow()
})
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        uploadUserData();
    }
})


//Events
//Initialisation
ipc.on('initialize', (event) => {
    event.reply('configData', config)
    if (currentOeuvrePath != '') {
        console.log(currentOeuvre)
        event.reply('oeuvre', currentOeuvre, currentLang)
    }
    event.reply('foldersUpdate', folders)
    event.reply('currentFolder', currentFolder)
    if (currentFolder != "") {
        event.reply('files', getPics(currentFolder))
    }
});
ipc.on('changeWindowToDirectories', (event, arg) => {
    if (arg != "") {
        currentFolder = arg
    }
    win.loadFile(path.views.directories)
});
//Log
ipc.on('log', (event, arg) => {
    console.log(arg)
        /*
        new Notification('Une réponse a été postée !', {
          body: 'Zds dans le sujet «Electron, c\'est bien.»',
          icon: 'assets/zds.png'
        });
        */
});
ipc.on('exportLang', (event, arg) => {
    function exportLang(title, description, tags){
        var oeuvre = {
            title: { FR: '', EN: '', DK: '', ES: '' },
            tags: { FR: '', EN: '', DK: '', ES: '' },
            description: { FR: '', EN: '', DK: '', ES: '' },
            path: ''
          }
        oeuvre.tags.FR = tags
        oeuvre.tags.EN = tags
        oeuvre.tags.DK = tags
        oeuvre.tags.ES = tags
        oeuvre.title.FR = title
        oeuvre.title.EN = title
        oeuvre.title.DK = title
        oeuvre.title.ES = title
        oeuvre.description.FR = description
        oeuvre.description.EN = description
        oeuvre.description.DK = description
        oeuvre.description.ES = description
        oeuvre.path = currentOeuvre.path
        return oeuvre;
    }
    switch (currentLang) {
        case "FR":
            currentOeuvre = exportLang(currentOeuvre.title.FR,currentOeuvre.description.FR,currentOeuvre.tags.FR, currentOeuvre.path)
            break;
        case "EN":
            currentOeuvre = exportLang(currentOeuvre.title.EN,currentOeuvre.description.EN,currentOeuvre.tags.EN, currentOeuvre.path)
            break;
        case "DK":
            currentOeuvre = exportLang(currentOeuvre.title.DK,currentOeuvre.description.DK,currentOeuvre.tags.DK, currentOeuvre.path)
            break;
        case "ES":
            currentOeuvre = exportLang(currentOeuvre.title.ES,currentOeuvre.description.ES,currentOeuvre.tags.ES, currentOeuvre.path)
            break;
        default:
            break;
    }
    writeDataFiles(currentOeuvre, currentOeuvrePath)
    event.reply('exportWasMade', "L'export a été effectué.")
});
ipc.on('lang', (event, arg) => {
    switch (arg) {
        case "1":
            currentLang = "FR"
            break;
        case "2":
            currentLang = "EN"
            break;
        case "3":
            currentLang = "DK"
            break;
        case "4":
            currentLang = "ES"
            break;
        default:
            break;
    }
    event.reply('oeuvre', currentOeuvre, currentLang)
});
ipc.on('getOeuvre', (event) => {
    event.reply('oeuvre', currentOeuvre, currentLang)
});
ipc.on('setUsername', (event, arg) => {
    config.rbUsername = arg;
    uploadUserData();
})
ipc.on('setBaseUrl', (event, arg) => {
    config.baseUrl = arg;
    uploadUserData();
})
ipc.on('tryLogin', (event, arg) => {
    async function tmp(){
       var conn = await connexion(arg)
       async function tmp2(conn){
            if(conn){
                createMainWindow()
            }
        }
       await tmp2(conn)
    }
    tmp();
})
ipc.on('setDebugger', (event, arg) => {
    config.wbDriverKey = arg;
    setWSChrome(config.wbDriverKey)
    uploadUserData();
})
ipc.on('title', (event, arg) => {
    change("title", currentLang, currentOeuvre, arg)
});
ipc.on('description', (event, arg) => {
    change("description", currentLang, currentOeuvre, arg)
});
ipc.on('tags', (event, arg) => {
    change("tags", currentLang, currentOeuvre, arg)
});
ipc.on('input', (event, arg) => {
    change("path", currentLang, currentOeuvre, arg)
});
ipc.on('addFolder', (event, arg) => {
    if (isDirectory(path)) {
        event.reply('doNoExist')
    } else {
        if (arg.lastIndexOf('/') == arg.length - 1 || arg.lastIndexOf('\\') == arg.length - 1) {
            arg = arg.substring(0, arg.length - 1)
        }
        folders.push(arg);
        uploadUserData();
        event.reply('foldersUpdate', folders)
    }
});
//Supprimer le répertoire courrant
ipc.on('delCurrent', (event) => {
    folders.pop(currentFolder)
    win.loadFile(path.views.config)
});
//Exporter une config
ipc.on('export', (event, arg) => {
    arg = arg.substring(0, arg.lastIndexOf('.')) + '.rdb'
    try {
        dataTmp = readDataFiles(arg);
        getPics(currentFolder).forEach(element => {
            dataTmp.path = element;
            writeDataFiles(dataTmp, element.substring(0, element.lastIndexOf('.')) + '.rdb')
        })
        event.reply('exportWasMade', 'L\'export a bien été pris en compte.')
    } catch {
        event.reply('exportWasMade', 'L\'export n\'a pas pu être pris en compte. Vérifiez si une configuration existe bien pour le fichier sélectionné.')
    }
})
ipc.on('upload', (event) => {
    win.loadFile(path.views.log)
    async function tmp() {
        try {
            await setBrowser()
        } catch (error) {
            console.log(error)
            writeDataFiles(JSON.stringify(error), './err.json')
            event.reply('log', castLog('Problème d\'initialisation du driver, vérifiez votre onglet setting.'), 'danger')
            return;
        }

        for (const file of getDataFiles(currentFolder, 'rdb')) {
            event.reply('log', castLog('L\'upload du dossier ' + currentFolder + ' va commencer.'), 'primary')
            try {
                await upload(readDataFiles(file), config.baseUrl)
                event.reply('log', castLog(file + ' a été upload sur RedBubble.'), 'success')
            } catch (error) {
                event.reply('log', castLog(error), 'danger')
                writeDataFiles(JSON.stringify(error), './errUp.json')
                break;
            }
            console.log(file)
        }
    }
    tmp()
})
ipc.on('selectedFile', (event, arg) => {
    currentOeuvrePath = arg.substring(0, arg.lastIndexOf('.')) + '.rdb'
    try {
        currentOeuvre = readDataFiles(currentOeuvrePath)
    } catch {
        currentOeuvre = require(path.config.emptyOeuvre);
        currentOeuvre.path = arg;
    }
    writeDataFiles(currentOeuvre, currentOeuvrePath)
    win.loadFile(path.views.oeuvre)
});


//Functions
function change(type, lang, oeuvre, newOne) {
    switch (type) {
        case "title":
            switch (lang) {
                case "FR":
                    oeuvre.title.FR = newOne
                    break;
                case "EN":
                    oeuvre.title.EN = newOne
                    break;
                case "DK":
                    oeuvre.title.DK = newOne
                    break;
                case "ES":
                    oeuvre.title.ES = newOne
                    break;
                default:
                    break;
            }
            break;
        case "tags":
            switch (lang) {
                case "FR":
                    oeuvre.tags.FR = newOne
                    break;
                case "EN":
                    oeuvre.tags.EN = newOne
                    break;
                case "DK":
                    oeuvre.tags.DK = newOne
                    break;
                case "ES":
                    oeuvre.tags.ES = newOne
                    break;
                default:
                    break;
            }
            break;
        case "description":
            switch (lang) {
                case "FR":
                    oeuvre.description.FR = newOne
                    break;
                case "EN":
                    oeuvre.description.EN = newOne
                    break;
                case "DK":
                    oeuvre.description.DK = newOne
                    break;
                case "ES":
                    oeuvre.description.ES = newOne
                    break;
                default:
                    break;
            }
            break;
        case "path":
            oeuvre.path = newOne
            break;
        default:
            break;
    }
    writeDataFiles(currentOeuvre, currentOeuvrePath)
}

function init() {
    try {
        config = readDataFiles(path.config.userData)
    } catch {
        config = require(path.config.emptyConfig)
    }
    setWSChrome(config.wbDriverKey)

    currentLang = "FR";

    folders = config.folders;
    currentFolder = "";

    currentOeuvrePath = "";
}

function uploadUserData() {
    writeDataFiles(config, path.config.userData)
}

function castLog(log) {
    var tdy = new Date();
    return tdy + ': ' + log
}

module.exports = {
    createMainWindow
  };