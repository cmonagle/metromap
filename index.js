import {
    getCityBbox,
    distance,
    bboxToViewBox,
    getBboxFromCoordinates,
    getAllPointsFromLines,
    getParamsFromUrl
} from './lib.js';
import {
    TransitLand
} from './apis.js';

import Line from './Line.js';
import Circle from './Circle.js';
import {
    DISTANCE_THRESHOLD, SVG_NS
} from './constants.js';

export default async function main() {
    
    const {
        city,
        modes,
        showStops
    } = getParamsFromUrl(window.location.href)

    if (!city) {
        return null;
    }

    const loader = document.querySelector('.loader')
    document.querySelector('form').classList.add('hidden');
    loader.classList.remove('hidden');

    
    const cityBbox = await getCityBbox(city);
    let bbox = cityBbox;
    let Stops;

    const routeData = await TransitLand('routes', {
        per_page: 100,
        bbox: `${cityBbox}`,
        vehicle_type: modes // Extended route types
    });
    console.info('Route data', routeData);

    const stopData = await TransitLand('stops', {
        served_by: routeData.features.map(ft => ft.id).join(','),
        per_page: 9999,
        bbox: `${cityBbox}`,
    });
    console.info('Stop data', stopData);

    Stops = stopData.features.reduce((points, point) => {
        const circle = new Circle(point);
        const coordinates = circle.getCartesianCoordinates(cityBbox);
        // if it's not way too close to another, add it
        if (!points.find(p2 =>
            distance(coordinates, p2.getCartesianCoordinates(cityBbox)) < DISTANCE_THRESHOLD)
        ) {
            points.push(circle);
        }
        return points;
    }, []);

    const Lines = routeData.features
        .map(route => new Line(route, Stops));
    console.info('Lines', Lines);


    // Rejig coordinate space to actual content
    const stopPoints = Stops.map(Stop => Stop.getCoordinates());
    bbox = getBboxFromCoordinates(stopPoints);


    const svg = document.querySelector('svg');
    svg.setAttribute('viewBox', bboxToViewBox(bbox));

    Lines.forEach(Line => svg.appendChild(Line.createNode(bbox)));

    if (showStops) {
        Stops.forEach(Stop => {
            svg.appendChild(Stop.createNode(bbox));
        })
    }
    loader.classList.add('hidden');
}

main();