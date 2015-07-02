//var api_url = "http://www.airejeux.com/api/";
var id;
var httpReq_play;
var url_img = "http://www.airejeux.com/uploads/aires/";
var image;

app.playground = {
    elems: {
		titre: document.getElementById("titre"),
                description: document.getElementById("description"),
                surface: document.getElementById("surface"),
                age: document.getElementById("age"),
                nbr: document.getElementById("nbr"),
                playground_img: document.getElementById("playground_img"),
                note: document.getElementById("note")
	},
        
        initialize: function () {
            //httpReq_play = new plugin.HttpRequest();
            document.addEventListener('deviceready', this.onDeviceReady, false);
            if (!sessionStorage.getItem("playground_id"))
            {
                alert('erreur');
            }
            else{
            id = sessionStorage.getItem("playground_id");
            
            document.getElementById("goto-map").addEventListener("touchend", function(){
                                                                window.plugins.nativepagetransitions.flip({
                                                                "href" : "index.html"
                                                                });
                                                            }, 
                                                            false);
            //document.getElementById("comment_show").addEventListener("click", app.playground.showComments, false);
            document.getElementById("button_vote").addEventListener("touchend", app.playground.vote, false);
            document.getElementById("button_comment").addEventListener("touchend", app.playground.comment, false);
            document.getElementById("favorite").addEventListener("touchend", app.playground.addFavorite, false);
            document.getElementById("footer_vote").addEventListener("touchend", function(){
                document.getElementById("screen_vote").classList.remove('off-screen');
            }, false);
            /*document.getElementById("footer_comment").addEventListener("click", function(){
                document.getElementById("screen_comment").classList.remove('off-screen2');
            }, false);*/
            }
              
        },
        
        onDeviceReady: function() {
            FastClick.attach(document.body);
            httpReq_play = new plugin.HttpRequest();
            app.playground.show();
        },
        
        show: function(){
            document.getElementById('spinner').classList.remove("hidden");
            httpReq_play.getJSON(api_url+"playgrounds/"+id, 
                function(status, data) {
                    //alert(data.comments);
                    if (data.file_name)
                    {
                        app.playground.elems.playground_img.src = url_img+data.file_name;
                    }
                    else{
                       if (sessionStorage.getItem("token"))
                       { 
                           app.playground.elems.playground_img.addEventListener("touchend", app.playground.changePicture, false); 
                       }
                    }
                    
                    app.playground.elems.titre.innerHTML = data.nom;
                    app.playground.elems.description.innerHTML = data.description;
                    app.playground.elems.surface.innerHTML = "Surface : "+(data.surface?data.surface:"NC");
                    app.playground.elems.age.innerHTML = "Age : de "+data.age_min+" à "+data.age_max+" ans";
                    app.playground.elems.nbr.innerHTML = "Nombre de jeux: "+data.nbr_jeux;
                    if (data.average) {app.playground.showNote(data.average);}
                    app.playground.addVoteSystem();
                    
                    app.playground.addComments(data.comments);
                    //alert('toto');
                    
                });
            document.getElementById('spinner').classList.add("hidden");
            document.getElementById('app-playground').classList.remove("hidden");    
        },
        
        showNote: function(average){
            for (i=0.5;i<=5;i+=0.5){
                if (i-0.25<=average){
                    document.getElementById('note-'+i).classList.remove('empty');
                    document.getElementById('note-'+i).classList.add('full');
                }
            }
        },
        
        addVoteSystem: function(){
            if (sessionStorage.getItem("token")){
                token = sessionStorage.getItem("token");
                document.getElementById("vote_data").classList.remove('hidden');
            }
        },
        
        addComments: function(data){
            
            for (i in data){
                
                var main_div = document.createElement('div');
                document.getElementById('comments').appendChild(main_div);
                main_div.classList.add('panel');
                var header_div = document.createElement('div');
                header_div.classList.add('panel-heading');
                header_div.innerHTML = "Par "+data[i].user.username+" <span class=\"comment_date\">"+data[i].created_at+"</span>";
                var body_div = document.createElement('div');
                body_div.classList.add('panel-body');
                body_div.innerHTML = data[i].texte;
                
                main_div.appendChild(header_div);
                main_div.appendChild(body_div);
            }
        },
       
        showComments: function (){
            this.classList.add('hidden');
            document.getElementById("comments").classList.remove('hidden');
        },
        
        vote: function(){
            var data = {
                score: document.getElementById("select_note").value,
                aire_id: id
            };
            cordovaHTTP.post(api_url+"votes", data,{"X-WSSE": token}, function(response) {
              app.makeToast('Vous avez voté avec succès !');
              app.playground.show();
          
          }, function(response) {
                navigator.notification.alert(response.error, function(){});
          });
        },
        
        comment: function(){
            var data = {
                texte: document.getElementById("comment").value,
                aire_id: id
            };
            cordovaHTTP.post(api_url+"comments", data,{"X-WSSE": token}, function(response) {
              app.makeToast('Vous avez commenté avec succès !');
              app.playground.show();
          
          }, function(response) {
                navigator.notification.alert(response.error, function(){});
          });
        },
        
        addFavorite: function () {
        if (this.classList.contains('grise')) {
            this.classList.remove('grise');
            this.classList.add('rouge');
            app.makeToast('Ajouté aux favories !');
        }
        else {
            this.classList.remove('rouge');
            this.classList.add('grise');
            app.makeToast('Supprimer des favories !');
        }
                
        },
        
        changePicture: function() {
            navigator.camera.getPicture(app.playground.onPictureSuccess, app.playground.onPictureFail, {
            quality: 70,
            destinationType: Camera.DestinationType.DATA_URL,
            targetWidth: 500,
            targetHeight: 500,
            saveToPhotoAlbum: false});
        },
        
        onPictureSuccess: function (imageURI) {
            image = imageURI;
            app.playground.elems.playground_img.src = "data:image/jpeg;base64," + imageURI;
            navigator.notification.confirm('Envoyer la photo ?', app.playground.onConfirmPicture, 'Conformation', ['oui', 'non']);
        },
        
        onPictureFail: function (message) {
            //navigator.notification.alert('Failed because: ' + message, function () {
            //});
        },
        
        onConfirmPicture: function(buttonIndex){
            if (buttonIndex === 1 )
            {
                console.log('changement photo');
                var data = {
                img64: image,
                aire_id: id
                    };
                    cordovaHTTP.post(api_url+"uploads/pictures.json", data,{"X-WSSE": token}, function(response) {
                      app.makeToast('Photo envoyé avec succés');
                      app.playground.show();

                  }, function(response) {
                        navigator.notification.alert(response.error, function(){});
                  });
            }
            else{
                app.playground.elems.playground_img.src = "img/imagedefaut.png";
            }
        }
        
}

app.playground.initialize();


