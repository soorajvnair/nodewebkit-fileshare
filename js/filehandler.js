//filehandler.js contains Models for single File, it's collection
//Views for single file, list of files, view without any files, file sending view, file receiving view.
//Stability : unstable
//Review done on 27th July 11:22 PM
//Bugs none
//todo : Implement file receiving view & list of received files view

var File = Backbone.Model.extend({ //File Model

	defaults : {

		'name' : '',
		'type' : '',
		'size' : '',
		'path' : '',
		'progress' : 0,
		'to' : [],
		'from' : [],
		'dest' : []
	}

});


var Files = Backbone.Collection.extend({ //Files Collection

	model : File

});


var emptyFileView = Backbone.View.extend({ //View where no files has been selected

	template : template('#emptyFileView'),
	render : function(){

		this.$el.append(this.template());
		return this;

	},
	events : {

		'click #fileBtn' : 'fileButtonClicked' //Listens for the user to click on select a file button

	},
	fileButtonClicked : function(){

		$('#fileDialog').click(); //then trigger a click event on the hidden input element of file type
	}

});


var FileView = Backbone.View.extend({ //View for a single file

	template : template('#fileView'),
	initialize : function(){

		this.listenTo(appEventEmitter,'peer:selected',this.updateToList);
		this.listenTo(appEventEmitter,'peer:unselected',this.deleteFromList);
		this.initializeToList();
		this.listenTo(this.model,'remove',this.removeFile)

	},
	events : {

		'click .closeBtn' : 'destroyFile'

	},
	render : function(){

		this.$el.html(this.template(this.model.toJSON()));
		return this;

	},
	updateToList : function(peer){

		this.model.get('to').push(peer.toJSON());

	},
	initializeToList : function(){

		if(GLOBAL_dest.length !== 0){

			var index;

			for(index = 0; index < GLOBAL_dest.length; index ++){

				this.model.get('to').push(GLOBAL_dest[index]);
			}
		}
	},
	destroyFile : function(e){

		e.stopPropagation();
		if(this.model.collection.length>1){

			appEventEmitter.trigger('file:remove',this.model);
		}else{

			this.model.collection.reset();
			appEventEmitter.trigger('file:send:cancelled');
		}
		
	},
	removeFile : function(){

		this.$el.remove();
	},
	deleteFromList : function(peer){

		// var peerDetails = {

		// 	'address' : peer.get('address'),
		// 	'hostname': peer.get('hostname')
		// };

		// index = this.model.get('to').indexOf(peerDetails);
		// if(index > -1){

		// 	this.model.get('to').splice(index,1);
		// }

		var freshArray = _.reject(this.model.get('to'),function(x){ return x.address === peer.toJSON().address});
		this.model.set('to',freshArray);

	}

});


var FilesView = Backbone.View.extend({ //View for a collection of files

	
	template : template('#topFileButton'),
	initialize : function(){

		this.listenTo(this.collection,'add',this.updateFileList);
		
	},
	events : {

		'click #add' : 'addMoreFiles',
		'click #cancel' : 'cancelFileSelect',
		'click #send' : 'sendFiles'
	},
	render : function(){

		this.$el.append(this.template());
		this.collection.each(function(file){

			var newFileView = new FileView({ model : file });
			this.$el.append(newFileView.render().el);

		},this);
		return this;
	},
	updateFileList : function(file){

		var newFileView = new FileView({ model : file});
		this.$el.append(newFileView.render().el);
	},
	addMoreFiles : function(e){

		$('#fileDialog').click();
	},
	cancelFileSelect : function(){

		this.collection.reset();
		appEventEmitter.trigger('file:send:cancelled');
	},
	sendFiles : function(){

		if(GLOBAL_dest.length == 0){

			if(peers.length == 0){

				alert('No peers are online!');
			}else{

				alert('Please select your destination');
			}
		}else{

			appEventEmitter.trigger('file:send:selected');
		}
	}
});

var SendingFileView = Backbone.View.extend({ //View for a single file that is being sent

	template : template('#sendTemplate'),

	//template2 : template('#sendSubTemplate'),

	events : {

		'click .expandIcon' : 'expandTransfers'

	},

	render : function(){

		this.$el.html(this.template(this.model.toJSON()));
		//this.setSubViews();
		this.listenTo(this.model,'remove',this.removeFile);
		this.listenTo(this.model,'change:progress',this.updateProgressBar); // Awesome!.
		return this;

	},

	updateProgressBar:function(){

		console.log('progress bar updated!');

		var progressValue = this.model.get('progress')/GLOBAL_dest.length;

		if(progressValue < 10){

			$('.progress-bar-danger').css('width',progressValue + '%');

		}else if( progressValue >= 10 && progressValue <= 99  ){

			$('.progress-bar-danger').css('width', 0 + '%');
			$('.progress-bar-info').css('width',progressValue + '%');

		}else if(progressValue == 100){

			$('.progress-bar-info').css('width',0 + '%');
			$('.progress-bar-success').css('width',progressValue + '%');
			$('.transferInfo').html('<small> File transfer Completed!</small>');
		}

		//this.setSubViews();
		// I need to first update all of the destination progressbars
		// then calculate the total progress from them and update the overall progress bar

	},

	expandTransfers : function(e){

		e.preventDefault();
		e.stopPropagation();
		this.setSubViews();
		$('#subTransfers').toggleClass('show','hidden');

	},

	setSubViews : function(){

		var index = 0;

		_.each(this.model.get('to'),function(dest){

			if(index === 0){

				$('#subTransfers').html(this.template2(dest));
				index ++;
			}else{

				$('#subTransfers').append(this.template2(dest));
			}

		},this);
	}

});

var SendingFilesView = Backbone.View.extend({ //View for files being sent

	render : function(){

		this.collection.each(function(file){

			var newsendview = new SendingFileView({ model : file});
			this.$el.append(newsendview.render().el);

		},this);
		return this;
	}

});

//AS : Trivia, not sure why i should attach this to window for this to work.
//Should look at it later

window.filesCollection = new Files(); //A files collection instance is created here
window.receivedFilesCollection = new Files(); //A collection for received files instance is created here

appEventEmitter.on('files:selected',function(files){ //The files models selected ar in the form of a difficult object to handle 
													//So i'm using a files container to parse it into the form that is more friendly
													var filesContainer = [];
													_.each(files,function(file){

														filesContainer.push({ 'name' : file.name , 'type' : file.type , 'path' : file.path, 'size' : file.size });

													},this);

													filesCollection.add(filesContainer);
												});

//need to seperate the following code

$('#fileDialog').change(function(){ //Handler for input element of type file, when it changes, i.e selects files

	appEventEmitter.trigger('files:selected',this.files);

});



//The following code is all related to handling of the dropzone! i.e file drag and drop
var dropzone = document.getElementById('dropZone');

dropzone.addEventListener('dragover',function(e){

	e.preventDefault();
	e.stopPropagation();

},false);

dropzone.addEventListener('drop',function(e){

	e.preventDefault();
	e.stopPropagation();

	console.log(this);
	console.log(e.dataTransfer.files);
	appEventEmitter.trigger('files:selected',e.dataTransfer.files);

},false)

