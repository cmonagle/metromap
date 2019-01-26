import { SVG_NS, DISTANCE_THRESHOLD } from "./constants.js";
import { 
    getCartesianCoordinates,
    getBboxFromCoordinates,
    distance,
    setAttributes,
    SimplifyLine,
    getStrokeSize
} from "./lib.js";
export default class Line {
    constructor(TLRoute, Stops) {
        this.id = TLRoute.id;
        this.color = `#${TLRoute.properties.tags.route_color || '000'}`;
        this.name = TLRoute.properties.name;
        this.TLRoute = TLRoute;
        this.Stops = [];
        if (Stops) {
            this.getStopsOnLine(Stops);
        }
        this.segments = [];
        return this;
    }

    getLocalBbox() {
        return getBboxFromCoordinates(this.getCoordinates());
    }

    getCartesianCoordinates(bbox) {

        return this.getCoordinates()
            .map(segment => segment.map(
                point => getCartesianCoordinates(point, bbox))
            );
    }

    getCoordinates() {
        return this.TLRoute.geometry.coordinates;
    }
    createNode(bbox) {
        const path =
            this.getCartesianCoordinates(bbox).map(
                segment => segment.map(
                    (point, i) =>  i === 0
                        ? `M${point[0]},${point[1]}`
                        : `L${point[0]},${point[1]}`
                ).join(' ')
            ).join(' ');
        return setAttributes({
            d: path,
            stroke: this.color,
            name: this.name,
            fill: 'none',
            ['stroke-width']: getStrokeSize(bbox)
        }, document.createElementNS(SVG_NS, 'path'));
    }

    addNodeToSvg(svg) {
        const node = this.createNode();
        svg.appendChild(node);
        return node;        
    }

    getSegments() {
        const Stops = this.Stops;
        const Segments = Stops
            .reduce((Segments, Stop) => {
                const position = this.getStopPos(Stop);
                if (position === 0 ) {
                    Segments.push([Stop]);
                } else if (Stop.getLines().length > 1) {
                    Segments[Segments.length - 1].push(Stop);
                    Segments.push([Stop]);
                } else {
                    Segments[Segments.length - 1].push(Stop);
                }
                return Segments;
            }, []);
        this.Segments = Segments;
        return Segments;   
    }

    renderSegments(bbox) {
        return this.Segments.map(Segment => {
            const points = Segment.map(Stop => Stop.getCartesianCoordinates(bbox));

            return setAttributes({
                points,
                stroke: this.color,
                ['stroke-width']: 1
            }, document.createElementNS(SVG_NS, 'polyline'));
        })
    }

    getStopPos(Stop) {
        return this.Stops.findIndex(Stop2 => Stop === Stop2);
    }

    getStopsOnLine(Stops) {
        if (this.Stops.length) {
            return this.Stops;
        }

        const bbox = this.getLocalBbox();
        // This really should be simplified somehow.
        const polyline = this.createNode(bbox);
        const length = polyline.getTotalLength();
        for (let i = 0; i < length; i++) {

            // Loop through all of them at every point inand get them in order
            const { x,y } = polyline.getPointAtLength(i);
            if (x, y) {
                const Stop = Stops.find(Stop => 
                    // Close to the line
                    distance(Stop.getCartesianCoordinates(bbox), [x, y]) < DISTANCE_THRESHOLD 
                    //  Stop is serviced by this route
                    && Stop.routeIds.find(rteId => rteId === this.id)
                    // Not already in the array
                    && !this.Stops.some(Stop2 => Stop2.name === Stop.name)
                );
                if (Stop) {
                    Stop.addLine(this);
                    this.Stops.push(Stop)
                }
            }
        }
        return this.Stops;
    
    }
};