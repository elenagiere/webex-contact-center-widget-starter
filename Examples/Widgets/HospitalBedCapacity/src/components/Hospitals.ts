/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { html, LitElement, customElement, property, internalProperty, query, PropertyValues } from "lit-element";
import { Loader } from "@googlemaps/js-api-loader";
import styles from "./Hospitals.scss";

@customElement("my-hospital-stats")
export default class Hospitals extends LitElement {
    /**
     * Property apiKey
     * Access your API key from Google Maps Platform
     * https://cloud.google.com/maps-platform
     */
    @property({ type: String, reflect: true, attribute: "api-key" }) apiKey = "AIzaSyDWb7xO0Ms_1oJwb25tiKJU18r4dmj2mXY";
    @property({ type: Number, reflect: true }) latitude = 37.405270;
    @property({ type: Number, reflect: true }) longitude = -122.012210;
    @property({ type: String }) bedCapacity = "80%";

    @internalProperty() map?: google.maps.Map;
    @internalProperty() markers?: google.maps.places.PlaceResult[];
    @internalProperty() nearestHospitalData?: any;
    @internalProperty() allHospitalData?: Array<{ HOSPITAL_NAME: string, BED_UTILIZATION: number }> = [];

    @query("#map") mapDiv?: HTMLElement;
    @query("#pac-input") searchInput?: HTMLInputElement;

    @internalProperty() loader = new Loader({
        apiKey: this.apiKey,
        version: "weekly",
        libraries: ["places"]
    });

    connectedCallback() {
        super.connectedCallback();
        this.loader.apiKey = this.apiKey;
    }

    async firstUpdated(changeProperties: PropertyValues) {
        super.firstUpdated(changeProperties);
        await this.bedCapacityLookup().then(() => this.initMap());
    }


    // async updated(changeProperties: PropertyValues) {
    //     super.updated(changeProperties);

    //     if (changeProperties.has("nearestHospitalData")) {
    //         console.log('[log] updated nearestHospitalData', this.nearestHospitalData);
    //         this.hospitalLookup();
    //     }
    // }

    initMap = async () => {
        if (!this.map) {
          this.loader
            .load()
            .then(() => {
                if (this.mapDiv) {
                    this.map = new google.maps.Map(this.mapDiv, {
                    center: { lat: this.latitude, lng: this.longitude },
                    mapTypeControl: false
                    });
                }
            })
            // .then(() => this.nearestHospital())
            // .then(() => this.hospitalLookup());
        }
    };

    //   hospitalLookup = () => {
    //       console.log('[log] hospital Lookup', this.allHospitalData?.length);
    //       if (this.allHospitalData?.length) {
    //         const foundHospital = this.allHospitalData.filter((hospitalData: any) => {
    //             return hospitalData.HOSPITAL_NAME === this.nearestHospitalData?.name;
    //         }) as any;
    //         console.log('[log] foundHospital', foundHospital);
    //         this.bedCapacity = `${(foundHospital?.BED_UTILIZATION * 100)}%`;
    //       }
    //   }

    nearestHospital = async () => {
        if (this.map) {
            const places = new google.maps.places.PlacesService(this.map);
            places.nearbySearch({
                location: { lat: this.latitude, lng: this.longitude },
                // fields: ['formatted_address'],
                rankBy: google.maps.places.RankBy.DISTANCE,
                type: "hospital",
                keyword: "(emergency) AND ((medical centre) OR hospital)",
            },
            (results: any) => {
                console.log('[log] nearestHospital results', results);
                this.nearestHospitalData = results[0];
            });
        }
    };

    bedCapacityLookup = async () => {
        return await fetch("https://opendata.arcgis.com/datasets/1044bb19da8d4dbfb6a96eb1b4ebf629_0.geojson")
            .then((response) => {
                return response.json();
            }).then((data) => {
                console.log("[log] bedCapacity all", data);
                this.allHospitalData = data?.features;
                return data;
            });
    }

    static get styles() {
        return styles;
    }

    render() {
        return html`
        <div class="hosiptal-section">
            <div class="main-header">
                <span class="header-text">Hospital Bed Capacity</span>
                <md-button circle hasRemoveStyle><md-icon slot="icon" name="maximize_16"></md-icon></md-button>
            </div>
            <div class="body">
                <md-badge class="hospital-badge" color="mint" split>
                    <span slot="split-left">
                        ${`${"Sunnyvale"}, ${"CA"}`}
                    </span>
                    <span slot="split-right">${this.bedCapacity}</span>
                </md-badge>
                <div class="hospital row">
                    <span class="title">Hospital</span>
                    <span class="value">${this.nearestHospitalData?.name}</span>
                </div>
                <div class="address row">
                    <span class="title">Address</span>
                    <span class="value">${this.nearestHospitalData?.vicinity}</span>
                </div>
            </div>
            <div id="map"></div>
        </div>
        `;
    }
}
