const TRANSITLAND_BASE_URL = 'https://transit.land/api/v1/';
const SVG_NS = 'http://www.w3.org/2000/svg';
const BBOX = [
//     // Montreal just metro
    -73.800000, 45.400000,
    -73.400000, 45.600000
//     // Montreal inc suburbs
//     // -74.200000, 45.300000,
//     // -73.100000, 45.700000
];

function collectStops(polyline, stops, id) {
    const length = polyline.getTotalLength();
    let routeStops = [];

    for (let i = 0; i < length; i++) {
        // Loop through all of them at every point inand get them in order
        const { x,y } = polyline.getPointAtLength(i);

        const stopsOnLine =
            stops.filter(stop =>
                distance(stop.coordinates, [x, y]) < 2 // Close to the line
                && !routeStops.some(stp => stp.name === stop.name) // Not already in the array
                && stop.routes.find(rteId => rteId === id) //  Stop is serviced by this route
            );

        routeStops = routeStops.concat([], stopsOnLine);
    }

    return routeStops;
};



async function main() {
    const city = window.location.hash.replace('#', '');

    const bbox = await getCityBbox(city);
    console.info(`${city} bbox`, bbox, BBOX);

    // if window.location.
    const routeData = await TransitLand('routes', {
        per_page: 20,
        bbox: `${bbox}`,
        vehicle_type: '0,1'
    });
    console.info('Route data', routeData);

    const stopData = await TransitLand('stops', {
        served_by: routeData.features.map(ft => ft.id).join(','),
        per_page: 9999,
        bbox: `${bbox}`
    });
    console.info('Stop data', stopData);

    const stops = stopData.features.reduce((points, point) => {
        const coords = getCartesianCoordinates(point.geometry.coordinates, bbox);

        // if it's not way too close to another, add it
        if (!points.find(({coordinates}) => distance(coordinates, coords) < 5)) {
            const circle = document.createElementNS(SVG_NS, 'circle');
            circle.setAttribute('r', '2');
            circle.setAttribute('cx', coords[0]);
            circle.setAttribute('cy', coords[1]);
            points.push({
                name: point.properties.name,
                routes: point.properties.routes_serving_stop.map(route => route.route_onestop_id),
                coordinates: coords,
                circle
            });
        }
        return points;

    }, []);

    const routes = routeData.features.map(route => {

        // Taking the first one as it appears the two correspond with each direction
        const mapPoints = route.geometry.coordinates[0].map(points => getCartesianCoordinates(points,bbox));

        const polyline = document.createElementNS(SVG_NS, 'polyline');
        polyline.setAttribute("points", mapPoints.join(' '));
        polyline.setAttribute("stroke", `#${route.properties.tags.route_color}`);
        polyline.setAttribute('name', route.properties.name)

        const id = route.id;
        const associatedStops = collectStops(polyline, stops, id);


        // Now adjust the line to 45 deg angles
        for (let i = 0; i < associatedStops.length; i++) {

            if (i === associatedStops.length - 1) {
                continue;
            }

            let thisStop = associatedStops[i];
            let nextStop = associatedStops[i + 1];
            let angle = angleAndDegreesFromCoordinates(thisStop.coordinates, nextStop.coordinates);
        }
        return {
            id,
            associatedStops,
            route,
            mapPoints,
            polyline
        };
    });

    // Render
    const svg = document.querySelector('svg');

    routes.forEach(route => svg.appendChild(route.polyline));
    stops.forEach(point => svg.appendChild(point.circle));
    svg.setAttribute('viewBox', `${bboxToViewBox(bbox)}`);


}

main();