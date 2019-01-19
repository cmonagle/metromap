
export async function getCityBbox(city) {
    const GEONAMES = name => `http://api.geonames.org/searchJSON?q=${name}&inclBbox=true&maxRows=1&username=cmonagle`;
    if (!localStorage.getItem(city)) {
        const response = await fetch(GEONAMES(city));
        const data = await response.json();
        localStorage.setItem(city, JSON.stringify(data));
    }

    const {south, west, north, east} = JSON.parse(localStorage.getItem(city)).geonames[0].bbox;
    return {south, west, east, north};
}

export function bboxToViewBox(bbox) {
    return [
        0,
        0,
        ...getCartesianCoordinates(
            [bbox[2], bbox[1]],
            bbox
        )
    ]
};

export function getCartesianCoordinates(point, offset) {
    const [x, y] = point.map(adjustForSvg);
    return [
        x - offset.east,
        y - offset.north
    ];
};

export function distance(point1, point2) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    var a = x1 - x2;
    var b = y1 - y2;

    return Math.sqrt(a * a + b * b);
};

export function angleAndDegreesFromCoordinates(point1, point2) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    const degrees = Math.atan2((y2 - y1), (x2 - x1)) * 180 / Math.PI;
    return degrees;
}

export async function TransitLand(endpoint, options) {
    const TRANSITLAND_BASE_URL = 'https://transit.land/api/v1/';

    const key = JSON.stringify({
        endpoint,
        ...options
    });

    // use local storage if possible
    if (localStorage.getItem(key)) {
        return JSON.parse(localStorage.getItem(key));
    }

    const res =
        await fetch(`
            ${TRANSITLAND_BASE_URL}
            ${endpoint}.geojson/?
            ${Object
                .keys(options)
                .map(key => `${key}=${options[key]}`)
                .join('&')
            }
            `.replace(/\s/g, '') // remove whitespace
        ); 

    const data = await res.json();

    localStorage.setItem(key, JSON.stringify(data));
    return data;
};

export function adjustForSvg(no) {
    no = no * 2000;
    no = no.toFixed();
    return no;
}

export function getOffset(coordinates) {
    const offset = coordinates.reduce((extremes, point) => {
        const {north, south, east, west} = extremes;
        const [x, y] = point;
        return {
            east: Math.min(east, x),
            north: Math.max(north, y),
            west: Math.min(west, x),
            south: Math.max(south, y)
        }
    }, {
        east: 90,
        north: -90,
        west: 90,
        south: -90
    });

    Object.keys(offset).forEach(key=> offset[key] = adjustForSvg(offset[key]));
    return offset;
}