import { getCartesianCoordinates, adjustForSvg } from "./lib.js";
import { SVG_NS } from "./constants.js";

export default class Line {
    constructor(TLRoute) {
        this.id = TLRoute.id;
        this.color = `#${TLRoute.properties.tags.route_color}`;
        this.name = TLRoute.properties.name;
        this.TLRoute = TLRoute;

        this.getLocalBbox = this.getLocalBbox.bind(this); // just while working
        this.getCartesianCoordinates = this.getCartesianCoordinates.bind(this);
        this.getCoordinates = this.getCoordinates.bind(this);
        this.createNode = this.createNode.bind(this);
        this.addNodeToSvg = this.addNodeToSvg.bind(this);
        this.getStopsOnLine = this.getStopsOnLine.bind(this);
        return this;
    }

    getLocalBbox() {
        const coordinates = this.getCoordinates();
    }

    getCartesianCoordinates(offset) {
        return this.getCoordinates()
            .map(point => getCartesianCoordinates(point, offset));
    }

    getCoordinates() {
        return this.TLRoute.geometry.coordinates[0];
    }

    createNode(offset) {
        const polyline = document.createElementNS(SVG_NS, 'polyline');
        const routePoints = this.getCartesianCoordinates(offset);
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

    getStopsOnLine(stops, offset) {
        const polyLine = createNode(offset)
        const length = polyline.getTotalLength();
        let routeStops = [];
    
        for (let i = 0; i < length; i++) {
            // Loop through all of them at every point inand get them in order
            const { x,y } = polyline.getPointAtLength(i);
            
            const stopsOnLine =
                stops.filter(stop =>
                    distance(stop.coordinates, [x, y]) < 2 // Close to the line
                    && !routeStops.some(stp => stp.name === stop.name) // Not already in the array
                    && stop.routes.find(rteId => rteId === id) //  Stop is serviced by this route
                );
    
            routeStops = routeStops.concat([], stopsOnLine);
        }
    
        return routeStops;
    
    }
};