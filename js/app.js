//This is the first module.
//has most of the global and the app event object initialized in this module

var appEventEmitter = {}; //this is the event object // todo make 

_.extend(appEventEmitter,Backbone.Events);


Backbone.View.prototype.close = function(){
	
	this.remove();
	this.unbind();

}

var template = function(id){

	return _.template($(id).html()); 
}

window.GLOBAL_dest = [];

appEventEmitter.on('peer:selected',function(peer){

	GLOBAL_dest.push(peer.toJSON());

});

appEventEmitter.on('peer:unselected',function(peer){

	GLOBAL_dest = _.reject(GLOBAL_dest,function(x){ return x.address === peer.toJSON().address});
	console.log(GLOBAL_dest);

});
