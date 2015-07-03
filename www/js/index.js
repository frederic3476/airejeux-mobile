var map = null;
var token;
var salt;
var httpReq = null;
var latitude;
var longitude;
var zoom = 12;
var perimeter = 0.5;
var api_url = "http://www.airejeux.com/api/";
var watchId = null;
var networkState = navigator.connection.type;
var dateLast = null;
var db;
var ids = [];




var app = {

    old_tab: 4,

    // Application Constructor
    initialize: function() {
        this.initialyseMenu();
        this.bindEvents();

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('resume', app.onResume, false);
        document.addEventListener('pause', app.onPause, false);
        document.getElementById("get-picture").addEventListener("touchend", app.onPictureValidate, false);
        document.getElementById("send_button").addEventListener("touchend", app.onSendData, false);
        document.getElementById("ident_button").addEventListener("touchend", app.onAuthenticate, false);
        document.getElementById("forget_pass").addEventListener("touchend", function (event) {
            window.open('http://www.airejeux.com/resetting/request', '_blank', 'location=yes');
        });
        document.getElementById("register_button").addEventListener("touchend", function () {
            window.open('http://www.airejeux.com/register', '_blank', 'location=yes');
        });
        document.getElementById("add_favorite").addEventListener("touchend", app.addFavorite, false);
        document.getElementById("reload").addEventListener("touchend", app.loadMarkers, false);
        
    },
    onDeviceReady: function () {
        console.log("device ready");
        //navigator.splashscreen.show();
            
        FastClick.attach(document.body);
        
        document.addEventListener("online", app.onLine, false);
        document.addEventListener("offline", app.offLine, false);
        
        //init map
        app.initMap();
        
        httpReq = new plugin.HttpRequest();
        
        window.plugins.nativepagetransitions.globalOptions.duration = 400;
        window.plugins.nativepagetransitions.globalOptions.iosdelay = 10;
        window.plugins.nativepagetransitions.globalOptions.androiddelay = 5;
        window.plugins.nativepagetransitions.globalOptions.winphonedelay = 175;
        window.plugins.nativepagetransitions.globalOptions.slowdownfactor = 8;
        window.plugins.nativepagetransitions.globalOptions.fixedPixelsTop = 64;
        window.plugins.nativepagetransitions.globalOptions.fixedPixelsBottom = 48;

        if (window.localStorage.getItem("login", login) && window.localStorage.getItem("pass", pass)) {
            document.getElementById('login').value = window.localStorage.getItem("login", login);
            document.getElementById('pass').value = window.localStorage.getItem("pass", pass);
        }
        
        //get departements 
        if (networkState === Connection.NONE)
        {
            navigator.notification.alert("Vous n'êtes pas connecté à Internet", function () {
            });

        }
        else {
            app.getDepartFromNetwork();
        }
        
        app.startDb();
        
    },
    
    initMap: function(){
        var map_view = document.getElementById("location-map-preview");
        plugin.google.maps.Map.isAvailable(function (isAvailable, message) {
            if (isAvailable) {
                map = plugin.google.maps.Map.getMap(map_view);
                map.addEventListener(plugin.google.maps.event.MAP_READY, app.onMapReady);
                map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, app.onMapCameraChanged);
                map.addEventListener(plugin.google.maps.event.MAP_CLOSE, function() {
    
                    alert("The map dialog is closed");

                  });
            } else {
                alert("erreur map : " + message);
            }
        });
    },
    
    onLine: function(){
        //app.getDepartFromNetwork();
    },
    
    offLine: function(){
        alert('offline');
        //app.loadMarkers();
    },
    
    onPause: function () {
        console.log('pause');
       /*if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }*/
        map.clear();
    },
    onResume: function () {
        console.log('resume');
        navigator.geolocation.getCurrentPosition(app.onSuccessLocation, app.onErrorLocation, {maximumAge: 0, timeout: 15000, enableHighAccuracy: true});
        /*if (watchId === null) {
            watchId = navigator.geolocation.watchPosition(app.watchSuccess,
                    app.onErrorLocation,
                    {maximumAge: 600000, timeout: 15000, enableHighAccuracy: true});
        }*/

    },
    
    initialyseMenu: function () {
        var menu_items = document.getElementById("menu").querySelectorAll(".item-menu");
        if (!menu_items) {
            alert('pas de menu item');
            return false;
        }

        Array.prototype.forEach.call(
                menu_items, function (item) {
                    item.addEventListener('click', app.onChangeOnglet, false);
                });

    },
    
    startDb: function(){
        db = window.sqlitePlugin.openDatabase({name: "my.db"});

        db.transaction(function(tx) {
          tx.executeSql('CREATE TABLE IF NOT EXISTS aire (id integer primary key, \n\
                        nom text,\n\
                        description text,\n\
                        surface text,\n\
                        longitude float,\n\
                        latitude float,\n\
                        age_min integer,\n\
                        age_max integer,\n\
                        nbr_jeux integer,\n\
                        file_name text,\n\
                        average float)');
      });
      
        app.startDownload();
    },
    
    startDownload: function(){
        if (window.localStorage.getItem("favoris"))
        {
            favoris = window.localStorage.getItem("favoris");
            httpReq.getJSON(api_url + "favoris/list.json?favoris=" + favoris, function (err, data) {
               if (!err){
                       db.transaction(function(tx) {
                           for (var i in data) {
                                tx.executeSql("REPLACE INTO aire (id, nom, description, surface, longitude, latitude, age_min, age_max, nbr_jeux, file_name, average) \n\
                                            VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
                                            [data[i].id, 
                                                data[i].nom, 
                                                data[i].description, 
                                                data[i].surface, 
                                                data[i].longitude, 
                                                data[i].latitude,
                                                data[i].age_min, 
                                                data[i].age_max, 
                                                data[i].nbr_jeux, 
                                                data[i].file_name,
                                                data[i].average], 
                                            function(tx, res){
                                            }, 
                                        function(e) {
                                            alert("ERROR: " + e.message);
                                        });
                                    }
                        });
                   }
                   else{
                       alert('impossible de récupérer les aires de jeux favorites');
                   }
               }); 
            }  
    },
    
    onChangeOnglet: function (item) {
        id = this.id;
        a = id.split("-");
        num = a[1];

        switch (num) {
            case "2":
                if (!sessionStorage.getItem("token")) {
                    navigator.notification.alert("Vous devez être identifié pour ajouter une aire de jeux", function () {
                    });

                    return false;
                }
                ;
                app.onCloseCities();
                break;
            default:
        }

        document.getElementById("content-" + app.old_tab).classList.add("hidden");
        document.getElementById("onglet-" + app.old_tab).classList.remove("actif");

        document.getElementById("content-" + num).classList.remove("hidden");
        document.getElementById("onglet-" + num).classList.add("actif");

        app.old_tab = num;
    },
    onPictureValidate: function () {
        navigator.camera.getPicture(app.onPictureSuccess, app.onPictureFail, {
            quality: 70,
            destinationType: Camera.DestinationType.DATA_URL,
            targetWidth: 500,
            targetHeight: 500,
            saveToPhotoAlbum: false});
    },
    onMapReady: function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(app.onSuccessLocation, app.onErrorLocation, {maximumAge: 0, timeout: 20000, enableHighAccuracy: true});
            if (watchId === null) {
                watchId = navigator.geolocation.watchPosition(app.watchSuccess,
                        app.onErrorLocation,
                        {maximumAge: 1000, timeout: 20000, enableHighAccuracy: true});
            }

        } else {
            navigator.notification.alert("Geolocation is not supported.", function () {
            });
        }
    },
    onMapCameraChanged: function (position) {
        //alert(position.target.lat+"/"+position.target.lng);
        //0/0 then position

        if (zoom - position.zoom > 0.8 && position.target.lat != 0 && position.target.lng != 0
                && position.target.lat != latitude) {
            //|| position.target.lat-latitude>perimeter
            //|| position.target.lat-latitude<perimeter
            //|| position.target.lng-longitude>perimeter
            //|| position.target.lng-longitude<perimeter){
            //alert(position.target.lat-latitude);
            //alert("zoom : "+zoom-position.zoom+" lat :"+position.target.lat-latitude+" lng :"+position.target.lng-longitude);
            map.clear();
            //map.off();
            map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, app.onMapCameraChanged);
            zoom = position.zoom;
            //latitude = position.target.lat;
            //longitude = position.target.lng;
            perimeter = perimeter + ((zoom - position.zoom)*100);
            app.loadMarkers(null);
        }

    },
    onSuccessLocation: function (location) {
        console.log('SUCCESS location');

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;

        //document.getElementById('latitude').value = latitude;
        //document.getElementById('longitude').value = longitude;

        var MyLocation = new plugin.google.maps.LatLng(latitude, longitude);
        map.setOptions({'backgroundColor': 'white',
            'mapType': plugin.google.maps.MapTypeId.ROADMAP,
            'controls': {
                'compass': true,
                'myLocationButton': true
            },
            'gestures': {
                'zoom': true,
                'scroll': true,
                'rotate': false
            },
            'camera': {
                'latLng': MyLocation,
                'zoom': 14
            }
        });
        app.loadMarkers(null);

    },
    onErrorLocation: function (error) {
        var info = "Erreur lors de la géolocalisation : ";
        switch (error.code) {
            case error.TIMEOUT:
                info += "Timeout !";
                break;
            case error.PERMISSION_DENIED:
                info += "Vous n’avez pas donné la permission";
                break;
            case error.POSITION_UNAVAILABLE:
                info += "La position n’a pu être déterminée";
                break;
            case error.UNKNOWN_ERROR:
                info += "Erreur inconnue";
                break;
        }
        navigator.notification.alert(info, function () {
        });
    },
    watchSuccess: function (location) {
        //alert(latitude + "/" + longitude);


        var now = new Date();
        var heure = now.getHours();
        var minute = now.getMinutes();
        var seconde = now.getSeconds();
        //alert("watch :"+heure+" heure "+minute+" minutes "+seconde+" secondes");
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;


        document.getElementById('latitude').value = latitude;
        document.getElementById('longitude').value = longitude;
        
        /*map.addMarker({
            'position': new plugin.google.maps.LatLng(latitude, longitude),
            'title': 'Votre position'
          }, function(marker) {
            marker.showInfoWindow();
          });*/
        
        //app.loadMarkers();

        //navigator.geolocation.clearWatch(watchId);
    },
    watchError: function (error) {
        alert('WATCH code: ' + error.code + '\n' +
                'message: ' + error.message + '\n');
    },
    onPictureSuccess: function (imageURI) {
        var image = document.getElementById('myImage');
        image.src = "data:image/jpeg;base64," + imageURI;
        document.getElementById('img64').value = imageURI;
    },
    onPictureFail: function (message) {
        navigator.notification.alert('Failed because: ' + message, function () {
        });
    },
    onAuthenticate: function () {
        window.localStorage.removeItem("login", login);
        window.localStorage.removeItem("pass", pass);
        var login = document.getElementById('login').value;
        var pass = document.getElementById('pass').value;
        if (document.getElementById('remember').checked) {
            window.localStorage.setItem("login", login);
            window.localStorage.setItem("pass", pass);
        }
        document.getElementById('spinner').classList.remove("hidden");
        if (login === '' || pass === '') {
            navigator.notification.alert("Veuillez rentrer un login et un mot de passe !", function () {
                document.getElementById('spinner').classList.add("hidden");
            });
            return false;
        }
        httpReq.getJSON(api_url + "users/" + login, function (err, data) {
            if (!err) {
                salt = data.salt;
                httpReq.post(api_url + "tokens", {
                    username: login,
                    password: pass,
                    salt: salt
                }, function (err, data) {
                    var msg = "";
                    if (data) {
                        var str = data.replace('"', '');
                        str = str.split('||');
                        digest = str[0];
                        nonce = str[1];
                        created = str[2];
                        token = "UsernameToken Username=\"" + login + "\", PasswordDigest=\"" + digest + "\", Nonce=\"" + nonce + "\", Created=\"" + created + "\"";
                        sessionStorage.setItem("token", token);
                        app.makeToast("Identification correcte");
                    }
                    else {
                        navigator.notification.alert("ERREUR Identification", function () {
                        });
                    }
                }
                );
            }
            else {
                navigator.notification.alert("Identifiant inconnu", function () {
                });
            }

            document.getElementById('spinner').classList.add("hidden");
        });
    },
    onSendData: function () {
        document.getElementById('spinner').classList.remove("hidden");
        var data = {
            nom: document.getElementById('nom').value,
            ville_str: document.getElementById('ville').value,
            description: document.getElementById('description').value,
            surface: document.getElementById('surface').value,
            longitude: (document.getElementById('longitude_precise').value!=""?document.getElementById('longitude_precise').value:document.getElementById('longitude').value),
            latitude: (document.getElementById('latitude_precise').value!=""?document.getElementById('latitude_precise').value:document.getElementById('latitude').value),
            age_min: document.getElementById('age_min').value,
            age_max: document.getElementById('age_max').value,
            nbr_jeux: document.getElementById('nbr_jeux').value,
            img64: document.getElementById('img64').value
        };
        token = sessionStorage.getItem("token");

        cordovaHTTP.post(api_url + "aires", data, {"X-WSSE": token}, function (response) {
            //app.makeToast('Aire ajoutée avec succés');
            document.getElementById('spinner').classList.add("hidden");
            
            //back to the map
            document.getElementById("content-2").classList.add("hidden");
            document.getElementById("onglet-2").classList.remove("actif");

            document.getElementById("content-1").classList.remove("hidden");
            document.getElementById("onglet-1").classList.add("actif");

            app.old_tab = 1;
            
            map.addMarker({
                                'position': new plugin.google.maps.LatLng(latitude, longitude),
                                'title': "NEW !!! \n"+data.nom,
                                'icon': 'http://www.airejeux.com/bundles/applisunairejeux/images/playground-3.png',
                                'animation': plugin.google.maps.Animation.BOUNCE
                            }, function (marker) {
                                marker.showInfoWindow();
                                console.log("new marker : " + marker.title);
                            });
            

        }, function (response) {
            navigator.notification.alert(parseJsonResponse(response.error), function () {
            });
            document.getElementById('spinner').classList.add("hidden");
        });
    },
    loadMarkers: function (evt) {
        if (evt !== null) evt.preventDefault();
        map.clear();
        ids = [];
        document.getElementById('spinner').classList.remove("hidden");
        /*if (networkState !== Connection.NONE)
        {
            httpReq.getJSON(api_url + "near?latitude=" + latitude + "&longitude=" + longitude + "&perimeter=" + perimeter,
                    function (status, data) {
                        for (var i in data) {
                            map.addMarker({
                                'position': new plugin.google.maps.LatLng(data[i].latitude, data[i].longitude),
                                'title': data[i].nom,
                                'playground_id': data[i].id,
                                'icon': 'http://www.airejeux.com/bundles/applisunairejeux/images/playground.png',
                                'animation': plugin.google.maps.Animation.BOUNCE,
                                'snippet': (data[i].average ? data[i].average + "/5" : "")
                            }, function (marker) {
                                marker.showInfoWindow();
                                console.log("add marker : " + marker.title);
                                marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function () {
                                    map.remove();
                                    if (watchId != null)
                                        navigator.geolocation.clearWatch(watchId);
                                    app.showPlayground(marker.get("playground_id"));
                                });
                            });
                        }
                        document.getElementById('spinner').classList.add("hidden");
                    }
            );
        }
        else{*/
        //get playground from bd
            db.transaction(function(tx) {
                tx.executeSql("select * from aire where aire.latitude between "
                                +(latitude-perimeter)+" and "+(latitude+perimeter)+" and aire.longitude between "
                                + (longitude-perimeter)+" and "+(longitude+perimeter),
                                [],
                                function(tx, res) {
                                    for(var i = 0; i < res.rows.length; i++){
                                        ids.push(res.rows.item(i).id);
                                        //alert(res.rows.item(i).nom);
                                        map.addMarker({
                                            'position': new plugin.google.maps.LatLng(res.rows.item(i).latitude, res.rows.item(i).longitude),
                                            'title': res.rows.item(i).nom,
                                            'playground_id': res.rows.item(i).id,
                                            'icon': 'http://www.airejeux.com/bundles/applisunairejeux/images/playground.png',
                                            'snippet': (res.rows.item(i).average ? res.rows.item(i).average + "/5" : "")
                                        }, function (marker) {
                                            marker.showInfoWindow();
                                            console.log("add marker : " + marker.title);
                                            marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function () {
                                                if (watchId != null)
                                                    navigator.geolocation.clearWatch(watchId);
                                                app.showPlayground(marker.get("playground_id"));
                                            });
                                        });
                                    }     
                                }); 
            });
            //document.getElementById('spinner').classList.add("hidden");
            
            //get playground from network
            httpReq.getJSON(api_url + "near?latitude=" + latitude + "&longitude=" + longitude + "&perimeter=" + perimeter,
                    function (status, data) {
                        for (var i in data) {
                            if (ids.inArray(data[i].id) === -1 && typeof data[i].id != 'undefined'){
                                //alert(ids + '/'+data[i].id+'add from net');
                                map.addMarker({
                                    'position': new plugin.google.maps.LatLng(data[i].latitude, data[i].longitude),
                                    'title': data[i].nom,
                                    'playground_id': data[i].id,
                                    'icon': 'http://www.airejeux.com/bundles/applisunairejeux/images/playground.png',
                                    'animation': plugin.google.maps.Animation.BOUNCE,
                                    'snippet': (data[i].average ? data[i].average + "/5" : "")
                                }, function (marker) {
                                    marker.showInfoWindow();
                                    console.log("add marker : " + marker.title);
                                    marker.addEventListener(plugin.google.maps.event.INFO_CLICK, function () {
                                        if (watchId != null)
                                            navigator.geolocation.clearWatch(watchId);
                                        app.showPlayground(marker.get("playground_id"));
                                    });
                                });
                            }
                        }
                        document.getElementById('spinner').classList.add("hidden");
                    }
            );
        //}
    },
    onCloseCities: function () {
        map.getMyLocation(function(location){
            document.getElementById('latitude_precise').value = location.latLng.lat;
            document.getElementById('longitude_precise').value = location.latLng.lng;
        }, 
        function(msg){
            console.log("Erreur: " + msg);
        });
        var close_city = document.getElementById('ville');
        close_city.options.length = 0;
        httpReq.getJSON(api_url + "close/city.json?latitude=" + latitude + "&longitude=" + longitude,
                function (status, data) {
                    var opt = document.createElement('option');
                    opt.value = "";
                    opt.text = "Choisir une ville proche...";
                    close_city.options.add(opt);
                    for (var i in data) {
                        var opt = document.createElement('option');
                        opt.value = data[i].nom + "|" + data[i].code;
                        opt.text = data[i].nom;
                        if (typeof data[i].nom != 'undefined') close_city.options.add(opt);
                    }
                });
    },
    showPlayground: function (id) {
        //map.close();
        sessionStorage.setItem("playground_id", id);
        
        document.getElementById("content-1").classList.add("hidden");
        document.getElementById("onglet-1").classList.remove("actif");

        document.getElementById("content-5").classList.remove("hidden");
        document.getElementById("onglet-5").classList.add("actif");

        app.old_tab = 5;
        
        app.playground.show();
        
    },
    getDepartFromNetwork: function () {
            httpReq.getJSON(api_url + "departement/list", function (err, data) {
            if (!err) {
                app.makeListDepart(data);
            }
            else {
                app.makeToast("Erreur de récupération des données");
            }
        });
    },
    makeListDepart: function (data) {
        var tab = [];
        if (window.localStorage.getItem("favoris"))
        {
            tab = window.localStorage.getItem("favoris").split("|");
        }

        main_div = document.getElementById("depart_list");
        for (var i in data) {
            if (typeof data[i].nom!='undefined'){
                var div = document.createElement('div');
                div.classList.add('depart');
                ref = (data[i].value === "0"?"aucune aire référencée":data[i].value+" aires référencées");
                checked = (tab.indexOf("" + data[i].id) != -1 ? " checked=\"checked\"" : "");
                div.innerHTML = "<span class=\"depart_nom\">" + data[i].nom + " - "+data[i].code+"</span> " + ref + "<input value=\"" + data[i].id + "\" id=\"depart[" + data[i].id + "]\" type=\"checkbox\"" + checked + " class=\"check_favorite\" />";

                main_div.appendChild(div);
            }
        }
    },
    addFavorite: function () {
        document.getElementById('spinner').classList.remove("hidden");
        var check_items = document.getElementById("depart_list").querySelectorAll("div>input[type='checkbox']:checked");
        var total = "";
        Array.prototype.forEach.call(
                check_items, function (item) {
                    num = item.value;
                    total += num + "|";

                });

        if (window.localStorage.getItem("favoris"))
        {
            window.localStorage.removeItem("favoris");
        }
        window.localStorage.setItem("favoris", total);
        app.startDownload();
        app.makeToast("Départements ajoutés avec succés");
        document.getElementById('spinner').classList.add("hidden");
    },
    makeToast: function (msg) {
        window.plugins.toast.showLongCenter(msg,
                function (a) {
                    console.log('toast success: ' + a);
                },
                function (b) {
                    console.log('erreur: ' + b);
                });
    }

};

app.initialize();