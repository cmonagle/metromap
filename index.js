import {
    getCityBbox,
    distance,
    bboxToViewBox,
    getBboxFromCoordinates
} from './lib.js';
import {
    TransitLand
} from './apis.js';

import Line from './Line.js';
import Circle from './Circle.js';
import {
    DISTANCE_THRESHOLD
} from './constants.js';

export default async function main() {
    const city = window.location.hash.replace('#', '');

    const cityBbox = await getCityBbox(city);

    const routeData = await TransitLand('routes', {
        per_page: 20,
        bbox: `${cityBbox}`,
        vehicle_type: '0,1'
    });
    console.info('Route data', routeData);

    const stopData = await TransitLand('stops', {
        served_by: routeData.features.map(ft => ft.id).join(','),
        per_page: 9999,
        bbox: `${cityBbox}`,
    });
    console.info('Stop data', stopData);

    const Stops = stopData.features.reduce((points, point) => {
        const circle = new Circle(point);
        // if it's not way too close to another, add it
        if (!points.find(circle2 =>
                distance(circle.getCartesianCoordinates(cityBbox), circle2.getCartesianCoordinates(cityBbox)) < DISTANCE_THRESHOLD)) {
            points.push(circle);
        }
        return points;
    }, []);
    console.info('Stops', Stops);
    const stopPoints = Stops.map(Stop => Stop.getCoordinates());

    // Rejig coordinate space to actual content
    const bbox = getBboxFromCoordinates(stopPoints);

    const svg = document.querySelector('svg');
    svg.setAttribute('viewBox', bboxToViewBox(bbox));

    const Lines = routeData.features
        .map(route => new Line(route))
        // .forEach(Line => ); //&& svg.appendChild(Line.createNode(bbox)));

    Lines.forEach(Line => {
        Line.getStopsOnLine(Stops, bbox);
        Line.routeStops.forEach(Stop => {
            Stop.straightenOut();

            Stop.createLineNodes(bbox).forEach(node => {
                svg.appendChild(node);
            });
     
        })
    })
    Stops.forEach(Stop => {

    });
    Stops.forEach(Stop => {
        svg.appendChild(Stop.createNode(bbox));
    })



}

main();