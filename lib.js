import { Geonames } from "./apis.js";
import { PADDING } from "./constants.js";

export async function getCityBbox(city) {
    const {south, west, north, east} = await Geonames(city);
    return [west,south, east,north];
}

// 0w 1s 2e 3n
export function bboxToViewBox(bbox) {
    const [width, height] = getCartesianCoordinates(
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

export function getCartesianCoordinates(point, bbox) {
    return [
            point[0] - bbox[0],
            bbox[3] - point[1]
        ]
        .map(adjustForSvg);
};

export function distance(point1, point2) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    var a = x1 - x2;
    var b = y1 - y2;

    return Math.sqrt(a * a + b * b);
};

export function round45(x) {
    return Math.ceil(x/45) * 45;
}

export function angleAndDegreesFromCoordinates(point1, point2) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    const degrees = Math.atan2((y2 - y1), (x2 - x1)) * 180 / Math.PI;
    return degrees;
}

const adjustForSvg = no => Math.round(no * 2000);

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
    }, [90,90, -90, -90]); // @TODO check different hemispheres.
}

export function setAttributes(attributes, node) {
    Object.keys(attributes).forEach(key => {
        node.setAttribute(key, attributes[key]);
    })
}