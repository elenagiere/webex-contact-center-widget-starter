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
    @property({ type: String }) selectedState = "CA";
    @property({ type: String }) city = "Sunnyvale";
    @property({ type: String }) bedCapacity = "80%";
    @property({ type: String }) hospitalName = "Valley Health Center Sunnyvale";
    @property({ type: String }) hospitalAddress = "660 S Fair Oaks Ave, Sunnyvale, CA 94086";

    @property({ type: Number, reflect: true }) latitude = 37.405270;
    @property({ type: Number, reflect: true }) longitude = -122.012210;
    @property({ type: String, reflect: true }) search = "";
    @property({ type: Boolean, reflect: true, attribute: "search-enabled" })
    searchEnabled = false;
    @property({ type: String, reflect: true, attribute: "api-key" }) apiKey = "AIzaSyDWb7xO0Ms_1oJwb25tiKJU18r4dmj2mXY";
    @property({ type: Number, reflect: true }) zoom = 12;

    @internalProperty() map?: google.maps.Map;
    @internalProperty() markers?: google.maps.places.PlaceResult[];
    @internalProperty() nearestHospitalData?: any;

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

    firstUpdated(changeProperties: PropertyValues) {
        super.firstUpdated(changeProperties);
        this.initMap();
    }

    initMap = async () => {
        if (!this.map) {
          this.loader
            .load()
            .then(() => {
                if (this.mapDiv) {
                    this.map = new google.maps.Map(this.mapDiv, {
                    center: { lat: this.latitude, lng: this.longitude },
                    zoom: this.zoom,
                    mapTypeControl: false
                    });
                }
            })
            .then(() => this.hospitalLookup());
        }
      };

    hospitalLookup = async () => {
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
                console.log('[log] hospital lookup', results[0]);
                this.nearestHospitalData = results[0];
            });
        }
      };

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
                        ${`${this.city}, ${this.selectedState}`}
                    </span>
                    <span slot="split-right">${this.bedCapacity}</span>
                </md-badge>
                <div class="hospital row">
                    <span class="title">Hospital</span>
                    <span class="value">${this.nearestHospitalData?.name || this.hospitalName}</span>
                </div>
                <div class="address row">
                    <span class="title">Address</span>
                    <span class="value">${this.nearestHospitalData?.vicinity || this.hospitalAddress}</span>
                </div>
            </div>
            <div id="map"></div>
        </div>
        `;
    }
}
