//Peer.js contains Model for single peer, it's collection
//Views for single peer, peerlistview.
//Stability : Stable
//Review done on 27th July 11:19 PM
//Bugs none


var Peer = Backbone.Model.extend({  //Peer Model

	defaults : {
		
		'hostname' : '',
		'selected' : false,
		'progress' : 0,
		'platform' : ''
	}

});

appEventEmitter.on('peer:selected',function(model){ //Listens for the event when a peer is selected

	model.set('selected',true);

});

appEventEmitter.on('peer:unselected',function(model){ //Listens for the event when a peer is unselected

	model.set('selected',false);

});


var Peers = Backbone.Collection.extend({ //Collection of peer models

	model : Peer

});



var PeerView = Backbone.View.extend({ //view for a single peer

	template : template('#peerListTemplate'),
	tagName : 'button',
	className : 'btn btn-default peerList',
	events : {

		'click' : 'selected'

	},
	initialize : function(){

		this.listenTo(this.model, 'remove', this.removePeer);

	},
	render : function(){

		this.$el.html(this.template(this.model.toJSON()));
		return this;

	},
	removePeer : function(){

		console.log(this.$el);
		this.$el.remove();		
	},
	selected : function(){

		this.$el.toggleClass('btn-success');
		if(this.model.get('selected') == false){

			appEventEmitter.trigger('peer:selected',this.model);

		}else{

			appEventEmitter.trigger('peer:unselected',this.model);
		}
		
	}

});

var PeerListView = Backbone.View.extend({ //view for the list of peers

	tagName : 'ul',
	id : 'peers',
	className : 'peerUl',

	initialize : function(){

		this.render();
		this.listenTo(this.collection,'add',this.addPeer);

	},
	render : function(){

		console.log(this.el);
		this.collection.each(function(peer){

			var newPeerView = new PeerView({ model : peer});
			this.$el.append(newPeerView.render().el);

		},this);

		return this;

	},
	addPeer : function(model){

		console.log(model);
		var newView = new PeerView({ model : model });
		this.$el.append(newView.render().el);
	}

});

