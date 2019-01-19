
export async function getCityBbox(city) {
    const GEONAMES = name => `http://api.geonames.org/searchJSON?q=${name}&inclBbox=true&maxRows=1&username=cmonagle`;
    if (!localStorage.getItem(city)) {
        const response = await fetch(GEONAMES(city));
        const data = await response.json();
        localStorage.setItem(city, JSON.stringify(data));
    }

    const {south, west, north, east} = JSON.parse(localStorage.getItem(city)).geonames[0].bbox;
    return [west,south, east,north];
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

export function getCartesianCoordinates(point, bbox) {
    return [
            point[0] - bbox[0],
            bbox[3] - point[1]
        ]
        .map(n => n * 2000)
        .map(n => n.toFixed());
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