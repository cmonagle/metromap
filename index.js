import {
    TransitLand,
    getCityBbox,
    distance,
    getOffset,
    getCartesianCoordinates,
    adjustForSvg
} from './lib.js';

import Line from './line.js';
import Circle from './circle.js';

export default async function main() {
    const city = window.location.hash.replace('#', '');

    const {north, east, south, west} = await getCityBbox(city);
    const offset = getOffset(
        [[west, south]],
        [east, north]
    );
    console.info('City Bbox', offset);
    
    const routeData = await TransitLand('routes', {
        per_page: 20,
        bbox: `${[west,south,east,north]}`,
        vehicle_type: '0,1'
    });
    console.info('Route data', routeData);

    const stopData = await TransitLand('stops', {
        served_by: routeData.features.map(ft => ft.id).join(','),
        per_page: 9999,
        bbox: `${[west,south, east,north]}`,
    });
    console.info('Stop data', stopData);

    const Stops = stopData.features.reduce((points, point) => {
        const circle = new Circle(point);

        // if it's not way too close to another, add it
        if (
            !points.find(circle2 => distance(circle.getCartesianCoordinates(offset), circle2.getCartesianCoordinates(offset)) < 1)
        ) {
            points.push(circle);
        }
        return points;
    }, []);
    console.info('Stops', Stops);
    
    const Lines = routeData.features.map(route => new Line(route));
    console.info('Lines', Lines);

    const svg = document.querySelector('svg');
    svg.setAttribute('viewBox', `${[
        0,
        0,
        ...getCartesianCoordinates([offset.east, offset.south].map(adjustForSvg), offset)
    ]}`)

    Stops.forEach(Stop => {
        svg.appendChild(Stop.createNode(offset));
    });


    Lines.forEach(Line => {
        svg.appendChild(Line.createNode(offset));
    })

    // Render

}

main();