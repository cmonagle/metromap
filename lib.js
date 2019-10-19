import { Geonames } from "./apis.js";
import { PADDING } from "./constants.js";

/**
 * 
 * @typedef Coordinates
 * @type {number[]} - Length of 2
 */
/**
 * 
 * @typedef Bbox
 * @type {number[]} - Length of 4: 0 west 1 south 2east 3north
 */

export async function getCityBbox(city) {
    const {
        geonames
    } = await Geonames(city);
    const {
        south,
        west,
        north,
        east
    } = geonames[0].bbox;
    return [west, south, east, north];
}

/**
 * 
 * @param {Bbox} bbox
 * @returns {Bbox}
 */
export function bboxToViewBox(bbox) {
    const [width, height] = getSvgCoordinates(
        [bbox[2], bbox[1]],
        bbox
    );
    return [
        width * -PADDING,
        height * -PADDING,
        width + (width * PADDING * 2),
        height + (height * PADDING * 2)
    ].map(Math.round);
};
/**
 * 
 * @param {Coordinates} point 
 * @param {number[]} bbox 
 * @returns {Coordinates}
 */
export function getSvgCoordinates(point, bbox) {
    return [
            point[0] - bbox[0],
            bbox[3] - point[1]
        ]
        .map(adjustForSvg);
};
/**
 * 
 * @param {Coordinates} point1 
 * @param {Coordinates} point2 
 * @returns {number}
 */
export function distance(point1, point2) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    var a = x1 - x2;
    var b = y1 - y2;

    return Math.sqrt(a * a + b * b);
};

const adjustForSvg = n => Math.round(n * 2000);

/**
 * 
 * @param {Coordinates[]} coordinates 
 */
export function getBboxFromCoordinates(coordinates) {
    return coordinates.reduce((extremes, point) => {
        const [west, south, east, north] = extremes;
        const [x, y] = point;
        return [
            Math.min(west, x),
            Math.min(south, y),
            Math.max(east, x),
            Math.max(north, y)
        ]

    }, [180, 90, -180, -90]); // @TODO check different hemispheres.
}

export function getParamsFromUrl(address) {
    const url = new URL(address);
    return {
        city: url.searchParams.get("city"),
        modes: url.searchParams.getAll("mode"),
        showStops: url.searchParams.get("stops") === 'on'
    }
}
// 0w 1s 2e 3n
export function getStrokeSize(bbox) {
    
    const [_, __, width, height] = bboxToViewBox(bbox)
    return Math.round(Math.min(width / 100, height / 100));
}