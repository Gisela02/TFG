'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


module.exports = audiorecorder;
function audiorecorder(context) {
	var self = this;

	this.context = context;
	this.commandRouter = this.context.coreCommand;
	this.logger = this.context.logger;
	this.configManager = this.context.configManager;

	this.filePath = '/home/volumio/recordings/';
    this.fileName = 'output.wav';
	this.isPaused = false;

    this.registerListeners();

}

audiorecorder.prototype.onVolumioStart = function()
{
	var self = this;
	self.logger.info('Entrando en onVolumioStart');
	var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	this.config = new (require('v-conf'))();
	this.config.loadFile(configFile);

    return libQ.resolve();
}

audiorecorder.prototype.onStart = function() {
    var self = this;
	var defer=libQ.defer();
    self.commandRouter.logger.info('onStart ha sido llamado.');

	//this.registerListeners();
	defer.resolve();

    return defer.promise;
};

audiorecorder.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

/*
audiorecorder.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};
*/
audiorecorder.prototype.registerListeners = function() {
    var self = this;
    self.commandRouter.logger.info('Registrando listeners para botones de UI.');
    self.context.coreCommand.sharedVars.registerCallback('saveConfig', this.saveConfig.bind(this));
    self.context.coreCommand.sharedVars.registerCallback('playAudio', this.playAudio.bind(this));
    self.context.coreCommand.sharedVars.registerCallback('pauseAudio', this.pauseAudio.bind(this));
    self.context.coreCommand.sharedVars.registerCallback('stopAudio', this.stopAudio.bind(this));
    self.context.coreCommand.sharedVars.registerCallback('saveAudio', this.saveAudio.bind(this));
    self.logger.info('Listeners registrados correctamente.');
};


// Configuration Methods -----------------------------------------------------------------------------

audiorecorder.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

	self.logger.info('Entrando en getUIConfig');

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
        __dirname+'/i18n/strings_en.json',
        __dirname + '/UIConfig.json')
        .then(function(uiconf)
        {
		uiconf.sections[0].content[0].value = self.config.get('file_path', '/home/volumio/recordings/');
        	uiconf.sections[0].content[1].value = self.config.get('file_name', 'output.wav');

		self.logger.info('Configuración de file_path cargada: ' + uiconf.sections[0].content[0].value);
		self.logger.info('Configuración de file_name cargada: ' + uiconf.sections[0].content[1].value);
		//self.logger.info('UIConfig cargado: ' + JSON.stringify(uiconf, null, 2));
		/*
		if (Array.isArray(uiconf.sections)) {
			self.logger.info('uiconf.sections es ARRAY')
			self.logger.info('Contenido de uiconf.sections sin modificar: ' + JSON.stringify(uiconf.sections, null, 2));
		}
		*/
            	defer.resolve(uiconf);
        })
        .fail(function()
        {
		self.logger.error('Error al cargar UIConfig: ' + error);
		defer.reject(new Error('UIConfig error: ' + error));
        });

    return defer.promise;
};

audiorecorder.prototype.playAudio = function() {
    var self = this;
    var fullPath = this.filePath + this.fileName;

	self.logger.info('playAudio ha sido llamado');

    if (!fs.existsSync(fullPath)) {
        self.commandRouter.pushToastMessage('error', 'Archivo no encontrado', 'Verifica la ruta y el nombre del archivo.');
        return;
    }

    exec(`pgrep aplay`, (err, stdout) => {
        if (!stdout) {
            exec(`aplay -D plughw:2,0 ${fullPath}`, (error) => {
                if (error) {
                    self.commandRouter.pushToastMessage('error', 'Reproducción', 'Error al reproducir el archivo.');
                } else {
                    self.commandRouter.pushToastMessage('success', 'Reproducción', 'Reproduciendo archivo de audio.');
                }
            });
        } else {
            self.commandRouter.pushToastMessage('warning', 'Reproducción', 'Ya hay audio reproduciéndose.');
        }
    });
};

audiorecorder.prototype.pauseAudio = function() {
    var self = this;
    if (self.isPaused) {
        exec('pkill -CONT aplay', (error) => {
            if (error) {
                self.commandRouter.pushToastMessage('error', 'Reanudar', 'No se pudo reanudar el audio.');
            } else {
                self.commandRouter.pushToastMessage('success', 'Reanudar', 'Audio reanudado.');
                self.isPaused = false;
            }
        });
    } else {
        exec('pkill -STOP aplay', (error) => {
            if (error) {
                self.commandRouter.pushToastMessage('error', 'Pausa', 'No se pudo pausar el audio.');
            } else {
                self.commandRouter.pushToastMessage('success', 'Pausa', 'Audio en pausa.');
                self.isPaused = true;
            }
        });
    }
};

