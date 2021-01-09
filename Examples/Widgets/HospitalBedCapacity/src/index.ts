/**
 * Copyright (c) Cisco Systems, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { html, LitElement, customElement, css, internalProperty, property } from "lit-element";
import "./components/Hospitals";

/**
 * Please give your widget a unique name. We recommend using prefix to identify the author and help avoid naming conflict. e.g. "2ring-timer-widget"
 */
@customElement("hospital-bed-capacity")
export default class HospitalBedCapacity extends LitElement {
  @property({ type: String }) selectedState = "CA";
  @property({ type: String }) city = "Sunnyvale";
  @property({ type: String }) bedCapacity = "80%";
  @property({ type: String }) hospitalName = "Valley Health Center Sunnyvale";
  @property({ type: String }) hospitalAddress = "660 S Fair Oaks Ave, Sunnyvale, CA 94086";
  
  @internalProperty() private contacts: string[] = [];
  
  static get styles() {
    return css`
      :host {
        display: block;
        height: 100%;
        position: relative;
        overflow: auto;
      }
    `;
  }

  render() {
    return html`
      <my-hospital-stats
        selectedState=${this.selectedState}
        city=${this.city}
        bedCapacity=${this.bedCapacity}
        hospitalName=${this.hospitalName}
        hospitalAddress=${this.hospitalAddress}>
      </my-hospital-stats>
    `;
  }
}
