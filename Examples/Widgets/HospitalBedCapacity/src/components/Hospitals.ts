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
     * Property googleApiKey
     * Access your API key from Google Maps Platform
     * https://cloud.google.com/maps-platform
     */
    @property({ type: String, reflect: true, attribute: "google-api-key" }) googleApiKey = "";
    /**
    * Property: covidApiKey
    * Access API Key: Covid Act Now Website
    * https://apidocs.covidactnow.org/access
    */
    @property({ type: String, reflect: true, attribute: "covi-api-key" }) covidApiKey = "";
    @property({ type: Number, reflect: true }) latitude = 40.405270;
    @property({ type: Number, reflect: true }) longitude = -123.012210;
    @property({ type: String }) bedCapacity = "";

    @internalProperty() statePostal = "";
    @internalProperty() county = "";
    @internalProperty() areaCode = "";

    @internalProperty() hospitalName = "";
    @internalProperty() hospitalAddress = "";

    @internalProperty() map?: google.maps.Map;
    @internalProperty() markers?: google.maps.places.PlaceResult[];
    @internalProperty() nearestHospitalData?: any;
    @internalProperty() allHospitalData?: Array<{ HOSPITAL_NAME: string, BED_UTILIZATION: number }> = [];

    @query("#map") mapDiv?: HTMLElement;
    @query("#pac-input") searchInput?: HTMLInputElement;

    @internalProperty() loader = new Loader({
        apiKey: this.googleApiKey,
        version: "weekly",
        libraries: ["places"]
    });

    connectedCallback() {
        super.connectedCallback();
        this.loader.apiKey = this.googleApiKey;
    }

    async firstUpdated(changeProperties: PropertyValues) {
        super.firstUpdated(changeProperties);
        await this.fetchAllCounties()
        .then(() => {
            this.initMap().then(() => this.fetchCountyBedCapacity());
        });
    }

    async update(changeProperties: PropertyValues) {
        super.update(changeProperties);

        if (changeProperties.has("latitude") ||
        changeProperties.has("longitude")) {
            await this.initMap().then(() => this.fetchCountyBedCapacity());
        }

        if (changeProperties.has("nearestHospitalData") ||
            changeProperties.has("areaCode") ||
            changeProperties.has("statePostal")) {
                console.log('[log] update');
                this.hospitalAddress = `${this.nearestHospitalData?.vicinity}, ${this.statePostal} ${this.areaCode}`;
        }
    }

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
            .then(() => this.nearestHospital());
        }
    };

    getFormattedAddress = (location: {lat: number, lng: number}) => {
        return new google.maps.Geocoder().geocode({
            location
        }, (results: any) => {
            const address = results[0].address_components;
            if (address) {
                this.county = address[3].short_name;
                this.statePostal = address[4].short_name;
                this.areaCode = address[6].short_name;
                console.log('[log] county/statePostal', this.county, this.statePostal, this.areaCode);
            }
        });
    };

    nearestHospital = async () => {
        if (this.map) {
            const places = new google.maps.places.PlacesService(this.map);
            places.nearbySearch({
                location: { lat: this.latitude, lng: this.longitude },
                rankBy: google.maps.places.RankBy.DISTANCE,
                type: "hospital",
                keyword: "(emergency) AND ((medical centre) OR hospital)",
            },
            (results: any) => {
                console.log('[log] nearestHospital results', results);
                this.nearestHospitalData = results[0];
                this.hospitalName = this.nearestHospitalData?.name;
                this.getFormattedAddress(this.nearestHospitalData?.geometry?.location);
            });
        }
    };

    fetchAllCounties = async () => {
        return await fetch(
          `https://api.covidactnow.org/v2/counties.json?apiKey=${this.covidApiKey}`
        )
          .then((response) => {
            return response.json();
          })
          .then((allUSACounties) => {
            return allUSACounties;
        });
      };

      fetchCountyBedCapacity = async () => {
        return await fetch(
          `https://api.covidactnow.org/v2/counties.json?apiKey=${this.covidApiKey}`
        )
          .then((response) => {
            return response.json();
          })
          .then((allUSACounties) => {
            const countyResults = allUSACounties.filter((countyData: { state: string; county: string; }) => {
                return this.statePostal === countyData.state && this.county === countyData.county;
            });
            return countyResults[0];
          })
          .then((countyData) => {
              console.log('[log] countyData ', countyData);
              const { currentUsageTotal, capacity } = countyData?.actuals?.hospitalBeds;
              const percentage = `${((currentUsageTotal / capacity) * 100).toFixed(0)}%`;
              this.bedCapacity = percentage;
          });
      };  

    // fetchCountyBedCapacity = async () => {
    //     return await fetch(
    //       `https://api.covidactnow.org/v2/counties.json?apiKey=${this.covidApiKey}`
    //     )
    //       .then((response) => {
    //         return response.json();
    //       })
    //       .then((allUSACounties) => {
    //         const countyResults = allUSACounties.filter((countyData: { state: string; county: string; }) => {
    //             return this.statePostal === countyData.state && this.county === countyData.county;
    //         });
    //         return countyResults[0];
    //       })
    //       .then((countyData) => {
    //           console.log('[log] countyData ', countyData);
    //           const { currentUsageTotal, capacity } = countyData?.actuals?.hospitalBeds;
    //           const percentage = `${((currentUsageTotal / capacity) * 100).toFixed(0)}%`;
    //           this.bedCapacity = percentage;
    //       });
    //   };

    static get styles() {
        return styles;
    }

    render() {
        return html`
        <div class="hosiptal-section">
            <div class="body">
                <md-badge class="hospital-badge" color="mint" split>
                    <span slot="split-left">
                        ${`${this.county}, ${this.statePostal}`}
                    </span>
                    <span slot="split-right">${this.bedCapacity}</span>
                </md-badge>
                <div class="hospital row">
                    <span class="title">Hospital</span>
                    <span class="value">${this.hospitalName}</span>
                </div>
                <div class="address row">
                    <span class="title">Address</span>
                    <span class="value">${this.hospitalAddress}</span>
                </div>
            </div>
            <div id="map"></div>
        </div>
        `;
    }
}
