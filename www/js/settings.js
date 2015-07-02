app.settings = {
    elems: {
		perimeter: document.getElementById("perimeter")
	},
        
        initialize: function () {
            document.getElementById("back-index").addEventListener("click", function(){
                                                                window.plugins.nativepagetransitions.flip({
                                                                "href" : "index.html"
                                                                });
                                                            }, 
                                                            false);
            
            app.settings.elems.perimeter.addEventListener("input", function () {
		
		}, false);
        }
}

app.settings.initialize();


