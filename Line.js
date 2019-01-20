import { getCartesianCoordinates, getBboxFromCoordinates, distance, bboxToViewBox } from "./lib.js";
import { SVG_NS, DISTANCE_THRESHOLD } from "./constants.js";

export default class Line {
    constructor(TLRoute) {
        this.id = TLRoute.id;
        this.color = `#${TLRoute.properties.tags.route_color}`;
        this.name = TLRoute.properties.name;
        this.TLRoute = TLRoute;

        this.routeStops = [];

        this.getLocalBbox = this.getLocalBbox.bind(this); // just while working
        this.getCartesianCoordinates = this.getCartesianCoordinates.bind(this);
        this.getCoordinates = this.getCoordinates.bind(this);
        this.createNode = this.createNode.bind(this);
        this.addNodeToSvg = this.addNodeToSvg.bind(this);
        this.getStopsOnLine = this.getStopsOnLine.bind(this);
        return this;
    }

    getLocalBbox() {
        return getBboxFromCoordinates(this.getCoordinates());
    }

    getCartesianCoordinates(bbox) {
        return this.getCoordinates()
            .map(point => getCartesianCoordinates(point, bbox));
    }

    getCoordinates() {
        return this.TLRoute.geometry.coordinates[0];
    }

    createNode(bbox) {
        const polyline = document.createElementNS(SVG_NS, 'polyline');
        const routePoints = this.getCartesianCoordinates(bbox);
        polyline.setAttribute("points", routePoints.join(' '));
        polyline.setAttribute("stroke", this.color);
        polyline.setAttribute('name', this.name)
        return polyline;
    }

    addNodeToSvg(svg) {
        const node = this.createNode();
        svg.appendChild(node);
        return node;        
    }

    getStopsOnLine(Stops, bbox) {
        const polyline = this.createNode(bbox);
        const length = polyline.getTotalLength();

        let order = 0;
        for (let i = 0; i < length; i++) {
            // Loop through all of them at every point inand get them in order
            const { x,y } = polyline.getPointAtLength(i);
            const Stop = Stops.find(Stop => 
                distance(getCartesianCoordinates(Stop.coordinates, bbox), [x, y]) < DISTANCE_THRESHOLD // Close to the line
                && Stop.routeIds.find(rteId => rteId === this.id) //  Stop is serviced by this route
                && !this.routeStops.some(stp => stp.name === Stop.name) // Not already in the array
            );
            if (Stop) {
                order++;
                Stop.addLine(this, order, this.routeStops[this.routeStops.length - 1]);
                this.routeStops.push(Stop);
            }
        }
    
        return this.routeStops;
    
    }
};