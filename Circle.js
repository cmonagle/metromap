/* global document */

import {SVG_NS} from './constants.js';
import { getCartesianCoordinates, setAttributes, getPointOnAngle, getStrokeSize } from './lib.js';

export default class Circle {
    constructor(point) {
        this.name = point.properties.name;
        this.routeIds =
            point.properties.routes_serving_stop.map(route => route.route_onestop_id);
        this.coordinates = point.geometry.coordinates;

        this.Lines = [];

        return this;
    }

    createNode(bbox) {
        const [x, y] = this.getCartesianCoordinates(bbox);
        const node = document.createElementNS(SVG_NS, 'text');
        node.innerHTML = this.name;
        return setAttributes({
            x,
            y,
        }, node);
    }
    getCoordinates() {
        return this.coordinates;
    }
    setCoordinates(coordinates) {
        this.coordinates = coordinates;
    }

    getCartesianCoordinates(bbox) {
        return getCartesianCoordinates(this.coordinates, bbox);
    }

    getName() {
        return this.name;
    }

    addLine(Line) {
        this.Lines.push(Line);
    }

    getLines() {
        return this.Lines;
    }

    evenOut() {
        
    }

    straightenOut() {
        this.getStopRels().forEach(Line => {
            if (Line.prevStop) {
                const newPoint = getPointOnAngle(Line.prevStop.getCoordinates(), this.getCoordinates())
                this.setCoordinates(newPoint);
            }
        });
    }

    createLineNodes(bbox) {
        const previousStations = this.getPreviousStations();
        const [x1, y1] = this.getCartesianCoordinates(bbox);
        return previousStations.map(({Line, prevStop}) => {

            let node = document.createElementNS(SVG_NS, 'line');
            const [x2, y2] = prevStop.getCartesianCoordinates(bbox);
            setAttributes({
                x1, x2, y1, y2,
                stroke: Line.color,
                name: this.name,
                ['stroke-width']: 4
            }, node);
            return node;
        })
    }

    getPreviousStations() {
        return this.stopRels.filter(stopRel => !!stopRel.previousStop);
    };
};