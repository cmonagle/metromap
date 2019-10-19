import { SVG_NS } from "./constants.js"
import { bboxToViewBox, getSvgCoordinates, getStrokeSize } from "./lib.js";
/**
 * 
 * @param {object} attrs 
 * @param {HTMLElement} el
 * @returns el;
 */
function setAttributes(attrs = {}, el) {
    Object.keys(attrs).forEach(key => {
        el.setAttribute(key, attrs[key]);
    });
    return el;
}

/**
 * 
 * @param {string} name
 * @param {object} properties
 * @returns {HTMLElement}
 */
function makeSvgElement(name, properties = {}) {
    return setAttributes(properties, document.createElementNS(SVG_NS, name));
}

/**
 * 
 * @param {Bbox} bbox 
 * @param {HTMLElement} svgEl 
 */
export function drawFeatures(bbox, svgEl) {

    return {
        /**
         * 
         * @param {Stop} stop 
         */
        drawStop(stop) {
            const [cx, cy] = stop.svgCoordinates;
            const circle = makeSvgElement('circle', {
                cx, cy,
                r: getStrokeSize(bbox),
                fill: "red",
                name: stop.name
            });
            svgEl.appendChild(circle);
        },
        /**
         * 
         * @param {Stop} stop
         */
        updateStop(stop) {
            const stopEl = svgEl.querySelector(`[name="${stop.name}"]`);
            const [cx, cy] = stop.svgCoordinates;
            stopEl.setAttribute('cx', cx);
            stopEl.setAttribute('cy', cy);
        }
    }
}

export function makeSvg(bbox) {
    const viewBox = bboxToViewBox(bbox);
    const svg = makeSvgElement('svg', {
        viewBox: viewBox.join(' '),
        width: viewBox[2],
        height: viewBox[3]
    });
    const poster = document.querySelector('.poster');
    poster.appendChild(svg);
    return svg;
}

export function updateSvg(bbox, svg) {
    const viewBox = bboxToViewBox(bbox);
    setAttributes({
        viewBox: viewBox.join(' '),
        width: viewBox[2],
        height: viewBox[3]
    }, svg);
}