audiorecorder.prototype.stopAudio = function() {
    var self = this;
    exec('pkill aplay', (error) => {
        if (error) {
            self.commandRouter.pushToastMessage('error', 'Detener', 'No se pudo detener el audio.');
        } else {
            self.commandRouter.pushToastMessage('success', 'Detener', 'Audio detenido.');
			self.isPaused = false;
        }
    });
};

audiorecorder.prototype.saveAudio = function() {
    var self = this;
    var fullPath = this.filePath + this.fileName;

	exec('pgrep arecord', (err, stdout) => {
        if (!stdout) {
            exec(`arecord -D plughw:2,0 -f cd -t wav -c 2 -r 48000 ${fullPath}`, (error) => {
                if (error) {
                    self.commandRouter.pushToastMessage('error', 'Grabación', 'Error al guardar el archivo.');
                } else {
                    self.commandRouter.pushToastMessage('success', 'Grabación', 'Grabación completada y guardada.');
                }
            });
        } else {
            self.commandRouter.pushToastMessage('warning', 'Grabación', 'Ya hay una grabación en curso.');
        }
    });
};



audiorecorder.prototype.getConfigurationFiles = function() {
	return ['config.json'];
}

audiorecorder.prototype.setUIConfig = function(data) {
    var self = this;

    // Obtener valores del formulario
    var filePath = data['file_path'];
    var fileName = data['file_name'];

    // Guardar en config.json
    self.config.set('file_path', filePath);
    self.config.set('file_name', fileName);

    // Mensaje de confirmación
    self.commandRouter.pushToastMessage('success', 'Configuración guardada', 'Ruta y nombre de archivo actualizados correctamente.');

    // Recargar configuración para reflejar los cambios inmediatamente
    this.filePath = filePath;
    this.fileName = fileName;
};

audiorecorder.prototype.saveConfig = function(data) {  //CAMBIOS
    var self = this;
    self.setUIConfig(data);
};

audiorecorder.prototype.getConf = function(varName) {
	var self = this;
	//Perform your installation tasks here
};

audiorecorder.prototype.setConf = function(varName, varValue) {
	var self = this;
	//Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it

/*
audiorecorder.prototype.addToBrowseSources = function () {

	// Use this function to add your music service plugin to music sources
    //var data = {name: 'Spotify', uri: 'spotify',plugin_type:'music_service',plugin_name:'spop'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

audiorecorder.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    //self.commandRouter.logger.info(curUri);
    var response;


    return response;
};



// Define a method to clear, add, and play an array of tracks
audiorecorder.prototype.clearAddPlayTrack = function(track) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::clearAddPlayTrack');

	self.commandRouter.logger.info(JSON.stringify(track));

	return self.sendSpopCommand('uplay', [track.uri]);
};

audiorecorder.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
audiorecorder.prototype.stop = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::stop');


};

// Spop pause
audiorecorder.prototype.pause = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::pause');


};

// Get state
audiorecorder.prototype.getState = function() {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::getState');


};

//Parse state
audiorecorder.prototype.parseState = function(sState) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::parseState');

	//Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
audiorecorder.prototype.pushState = function(state) {
	var self = this;
	self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'audiorecorder::pushState');

	return self.commandRouter.servicePushState(state, self.servicename);
};


audiorecorder.prototype.explodeUri = function(uri) {
	var self = this;
	var defer=libQ.defer();

	// Mandatory: retrieve all info for a given URI

	return defer.promise;
};

audiorecorder.prototype.getAlbumArt = function (data, path) {

	var artist, album;

	if (data != undefined && data.path != undefined) {
		path = data.path;
	}

	var web;

	if (data != undefined && data.artist != undefined) {
		artist = data.artist;
		if (data.album != undefined)
			album = data.album;
		else album = data.artist;

		web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
	}

	var url = '/albumart';

	if (web != undefined)
		url = url + web;

	if (web != undefined && path != undefined)
		url = url + '&';
	else if (path != undefined)
		url = url + '?';

	if (path != undefined)
		url = url + 'path=' + nodetools.urlEncode(path);

	return url;
};

*/

/*

audiorecorder.prototype.search = function (query) {
	var self=this;
	var defer=libQ.defer();

	// Mandatory, search. You can divide the search in sections using following functions

	return defer.promise;
};

audiorecorder.prototype._searchArtists = function (results) {

};

audiorecorder.prototype._searchAlbums = function (results) {

};

audiorecorder.prototype._searchPlaylists = function (results) {


};

audiorecorder.prototype._searchTracks = function (results) {

};

audiorecorder.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

// Handle go to artist and go to album function

     return defer.promise;
};
*/
