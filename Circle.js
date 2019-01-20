/* global document */

import {SVG_NS} from './constants.js';
import { getCartesianCoordinates, setAttributes, angleAndDegreesFromCoordinates, round45 } from './lib.js';

export default class Circle {
    constructor(point) {
        this.name = point.properties.name;
        this.routeIds =
            point.properties.routes_serving_stop.map(route => route.route_onestop_id);
        this.coordinates = point.geometry.coordinates;

        this.Lines = [];
        this.connections = [];

        this.getName = this.getName.bind(this);
        this.createNode = this.createNode.bind(this);
        this.getCoordinates = this.getCoordinates.bind(this);
        this.setCoordinates = this.setCoordinates.bind(this);
        this.getCartesianCoordinates = this.getCartesianCoordinates.bind(this);
        this.addLine = this.addLine.bind(this);
        this.getPreviousStations = this.getPreviousStations.bind(this);
        this.createLineNodes = this.createLineNodes.bind(this);
        return this;
    }

    createNode(offset) {
        const [x, y] = this.getCartesianCoordinates(offset);
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('r', '3');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);

        return circle;
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

    addLine(Line, order, prevStop) {
        this.Lines.push({
            order,
            prevStop,
            Line
        });
    }

    getLines() {
        return this.Lines;
    }

    straightenOut() {
        const Line = this.getLines()[0];
        if (Line.prevStop) {
            const [x, y] = this.getCoordinates();
            const [x2, y2] = Line.prevStop.getCoordinates();

            const angle = angleAndDegreesFromCoordinates([x, y], [x2, y2]);
            // const idealAngle = round45(angle);
    
            // console.log(angle, idealAngle);

            let xDif = Math.abs(x2 - x);
            let yDif = Math.abs(y2 - y);

            this.setCoordinates(xDif > yDif ? [x, y2] :[x2, y]);
        }

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
                ['stroke-width']: 4
            }, node);
            return node;
        })
    }

    getPreviousStations() {
        return this.Lines.filter(Line => !!Line.prevStop);
    };
};