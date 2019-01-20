/* global document */

import {SVG_NS} from './constants.js';
import { getCartesianCoordinates } from './lib.js';

export default class Circle {
    constructor(point) {
        this.name = point.properties.name;
        this.routeIds =
            point.properties.routes_serving_stop.map(route => route.route_onestop_id);
        this.coordinates = point.geometry.coordinates;

        this.Lines = [];

        this.getName = this.getName.bind(this);
        this.createNode = this.createNode.bind(this);
        this.getCoordinates = this.getCoordinates.bind(this);
        this.getCartesianCoordinates = this.getCartesianCoordinates.bind(this);
        this.addLine = this.addLine.bind(this);
        this.getPreviousStations = this.getPreviousStations.bind(this);
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

    getCartesianCoordinates(offset) {
        return getCartesianCoordinates(this.coordinates, offset);
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
    getPreviousStations() {
        return this.Lines.reduce((Stops, Line) => {
            if (Line.prevStop) {
                Stops.push(Line.prevStop);
            }
            return Stops;
        }, [])

    }
};