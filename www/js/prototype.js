function sanitize(str){
    return str.replace('/\u00e9', 'é').replace('/\u00e0', 'à').replace('/\u00ea', 'ê');
}

function parseJsonResponse(str){
    var response = '';
    var valeur = '';
    JSON.parse(str, function(index, value){
        if (index !== "0" && index !==""){
            if (valeur !== ''){
                response += index + ":" +  valeur+ "\n";
                valeur = value;
            }
        }
        else{
            valeur = value;
        }
        
    });
    return response;
};

Array.prototype.inArray = function(valeur) {
	for (var i in this) { if (this[i] === valeur) return i; }
	return -1;
};

String.prototype.transformUTCDate = function(){
    a = this.split('T');
    result = a[0].split('-');
    return a[0];
};