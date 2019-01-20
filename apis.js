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


export async function Geonames(city){
    const GEONAMES = name => `http://api.geonames.org/searchJSON?q=${name}&inclBbox=true&maxRows=1&username=cmonagle`;
    if (!localStorage.getItem(city)) {
        const response = await fetch(GEONAMES(city));
        const data = await response.json();
        localStorage.setItem(city, JSON.stringify(data));
        return data;
    }
    return JSON.parse(localStorage.getItem(city)).geonames[0].bbox;
}
