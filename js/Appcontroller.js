//This is the brain of our app, the conductor, who directs all the actions of the app


var udpLayer = require('udp.js'); //for all UDP layer information
var tcpEventEmitter = require('tcpFileHandler.js'); //for all tcp layer info, we use this module it facilitate the actual transfer of files


var peers = new Peers(udpLayer.peers); //initialize a new Peers collection

appEventEmitter.on('app:initialize', function(){

	//When the app initializes,
	//We create instances of empty file view & peerlist view and attach them to their resp positions
	var emptyfileview = new emptyFileView(); //creating an instance of empty file view
	$('#fileList').html(emptyfileview.render().el); //adding the view to the dom

	var peerlistview = new PeerListView({ collection : peers }); //creating an instance of peer list view
	$('#peerArea').html(peerlistview.el);

	//When a file is selected,
	//We close the emptyfileview and them replaces it with the fileListView
	appEventEmitter.once('files:selected',function(){

		var filelistview = new FilesView({ collection : filesCollection });
		emptyfileview.remove();
		$('#fileList').html(filelistview.render().el);

		//When the send button is selected
		//we trigger a udp layer event to tell the module is send a Yes_Or_No request to all peers in the dest
		//Then we close the filelist view and replace it with a sending files view
		appEventEmitter.on('file:send:selected',function(){

			var sendfilesview = new SendingFilesView({ collection : filesCollection });
			filelistview.close();
			$('#fileList').html(sendfilesview.render().el);
			udpLayer.udpEventEmitter.emit('ask_peers_to_confirm',window.GLOBAL_dest,filesCollection.length);

		});

		//When the cancel button is clicked,
		//We simply close the filelist view
		//peerlistview AS : Trivia, i don't think this is neccessary, and probably wasteful
		//Then we reinitalize the app. //this probably makes the closing of peerlist view neccessary
		appEventEmitter.on('file:send:cancelled',function(){

			filelistview.close();
			peerlistview.close();
			appEventEmitter.trigger('app:initialize');

		});
		//when file remove button is clicked, we simply remove the model, from the files collection
		appEventEmitter.on('file:remove',function(model){

			filesCollection.remove(model);
		});
	});
},this);

udpLayer.udpEventEmitter.on('joined',function(peer){ //When someone joins, 

	peers.add(peer);
	var news = peer.hostname + ' has joined ';
	newsFeed(news);

});

udpLayer.udpEventEmitter.on('quit',function(hostname){ //when someone leaves

	var model = peers.where({'hostname': hostname});
	var news = hostname + ' has left ';
	peers.remove(model);
	newsFeed(news);

});

udpLayer.udpEventEmitter.on('YES_OR_NO',function(filelength,senderInfo){ //Yes_Or_No request //to do lots to do here

	appEventEmitter.trigger('confirm_please',filelength,senderInfo);
	appEventEmitter.on('my_choice',function(choice){

		console.log('My response is ', choice);
		udpLayer.udpEventEmitter.emit('peer_has_confirmed',choice,senderInfo);

	});

});

tcpEventEmitter.on('progress:overall',function(filename,host,progress){ //Determining the overall progress

	filesCollection.findWhere({'name' : filename}).set('progress',progress.percentage);

	var freshArray = _.clone(filesCollection.findWhere({'name' : filename}).get('to'));

	var index = _.map(freshArray,function(host){

		return host.address;

	}).indexOf(host.address);

	freshArray[index].progress = progress.percentage;

	if(progress.percentage == 100){

		console.log('The file ' + filename + ' has been successfully sent!');
	}

});

tcpEventEmitter.on('file:received:progress',function(filename,progress){

		//todo tomorrow
		console.log(progress);
});

udpLayer.udpEventEmitter.on('peer_choice_has_arrived',function(choiceObj){

	console.log('The peer ' + choiceObj.hostname + ' has responded with ' + choiceObj.choice );
	if(choiceObj.choice === 'true'){

		var files = filesCollection.toJSON();
		console.log(files);
		console.log('Sending file to ' + choiceObj.hostname );
		tcpEventEmitter.emit('file:send:request',files,[{ 'address' : choiceObj.address, 'platform' : choiceObj.platform }]);
	}else{

		console.log('The peer has declined the files');
		newsFeed('The peer' + choiceObj.hostname + ' has declined files')
		
	}

});

//Initial call to initalize the app, probably should be called from somewhere else.
appEventEmitter.trigger('app:initialize');
newsFeed('You are online');

function newsFeed(news){

	var html = '<center><h5><small>'+ news +'</small></h5></center>';
	$('#newsArea').append(html);

}


