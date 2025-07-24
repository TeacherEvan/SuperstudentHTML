self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('superstudent-v1').then(function(cache) {
            return cache.addAll([
                '/',
                '/css/styles.css',
                '/js/main.js',
                '/assets/fonts/',
                '/assets/sounds/'
            ]);
        })
    );
});