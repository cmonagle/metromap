import {
    getCityBbox,
    getBboxFromCoordinates,
    getSvgCoordinates,
    getParamsFromUrl,
    distance
} from './lib.js';
import {
    TransitLand
} from './apis.js';
import UI from './ui.js';
import { makeSvg, drawFeatures, updateSvg } from './draw-features.js';
import { DISTANCE_THRESHOLD } from './constants.js';

/**
 * @typedef Stop
 * @type {object}
 * @property {Coordinates} coordinates - lat/long coordinates.
 * @property {Coordinates} svgCoordinates - svg cooridnates
 * @property {string} name - all names for the stop.
 * @property {Line[]} linesServiced - lines the stop services.
 */

 /**
 * @typedef Line
 * @type {object}
 * @property {number[][]} coordinates - lat/long coordinates of each point.
 * @property {string} name.
 * @property {string} color - hex code for color
 * @property {Stop[]} stopsServiced - stops the line services.
 */

export default async function main() {
    
    const {
        city,
        modes,
    } = getParamsFromUrl(window.location.href);

    if (!city) {
        UI.setShowForm(true);
        return null;
    };

    UI.setLoading(true);
    UI.setShowForm(false);
    
    const cityBbox = await getCityBbox(city);
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
    
    /**
     * @type {Line}
     */
    const lines = routeData.features.map(({geometry, properties}) => {
        // TransitLand provides each line twice, for each direction.
        // For now, we're going to ignore the second line and assume it follows
        // the same route and services the same stops on both directions.
        const coordinates = geometry.coordinates[0].map(coords => getSvgCoordinates(coords, cityBbox));

        return {
            coordinates,
            name: properties.name,
            color: `#${properties.color}`,
            stopsServiced: properties.stops_served_by_route.map(stopServed => stopServed.stop_name)
        };
    })

    /**
     * @type {Stop[]}
     */
    const stops = stopData.features.reduce((stops, {geometry, properties}) => {
        const svgCoordinates = getSvgCoordinates(geometry.coordinates, cityBbox);
        const coordinates = geometry.coordinates;
        // Is this stop a duplicate?
        const originalStop = stops.filter(p2 =>
            distance(svgCoordinates, p2.svgCoordinates) < DISTANCE_THRESHOLD
        );
        if (originalStop.length) {
            return stops;
        }
        stops.push({
            coordinates,
            svgCoordinates,
            name: properties.name
        });

        return stops;
    }, []);
    console.info('Transformed stops', stops);
    const bbox = updateBbox(stops);
    const svg = makeSvg(bbox);
    const drawFeatures2 = drawFeatures(bbox, svg);

    stops.forEach(drawFeatures2.drawStop);
    UI.setLoading(false);

    let count = 0;

    function move() {
        moveStops(stops, bbox);
        // const newBbox = updateBbox(stops, svg);
        // updateSvg(newBbox, svg);
        stops.forEach(drawFeatures2.updateStop);
        count++;
        if (count < 600) {
            window.requestAnimationFrame(move);
        }
    }

    window.requestAnimationFrame(move);
}

main();

function updateBbox(stops) {
    const stopPoints = stops.map(stop => stop.coordinates);
    const bbox = getBboxFromCoordinates(stopPoints);
    stops.forEach(stop => {
        stop.svgCoordinates = getSvgCoordinates(stop.coordinates, bbox);
    });
    return bbox;

}
/**
 * 
 * @param {Stop} stop 
 * @param {Stop} stop2 
 */
function findSpot(stop, stop2) {
    const [x, y] = stop.svgCoordinates;
    const [x2, y2] = stop2.svgCoordinates;

    const xDistance = x2 - x;
    const yDistance = y2 - y;
    if (xDistance < 0 && xDistance < -10) {
        stop.svgCoordinates[0] = x - 1
    } else if (xDistance > 10) {
        stop.svgCoordinates[0] = x + 1
    }

    if (yDistance < 0 && yDistance < -10) {
        stop.svgCoordinates[1] = y + 1;
    } else if (yDistance > 10) {
        stop.svgCoordinates[1] = y - 1;
    }
}
/**
 * 
 * @param {Stop[]} stop 
 */
function moveStops(stops) {
    stops.forEach(stop => {
        const closest = stops.reduce((closest, stopToCompare) => {
            if (stopToCompare.name === stop.name) {
                return closest;
            }
            const thisDistance = distance(stop.svgCoordinates, stopToCompare.svgCoordinates)
            if (thisDistance < closest.distance && stop.name !== closest.stop.name) {
                return {
                    coordinates: stopToCompare.svgCoordinates,
                    distance: thisDistance,
                    stop: stopToCompare
                };
            }
            return  closest;
        }, {coordinates: [], distance: 99999, stop: {}});
        // console.log(`${stop.name} is closest to ${closest.stop.name}, they are ${distance(closest.coordinates, stop.svgCoordinates)} units apart`);
        if (distance(closest.coordinates, stop.svgCoordinates) < 20) {

            const [x1, y1] = stop.svgCoordinates;
            const [x2, y2] = closest.coordinates;
            let newX, newY;
            if (x1 < x2 && Math.abs(x1 - x2) < 3) {
                newX = x1 + 1;
            } else if (x1 < x2 && Math.abs(x1 - x2) > 3) {
                newX = x1 - 1;
            } else {
                newX = x1;
            }

            if (y1 < y2 && Math.abs(y1 - y2) < 3) {
                newY = y1 + 1;
            } else if  (y1 < y2 && Math.abs(y1 - y2) > 3) {
                newY = y1 - 1;
            } else {
                newY = y1;
            }
            stop.svgCoordinates = [
                newX, newY
            ]
        }

    })
}