'use strict'
console.log('Loaded map.js')
mapboxgl.accessToken = 'pk.eyJ1Ijoib3l5YyIsImEiOiJjam43dzZqYjIwM3RvM3FwZjg2emVmeXFnIn0.r4AOJghdRp7zMMppmH58aQ'
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/oyyc/cjo2buh789qrm2sn0wlceegsl',
    center: [-73.96216,40.80779],
    zoom: 14
})
let navigation = new mapboxgl.NavigationControl({
    showCompass: false
})
map.addControl(navigation, 'top-left')
let scale = new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'imperial'
})
map.addControl(scale, 'bottom-right')
let geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserLocation: true,
    fitBoundsOptions: {
    }
})
map.addControl(geolocate, 'top-left')

//part1 location
// create a variable to keep track of the user's current location
// we're going to initialize it to the default center of the map
let current_location = [-73.96216, 40.80779]

// update the variable whenever a geolocation event fires
geolocate.on('geolocate', function(event) {
    current_location = [event.coords.longitude, event.coords.latitude]
    console.log('geolocated', current_location) 
    if (active) {                           // if we're drawing
        path.push(current_location)         // add the current location to the path
        map.getSource('drawing').setData(geojson)   // update the layer because the path has changed
    }
    
})
    
// for testing purposes, also update the variable whenever you click on the map
map.on('click', function(event) {
    current_location = [event.lngLat.lng, event.lngLat.lat]
    console.log('clicked', current_location)     
    if (active) {                           // if we're drawing
        path.push(current_location)         // add the current location to the path
        console.log(path)                   // ...and for testing purposes, log the path so far to the console.
        map.getSource('drawing').setData(geojson)   // update the layer because the path has changed
    }

})

//part2 drawing
// variable which references the HTML button element
let draw_btn = document.getElementById('draw_btn')

// a handler that is called when the button is clicked
draw_btn.addEventListener('click', function() {
    // print something in the console to test
    console.log('clicked draw_btn')  
    if (active) {            // if we're already drawing, stop drawing
        stopDrawing()
    } else {                    // otherwise, start drawing
        startDrawing()
    }
})


// keeps track of whether or not we're drawing

let active = false
let start_marker = new mapboxgl.Marker()    
let path = []   
let geojson = {
    "type": "FeatureCollection",
    "features": []
}
let db = new DB()

function startDrawing() {

    active = true
    draw_btn.style['background-color'] = "red"         // make the button red
    draw_btn.style['color'] = "white"                  // make it's text white
    draw_btn.value = 'Stop to calculate the distance'                   // change the text to the opposite state
    
    start_marker.setLngLat(current_location)
    start_marker.addTo(map) 
    path.push(current_location)
    
    geojson.features.push({                     // add a new feature to the geojson
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": path                 // the coordinates of this feature are our path array
        }
    })    
    map.getSource('drawing').setData(geojson)   // update the drawing layer with the latest geojson
}

function stopDrawing() {

    active = false

    draw_btn.style['background-color'] = "white"      // make the button white again
    draw_btn.style['color'] = "black"                 // make the text black
    draw_btn.value = 'Start to keep recording'                          // change the text
    let distance = turf.length(geojson)
    document.getElementById('info').innerHTML = 'Distance you have travel today is:'+distance.toFixed(3)+'km'
    db.insert(path)                         // insert the path into the database
    path = []                               // reset the path
}
   
//show the path
map.on('load', function() {             // 'load' event handler
    map.addLayer({                      // add a layer
        'id': 'drawing',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': null
        },
        'layout': {
            'line-cap': 'round',
            'line-join': 'round'
        },
        'paint': {
            'line-color': '#B22222',
            'line-width': 5,
            'line-opacity': .8
        }
    })
    // get the previously created paths from the database and add them as features
    db.get(function(data) {
        for (let item of data) {
            if (!item.path) continue
            geojson.features.push({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": item.path
                }
            })
            map.getSource('drawing').setData(geojson)
        }
    })
})


