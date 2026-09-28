const CACHE_NAME = "golf-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest"
];


/* =========================================================
   INSTALACION
   ========================================================= */

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))

  );

  self.skipWaiting();
});


/* =========================================================
   ACTIVACION
   ========================================================= */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys =>

        Promise.all(

          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))

        )

      )

  );

  self.clients.claim();
});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener("fetch", event => {

  if(event.request.method !== "GET"){
    return;
  }


  /*
     Para index.html usamos NETWORK FIRST.

     Esto es importante porque cuando subas una
     nueva versión a GitHub, el teléfono intentará
     primero obtener la versión nueva.
  */

  if(
    event.request.mode === "navigate" ||
    event.request.url.endsWith("/index.html")
  ){

    event.respondWith(

      fetch(event.request)
        .then(response => {

          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, copy);
            });

          return response;

        })
        .catch(() => {

          return caches.match("./index.html");

        })

    );

    return;
  }


  /*
     Para los demás archivos:

     primero intenta la red y, si no hay conexión,
     usa la copia guardada.
  */

  event.respondWith(

    fetch(event.request)
      .then(response => {

        if(response && response.ok){

          const copy = response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, copy);
            });

        }

        return response;

      })
      .catch(() => {

        return caches.match(event.request);

      })

  );

});