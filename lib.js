import {
    Geonames
} from "./apis.js";
import {
    PADDING,
    ACCEPTABLE_ANGLES,
    DISTANCE_THRESHOLD
} from "./constants.js";

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
    return Math.ceil(x / 45) * 45;
}

export function angleAndDegreesFromCoordinates(point1, point2) {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    const degrees = Math.atan2((y2 - y1), (x2 - x1)) * 180 / Math.PI;
    return degrees;
}

const adjustForSvg = n => Math.round(n * 2000);

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
    }, [90, 90, -90, -90]); // @TODO check different hemispheres.
}

export function setAttributes(attributes, node) {
    Object.keys(attributes).forEach(key => {
        node.setAttribute(key, `${attributes[key]}`);
    })
    return node;
}

function movePointAtAngle(point, angle, distance) {
    return [
        point[0] + (Math.sin(angle) * distance),
        point[1] - (Math.cos(angle) * distance)
    ];
}

export function getPointOnAngle(point1, point2) {
    const dist = Math.max(distance(point1, point2), 0.0075);

    const {
        newPoint
    } = ACCEPTABLE_ANGLES.reduce((acc, angle) => {
        const newPoint = movePointAtAngle(point1, angle, dist);
        const dist2 = distance(newPoint, point2);
        if (dist2 < acc.distance) {
            return {
                distance: dist2,
                newPoint
            }
        }
        return acc;
    }, {
        distance: 1000,
        newPoint: null
    });

    return newPoint;
}

export function SimplifyLine(points) {
    const newPoints = [...points];
    let tries = 0;
    const idealLength = Math.max(Math.ceil(points.length * .5), 2);

    while (newPoints.length >= idealLength && tries < 400) {
        tries++;
        for (let i = 0; i < newPoints.length && tries < 400; i++) {
            let point0 = points[i - 1];
            let point1 = points[i];
            let point2 = points[i + 1];

            if (!point2) {
                continue;
            }
            if (point0) {
                continue;
            }
            try {
                let dist = distance(point1, point2);
                let dist2 = distance(point1, point0);
            } catch (e) {
                console.trace('here');
            }

            if (dist < DISTANCE_THRESHOLD * 50) {
                point1 = [
                    (point1[0] + point2[0]) / 2,
                    (point1[1] + point2[1]) / 2
                ];
                newPoints.splice(i + 1, 1);
            } else {
                newPoints.splice(i, 1);
            }
        }
    }
    if (newPoints.length <= 1) {
        return [
            points[0],
            points[points.length - 1]
        ]
    }
    return newPoints;
    // return points.filter((point, index) => {
    //     if (index === 0 || index === points.length - 1) {
    //         return true;
    //     }
    //     if (
    //     ) {
    //     }
    //     return true;
    // })
}

export function SegmentToGrid(segments) {
    // First let's see if any are going from/to the same spots
    const sameDestinations = segments.reduce((sameDestinations, segment) => {
        const dup = segments.filter(segment2 => {
            (segment2[0] === segment[0] || segment2[0] === segment[segment.length - 1]) &&
            (segment2[1] === segment[0] || segment2[1] === segment[segment.length - 1])
        });
        if (dup) {
            sameDestinations.push([
                dup,
                segment
            ]);
        }
        return sameDestinations;
    }, []);

    console.log({
        sameDestinations
    });
    return segments;
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
    return Math.min(width / 200, height / 200);
}