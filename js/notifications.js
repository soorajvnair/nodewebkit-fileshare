appEventEmitter.on('confirm_please',function(filelength,senderInfo){

	var options = {

		type : 'text',
		title : 'Receive files?',
		message : 'Want to receive ' + filelength + ' files from' + senderInfo.address,
		buttonPrimary : 'Yes',
		buttonSecondary : 'No'

	}

	window.DEA.notifications.create(options,function(target){

		            // Possible Events
            switch (target) {
                case 'closer':
                    console.log('The notification is closed!');
                    break;
                case 'title':
                    break;
                case 'description':
                    break;
                case 'icons':
                    break;
                case 'gallery-image':
                    break;
                case 'gallery-image title':
                    break;
                case 'button primary':
                    appEventEmitter.trigger('my_choice',true);
                    console.log('Hey')
                    break;
                case 'button secondary':
                    appEventEmitter.trigger('my_choice',false);
                    break;
                default:
                    break;
            }

	});

});